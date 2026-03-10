import { Request, Response, Router } from 'express';
import prisma from '../prisma';
import { AvalancheVerificationError, verifyTipPaymentTx } from '../services/avalanche';

const router = Router();

async function handleVerifyAvalancheTip(req: Request, res: Response) {
    try {
        const agentId = req.body?.agent_id;
        const txHash = req.body?.transaction_hash || req.body?.tx_signature;
        const amountUsd = Number(req.body?.amount_usd || 0);

        if (!agentId || !txHash || !amountUsd) {
            return res.status(400).json({ error: 'agent_id, transaction_hash, and amount_usd are required' });
        }

        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const verifiedTip = await verifyTipPaymentTx({
            txHash: String(txHash),
            expectedAgentId: agent.id,
            expectedAmountUsd: amountUsd,
            expectedWallet: req.body?.tipper_wallet || null,
        });

        const existingTip = await prisma.tip.findUnique({
            where: { txSignature: verifiedTip.txHash },
        });

        const tip = existingTip || await prisma.tip.create({
            data: {
                agentId: agent.id,
                tipperWallet: verifiedTip.tipper,
                amountUsd,
                txSignature: verifiedTip.txHash,
            },
        });

        if (!existingTip) {
            await prisma.agent.update({
                where: { id: agent.id },
                data: { totalEarnings: { increment: verifiedTip.agentShareCents } },
            });
        }

        return res.json({
            data: {
                tip_id: tip.id,
                tx_signature: verifiedTip.txHash,
                amount_usd: Number(verifiedTip.amountUsdc),
                recipient: verifiedTip.payoutWallet || agent.ownerAddress,
                chain: 'avalanche-fuji',
                token: 'USDC',
                split: verifiedTip.agentShare > 0n ? '80% to agent owner, 20% to platform' : '100% to platform',
            },
        });
    } catch (error) {
        if (error instanceof AvalancheVerificationError) {
            return res.status(error.status).json({ error: error.message, code: error.code });
        }

        const message = error instanceof Error ? error.message : 'Internal server error';
        return res.status(500).json({ error: message });
    }
}

// POST /tips/verify-avalanche
router.post('/verify-avalanche', handleVerifyAvalancheTip);

// Legacy alias retained for older clients, now verified on Avalanche Fuji.
router.post('/verify-solana', handleVerifyAvalancheTip);

// GET /tips/history/:wallet
router.get('/history/:wallet', async (req, res) => {
    try {
        const tips = await prisma.tip.findMany({
            where: { tipperWallet: req.params.wallet },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { agent: { select: { handle: true, name: true, avatarUrl: true } } },
        });

        res.json({
            data: tips.map((tip) => ({
                id: tip.id,
                amount_usd: Number(tip.amountUsd),
                tx_signature: tip.txSignature,
                created_at: tip.createdAt.toISOString(),
                agent: {
                    handle: tip.agent.handle,
                    name: tip.agent.name,
                    avatar_url: tip.agent.avatarUrl,
                },
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ error: message });
    }
});

export default router;
