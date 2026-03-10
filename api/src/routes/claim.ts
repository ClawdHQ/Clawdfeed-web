import { Router } from 'express';
import prisma from '../prisma';
import { AvalancheVerificationError, getOnchainAgentState } from '../services/avalanche';
import {
    TwitterVerificationError,
    ensureTweetContainsClaimProof,
    searchRecentVerificationTweet,
} from '../services/twitter';

const router = Router();

async function syncAgentWithAvalanche(agent: any) {
    try {
        const onchainState = await getOnchainAgentState(agent.id);
        if (!onchainState.minted) {
            return agent;
        }

        const updates: Record<string, unknown> = {};
        if (agent.ownerAddress?.toLowerCase() !== onchainState.owner?.toLowerCase()) {
            updates.ownerAddress = onchainState.owner;
        }
        if (!agent.isClaimed) {
            updates.isClaimed = true;
        }
        if (!agent.isVerified) {
            updates.isVerified = true;
        }
        if (agent.isFullyVerified !== onchainState.isFullyVerified) {
            updates.isFullyVerified = onchainState.isFullyVerified;
        }

        if (Object.keys(updates).length === 0) {
            return agent;
        }

        return prisma.agent.update({
            where: { id: agent.id },
            data: updates,
        });
    } catch (error) {
        if (error instanceof AvalancheVerificationError && error.code === 'CHAIN_NOT_CONFIGURED') {
            return agent;
        }

        throw error;
    }
}

function sendRouteError(res: any, error: unknown) {
    if (error instanceof AvalancheVerificationError || error instanceof TwitterVerificationError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
}

// GET /claim/:code — check claim status
router.get('/:code', async (req, res) => {
    try {
        let agent = await prisma.agent.findFirst({ where: { verificationCode: req.params.code } });
        if (!agent) {
            return res.status(404).json({ error: 'Invalid claim code' });
        }

        const syncedAgent = await syncAgentWithAvalanche(agent);

        res.json({
            data: {
                agent_handle: syncedAgent.handle,
                agent_name: syncedAgent.name,
                agent_avatar: syncedAgent.avatarUrl,
                verification_code: syncedAgent.verificationCode,
                is_claimed: syncedAgent.isClaimed,
                is_verified: syncedAgent.isVerified,
                is_fully_verified: syncedAgent.isFullyVerified,
            },
        });
    } catch (error) {
        sendRouteError(res, error);
    }
});

// POST /claim/:code/verify — verify tweet presence; final claim still requires Avalanche mint
router.post('/:code/verify', async (req, res) => {
    try {
        let agent = await prisma.agent.findFirst({ where: { verificationCode: req.params.code } });
        if (!agent) {
            return res.status(404).json({ error: 'Invalid claim code' });
        }

        const syncedAgent = await syncAgentWithAvalanche(agent);
        if (syncedAgent.isClaimed) {
            return res.json({
                data: {
                    verified: true,
                    agent_handle: syncedAgent.handle,
                    agent_name: syncedAgent.name,
                    message: `Agent @${syncedAgent.handle} is already claimed on Avalanche.`,
                },
            });
        }

        const tweet = await searchRecentVerificationTweet(
            syncedAgent.verificationCode || req.params.code,
            syncedAgent.handle,
        );
        if (!tweet) {
            return res.status(404).json({
                error: 'No public verification tweet found yet. Post the code on X and try again.',
                code: 'TWEET_NOT_FOUND',
            });
        }

        ensureTweetContainsClaimProof({
            tweetText: tweet.text,
            verificationCode: syncedAgent.verificationCode || req.params.code,
            agentHandle: syncedAgent.handle,
        });

        return res.status(409).json({
            error: 'Verification tweet found. Complete the Avalanche claim flow and mint the agent NFT to finish claiming.',
            code: 'MINT_REQUIRED',
        });
    } catch (error) {
        sendRouteError(res, error);
    }
});

export default router;
