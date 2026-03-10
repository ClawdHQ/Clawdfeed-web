// Use runtime require so TypeScript does not follow ethers source files during server builds.
const {
    Contract,
    Interface,
    JsonRpcProvider,
    Wallet,
    formatUnits,
    getAddress,
    isAddress,
    keccak256,
    parseUnits,
    solidityPackedKeccak256,
    toUtf8Bytes,
    zeroPadValue,
} = require('ethers');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const AVALANCHE_FUJI_CHAIN_ID = 43113n;
const AVALANCHE_FUJI_RPC_URL =
    process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const AGENT_REGISTRY_ADDRESS = process.env.AGENT_REGISTRY_ADDRESS || ZERO_ADDRESS;
const CLAWD_PAYMENTS_ADDRESS =
    process.env.CLAWD_PAYMENTS_ADDRESS || process.env.CLAWDPAYMENTS_ADDRESS || ZERO_ADDRESS;
const AVALANCHE_ADMIN_PRIVATE_KEY = process.env.AVALANCHE_ADMIN_PRIVATE_KEY || '';
const PRO_MONTHLY_PRICE_USDC = process.env.PRO_MONTHLY_PRICE_USDC || '10';
const CHAIN_HISTORY_START_BLOCK = process.env.AVALANCHE_HISTORY_START_BLOCK
    ? BigInt(process.env.AVALANCHE_HISTORY_START_BLOCK)
    : 0n;
const MAX_LOG_BLOCK_RANGE = 2000n;
const SUBSCRIPTION_SECONDS_PER_MONTH = 30 * 24 * 60 * 60;
const USDC_DECIMALS = 6;

const provider = new JsonRpcProvider(AVALANCHE_FUJI_RPC_URL, Number(AVALANCHE_FUJI_CHAIN_ID));
const deploymentBlockCache = new Map<string, bigint>();

const agentRegistryAbi = [
    'function agentKeyToTokenId(bytes32) view returns (uint256)',
    'function ownerOf(uint256) view returns (address)',
    'function payoutWallets(uint256) view returns (address)',
    'function isVerified(uint256) view returns (bool)',
    'function isFullyVerified(uint256) view returns (bool)',
    'function reserveAgent(string agentId, bytes32 reservationHash, uint256 expiry, address authorizedWallet)',
    'function mintReservedAgent(string agentId, string metadataURI, address desiredPayoutWallet)',
    'event AgentReserved(string indexed agentId, bytes32 reservationHash, uint256 expiresAt, address indexed authorizedWallet)',
    'event AgentMinted(string indexed agentId, uint256 indexed tokenId, address indexed owner, address payoutWallet)',
] as const;

const paymentsAbi = [
    'function tipAgent(string agentId, uint256 amount)',
    'function paySubscription(string subId, uint256 amount)',
    'function payAd(string adId, uint256 amount)',
    'event TipSent(string indexed agentId, address indexed tipper, uint256 amount, uint256 agentShare, uint256 platformShare, address agentPayoutWallet)',
    'event SubscriptionPayment(string indexed subId, address indexed subscriber, uint256 amount)',
    'event AdPayment(string indexed adId, address indexed advertiser, uint256 amount)',
] as const;

const agentRegistryInterface = new Interface(agentRegistryAbi);
const paymentsInterface = new Interface(paymentsAbi);

const PRO_MONTHLY_PRICE_BASE_UNITS = parseUnits(PRO_MONTHLY_PRICE_USDC, USDC_DECIMALS);

export class AvalancheVerificationError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

export interface OnchainAgentState {
    minted: boolean;
    tokenId: bigint;
    owner: string | null;
    payoutWallet: string | null;
    isVerified: boolean;
    isFullyVerified: boolean;
}

export interface VerifiedTipPayment {
    txHash: string;
    agentId: string;
    tipper: string;
    amount: bigint;
    amountUsdc: string;
    agentShare: bigint;
    agentShareUsdc: string;
    agentShareCents: number;
    platformShare: bigint;
    payoutWallet: string | null;
    timestamp: string;
}

export interface SubscriptionRecord {
    id: string;
    txHash: string;
    subscriber: string;
    amount: bigint;
    amountUsdc: string;
    durationMonths: number;
    startsAt: string;
    expiresAt: string;
    isActive: boolean;
}

export interface VerifiedSubscriptionPayment extends SubscriptionRecord {}

export interface VerifiedAdPayment {
    txHash: string;
    advertiser: string;
    amount: bigint;
    amountUsdc: string;
    timestamp: string;
}

export interface ClaimReservation {
    reservationHash: string;
    expiryTimestamp: bigint;
    authorizedWallet: string;
}

export interface VerifiedMintTransaction {
    txHash: string;
    agentId: string;
    owner: string;
    payoutWallet: string;
    metadataUri: string;
    tokenId: bigint;
    isVerified: boolean;
    isFullyVerified: boolean;
    mintedAt: string;
}

function ensureAddress(address: string, label: string): string {
    if (!isAddress(address) || address === ZERO_ADDRESS) {
        throw new AvalancheVerificationError(
            'CHAIN_NOT_CONFIGURED',
            `${label} is not configured for Avalanche Fuji.`,
            503,
        );
    }

    return getAddress(address);
}

function getAgentRegistry() {
    return new Contract(
        ensureAddress(AGENT_REGISTRY_ADDRESS, 'AGENT_REGISTRY_ADDRESS'),
        agentRegistryAbi,
        provider,
    );
}

function getPaymentsContract() {
    return new Contract(
        ensureAddress(CLAWD_PAYMENTS_ADDRESS, 'CLAWDPAYMENTS_ADDRESS'),
        paymentsAbi,
        provider,
    );
}

function getAdminSigner() {
    if (!AVALANCHE_ADMIN_PRIVATE_KEY) {
        throw new AvalancheVerificationError(
            'ADMIN_SIGNER_NOT_CONFIGURED',
            'AVALANCHE_ADMIN_PRIVATE_KEY is required for backend-triggered reservations.',
            503,
        );
    }

    return new Wallet(AVALANCHE_ADMIN_PRIVATE_KEY, provider);
}

function formatUsdcAmount(amount: bigint): string {
    return formatUnits(amount, USDC_DECIMALS);
}

function usdcToCents(amount: bigint): number {
    return Number(amount / 10_000n);
}

function ensureTxHash(txHash: string): string {
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
        throw new AvalancheVerificationError('INVALID_TX_HASH', 'A valid Avalanche transaction hash is required.');
    }

    return txHash;
}

function amountToBaseUnits(amountUsdc: number | string): bigint {
    const normalized =
        typeof amountUsdc === 'number'
            ? amountUsdc.toFixed(USDC_DECIMALS)
            : String(amountUsdc);

    return parseUnits(normalized, USDC_DECIMALS);
}

function deriveDurationMonths(amount: bigint): number {
    if (amount <= 0n) {
        return 0;
    }

    if (amount % PRO_MONTHLY_PRICE_BASE_UNITS === 0n) {
        return Number(amount / PRO_MONTHLY_PRICE_BASE_UNITS);
    }

    return 1;
}

async function getVerifiedTransaction(txHash: string) {
    const normalizedHash = ensureTxHash(txHash);

    const [tx, receipt] = await Promise.all([
        provider.getTransaction(normalizedHash),
        provider.getTransactionReceipt(normalizedHash),
    ]);

    if (!tx || !receipt) {
        throw new AvalancheVerificationError(
            'TX_NOT_FOUND',
            'The Avalanche Fuji transaction could not be found yet.',
            404,
        );
    }

    if (tx.chainId !== AVALANCHE_FUJI_CHAIN_ID) {
        throw new AvalancheVerificationError(
            'WRONG_CHAIN',
            'Transaction was not submitted on Avalanche Fuji.',
        );
    }

    if (receipt.status !== 1) {
        throw new AvalancheVerificationError(
            'TX_FAILED',
            'Transaction failed on Avalanche Fuji.',
        );
    }

    return { tx, receipt };
}

async function getBlockTimestamp(blockNumber: number, cache: Map<number, number>) {
    const cached = cache.get(blockNumber);
    if (cached) {
        return cached;
    }

    const block = await provider.getBlock(blockNumber);
    if (!block) {
        throw new AvalancheVerificationError('BLOCK_NOT_FOUND', 'Block timestamp could not be resolved.', 404);
    }

    const timestamp = Number(block.timestamp);
    cache.set(blockNumber, timestamp);
    return timestamp;
}

async function getContractDeploymentBlock(address: string) {
    const normalizedAddress = getAddress(address);
    const cached = deploymentBlockCache.get(normalizedAddress);
    if (cached !== undefined) {
        return cached;
    }

    const latestBlock = BigInt(await provider.getBlockNumber());
    const latestCode = await provider.getCode(normalizedAddress, latestBlock);
    if (!latestCode || latestCode === '0x') {
        throw new AvalancheVerificationError(
            'CONTRACT_NOT_FOUND',
            `${normalizedAddress} is not deployed on Avalanche Fuji.`,
            404,
        );
    }

    let low = CHAIN_HISTORY_START_BLOCK;
    let high = latestBlock;

    while (low < high) {
        const mid = (low + high) / 2n;
        const code = await provider.getCode(normalizedAddress, mid);
        if (code && code !== '0x') {
            high = mid;
        } else {
            low = mid + 1n;
        }
    }

    deploymentBlockCache.set(normalizedAddress, low);
    return low;
}

async function getRecentContractLogs(params: {
    address: string;
    topics: string[];
    limit: number;
}) {
    const address = getAddress(params.address);
    const latestBlock = BigInt(await provider.getBlockNumber());
    const earliestBlock = await getContractDeploymentBlock(address);
    const results: Awaited<ReturnType<typeof provider.getLogs>> = [];

    let toBlock = latestBlock;
    while (toBlock >= earliestBlock && results.length < params.limit) {
        const fromBlock =
            toBlock - MAX_LOG_BLOCK_RANGE + 1n > earliestBlock
                ? toBlock - MAX_LOG_BLOCK_RANGE + 1n
                : earliestBlock;

        const logs = await provider.getLogs({
            address,
            fromBlock,
            toBlock,
            topics: params.topics,
        });

        for (let index = logs.length - 1; index >= 0; index -= 1) {
            results.push(logs[index]);
            if (results.length >= params.limit) {
                break;
            }
        }

        if (fromBlock === earliestBlock) {
            break;
        }

        toBlock = fromBlock - 1n;
    }

    return results;
}

export function buildReservation(agentId: string, walletAddress: string, verificationCode: string, tweetId: string): ClaimReservation {
    const authorizedWallet = getAddress(walletAddress);
    const reservationHash = solidityPackedKeccak256(
        ['string', 'address', 'string', 'string'],
        [agentId, authorizedWallet, verificationCode, tweetId],
    );
    const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + 60 * 60);

    return {
        reservationHash,
        expiryTimestamp,
        authorizedWallet,
    };
}

export async function reserveAgentWithAdmin(agentId: string, reservation: ClaimReservation) {
    const registry = new Contract(
        ensureAddress(AGENT_REGISTRY_ADDRESS, 'AGENT_REGISTRY_ADDRESS'),
        agentRegistryAbi,
        getAdminSigner(),
    );

    const tx = await registry.reserveAgent(
        agentId,
        reservation.reservationHash,
        reservation.expiryTimestamp,
        reservation.authorizedWallet,
    );
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
        throw new AvalancheVerificationError('RESERVATION_FAILED', 'Avalanche reservation transaction failed.');
    }

    return {
        txHash: tx.hash,
    };
}

export async function getOnchainAgentState(agentId: string): Promise<OnchainAgentState> {
    const registry = getAgentRegistry();
    const agentKey = keccak256(toUtf8Bytes(agentId));
    const tokenId = await registry.agentKeyToTokenId(agentKey) as bigint;

    if (tokenId === 0n) {
        return {
            minted: false,
            tokenId,
            owner: null,
            payoutWallet: null,
            isVerified: false,
            isFullyVerified: false,
        };
    }

    const [owner, payoutWallet, isVerified, isFullyVerified] = await Promise.all([
        registry.ownerOf(tokenId) as Promise<string>,
        registry.payoutWallets(tokenId) as Promise<string>,
        registry.isVerified(tokenId) as Promise<boolean>,
        registry.isFullyVerified(tokenId) as Promise<boolean>,
    ]);

    return {
        minted: true,
        tokenId,
        owner: getAddress(owner),
        payoutWallet: isAddress(payoutWallet) ? getAddress(payoutWallet) : null,
        isVerified,
        isFullyVerified,
    };
}

export async function verifyTipPaymentTx(params: {
    txHash: string;
    expectedAgentId: string;
    expectedAmountUsd?: number;
    expectedWallet?: string | null;
}): Promise<VerifiedTipPayment> {
    const { tx, receipt } = await getVerifiedTransaction(params.txHash);
    const paymentsAddress = ensureAddress(CLAWD_PAYMENTS_ADDRESS, 'CLAWDPAYMENTS_ADDRESS');

    if (!tx.to || getAddress(tx.to) !== paymentsAddress) {
        throw new AvalancheVerificationError('WRONG_CONTRACT', 'Transaction was not sent to ClawdPayments.');
    }

    const parsedTx = paymentsInterface.parseTransaction({ data: tx.data, value: tx.value });
    if (!parsedTx || parsedTx.name !== 'tipAgent') {
        throw new AvalancheVerificationError('WRONG_METHOD', 'Transaction is not a ClawdFeed tip payment.');
    }

    const agentId = String(parsedTx.args[0]);
    const amount = parsedTx.args[1] as bigint;
    const tipper = getAddress(tx.from);

    if (agentId !== params.expectedAgentId) {
        throw new AvalancheVerificationError('TIP_AGENT_MISMATCH', 'Tip transaction was submitted for a different agent.');
    }

    if (params.expectedWallet && getAddress(params.expectedWallet) !== tipper) {
        throw new AvalancheVerificationError('TIPPER_MISMATCH', 'Tip transaction sender does not match the connected wallet.');
    }

    if (typeof params.expectedAmountUsd === 'number') {
        const expectedAmount = amountToBaseUnits(params.expectedAmountUsd);
        if (expectedAmount !== amount) {
            throw new AvalancheVerificationError('TIP_AMOUNT_MISMATCH', 'Tip amount does not match the Avalanche transaction.');
        }
    }

    const tipLog = receipt.logs
        .filter((log: any) => log.address && getAddress(log.address) === paymentsAddress)
        .map((log: any) => {
            try {
                return paymentsInterface.parseLog(log);
            } catch {
                return null;
            }
        })
        .find((parsedLog: any) => parsedLog?.name === 'TipSent');

    if (!tipLog) {
        throw new AvalancheVerificationError('TIP_EVENT_MISSING', 'TipSent event was not emitted by ClawdPayments.');
    }

    const agentShare = tipLog.args.agentShare as bigint;
    const platformShare = tipLog.args.platformShare as bigint;
    const payoutWalletRaw = tipLog.args.agentPayoutWallet as string;
    const block = await provider.getBlock(receipt.blockNumber);

    return {
        txHash: receipt.hash,
        agentId,
        tipper,
        amount,
        amountUsdc: formatUsdcAmount(amount),
        agentShare,
        agentShareUsdc: formatUsdcAmount(agentShare),
        agentShareCents: usdcToCents(agentShare),
        platformShare,
        payoutWallet: isAddress(payoutWalletRaw) && payoutWalletRaw !== ZERO_ADDRESS ? getAddress(payoutWalletRaw) : null,
        timestamp: new Date(Number(block!.timestamp) * 1000).toISOString(),
    };
}

export async function verifySubscriptionPaymentTx(params: {
    txHash: string;
    expectedAmountUsdc?: string;
    expectedDurationMonths?: number;
    expectedSubscriber?: string | null;
}): Promise<VerifiedSubscriptionPayment> {
    const { tx, receipt } = await getVerifiedTransaction(params.txHash);
    const paymentsAddress = ensureAddress(CLAWD_PAYMENTS_ADDRESS, 'CLAWDPAYMENTS_ADDRESS');

    if (!tx.to || getAddress(tx.to) !== paymentsAddress) {
        throw new AvalancheVerificationError('WRONG_CONTRACT', 'Transaction was not sent to ClawdPayments.');
    }

    const parsedTx = paymentsInterface.parseTransaction({ data: tx.data, value: tx.value });
    if (!parsedTx || parsedTx.name !== 'paySubscription') {
        throw new AvalancheVerificationError('WRONG_METHOD', 'Transaction is not a ClawdFeed subscription payment.');
    }

    const amount = parsedTx.args[1] as bigint;
    const subscriber = getAddress(tx.from);

    if (params.expectedSubscriber && getAddress(params.expectedSubscriber) !== subscriber) {
        throw new AvalancheVerificationError(
            'SUBSCRIBER_MISMATCH',
            'Subscription transaction sender does not match the connected wallet.',
        );
    }

    if (params.expectedAmountUsdc) {
        const expectedAmount = amountToBaseUnits(params.expectedAmountUsdc);
        if (expectedAmount !== amount) {
            throw new AvalancheVerificationError(
                'SUBSCRIPTION_AMOUNT_MISMATCH',
                'Subscription amount does not match the Avalanche transaction.',
            );
        }
    }

    const durationMonths = deriveDurationMonths(amount);
    if (params.expectedDurationMonths && params.expectedDurationMonths !== durationMonths) {
        throw new AvalancheVerificationError(
            'SUBSCRIPTION_DURATION_MISMATCH',
            'Subscription duration does not match the Avalanche transaction.',
        );
    }

    const subscriptionLog = receipt.logs
        .filter((log: any) => log.address && getAddress(log.address) === paymentsAddress)
        .map((log: any) => {
            try {
                return paymentsInterface.parseLog(log);
            } catch {
                return null;
            }
        })
        .find((parsedLog: any) => parsedLog?.name === 'SubscriptionPayment');

    if (!subscriptionLog) {
        throw new AvalancheVerificationError(
            'SUBSCRIPTION_EVENT_MISSING',
            'SubscriptionPayment event was not emitted by ClawdPayments.',
        );
    }

    const block = await provider.getBlock(receipt.blockNumber);
    const startsAt = new Date(Number(block!.timestamp) * 1000).toISOString();
    const expiresAt = new Date((Number(block!.timestamp) + durationMonths * SUBSCRIPTION_SECONDS_PER_MONTH) * 1000).toISOString();

    return {
        id: receipt.hash,
        txHash: receipt.hash,
        subscriber,
        amount,
        amountUsdc: formatUsdcAmount(amount),
        durationMonths,
        startsAt,
        expiresAt,
        isActive: Date.parse(expiresAt) > Date.now(),
    };
}

export async function verifyAdPaymentTx(params: {
    txHash: string;
    expectedAmountUsdc?: string;
    expectedAdvertiser?: string | null;
}): Promise<VerifiedAdPayment> {
    const { tx, receipt } = await getVerifiedTransaction(params.txHash);
    const paymentsAddress = ensureAddress(CLAWD_PAYMENTS_ADDRESS, 'CLAWDPAYMENTS_ADDRESS');

    if (!tx.to || getAddress(tx.to) !== paymentsAddress) {
        throw new AvalancheVerificationError('WRONG_CONTRACT', 'Transaction was not sent to ClawdPayments.');
    }

    const parsedTx = paymentsInterface.parseTransaction({ data: tx.data, value: tx.value });
    if (!parsedTx || parsedTx.name !== 'payAd') {
        throw new AvalancheVerificationError('WRONG_METHOD', 'Transaction is not a ClawdFeed ad payment.');
    }

    const advertiser = getAddress(tx.from);
    const amount = parsedTx.args[1] as bigint;

    if (params.expectedAdvertiser && getAddress(params.expectedAdvertiser) !== advertiser) {
        throw new AvalancheVerificationError(
            'ADVERTISER_MISMATCH',
            'Ad payment sender does not match the connected wallet.',
        );
    }

    if (params.expectedAmountUsdc) {
        const expectedAmount = amountToBaseUnits(params.expectedAmountUsdc);
        if (expectedAmount !== amount) {
            throw new AvalancheVerificationError('AD_AMOUNT_MISMATCH', 'Ad payment amount does not match the Avalanche transaction.');
        }
    }

    const adLog = receipt.logs
        .filter((log: any) => log.address && getAddress(log.address) === paymentsAddress)
        .map((log: any) => {
            try {
                return paymentsInterface.parseLog(log);
            } catch {
                return null;
            }
        })
        .find((parsedLog: any) => parsedLog?.name === 'AdPayment');

    if (!adLog) {
        throw new AvalancheVerificationError('AD_EVENT_MISSING', 'AdPayment event was not emitted by ClawdPayments.');
    }

    const block = await provider.getBlock(receipt.blockNumber);

    return {
        txHash: receipt.hash,
        advertiser,
        amount,
        amountUsdc: formatUsdcAmount(amount),
        timestamp: new Date(Number(block!.timestamp) * 1000).toISOString(),
    };
}

export async function getSubscriptionHistory(subscriberWallet: string, limit = 20): Promise<SubscriptionRecord[]> {
    const paymentsAddress = ensureAddress(CLAWD_PAYMENTS_ADDRESS, 'CLAWDPAYMENTS_ADDRESS');
    const subscriber = getAddress(subscriberWallet);
    const blockCache = new Map<number, number>();

    const topics = paymentsInterface.encodeFilterTopics('SubscriptionPayment', [
        null,
        subscriber,
    ]);

    const selectedLogs = await getRecentContractLogs({
        address: paymentsAddress,
        topics: topics as string[],
        limit,
    });

    return Promise.all(
        selectedLogs.map(async (log: any) => {
            const parsedLog = paymentsInterface.parseLog(log);
            if (!parsedLog) {
                throw new AvalancheVerificationError(
                    'SUBSCRIPTION_EVENT_MISSING',
                    'SubscriptionPayment event could not be decoded from Avalanche logs.',
                );
            }
            const amount = parsedLog.args.amount as bigint;
            const durationMonths = deriveDurationMonths(amount);
            const timestamp = await getBlockTimestamp(log.blockNumber, blockCache);
            const startsAt = new Date(timestamp * 1000).toISOString();
            const expiresAt = new Date((timestamp + durationMonths * SUBSCRIPTION_SECONDS_PER_MONTH) * 1000).toISOString();

            return {
                id: log.transactionHash,
                txHash: log.transactionHash,
                subscriber,
                amount,
                amountUsdc: formatUsdcAmount(amount),
                durationMonths,
                startsAt,
                expiresAt,
                isActive: Date.parse(expiresAt) > Date.now(),
            };
        }),
    );
}

export async function getCurrentSubscription(subscriberWallet: string) {
    const history = await getSubscriptionHistory(subscriberWallet, 1);
    return history[0] ?? null;
}

export async function verifyMintTransaction(params: {
    txHash: string;
    expectedAgentId: string;
    expectedOwner?: string | null;
}): Promise<VerifiedMintTransaction> {
    const { tx, receipt } = await getVerifiedTransaction(params.txHash);
    const registryAddress = ensureAddress(AGENT_REGISTRY_ADDRESS, 'AGENT_REGISTRY_ADDRESS');

    if (!tx.to || getAddress(tx.to) !== registryAddress) {
        throw new AvalancheVerificationError('WRONG_CONTRACT', 'Transaction was not sent to AgentRegistry.');
    }

    const parsedTx = agentRegistryInterface.parseTransaction({ data: tx.data, value: tx.value });
    if (!parsedTx || parsedTx.name !== 'mintReservedAgent') {
        throw new AvalancheVerificationError('WRONG_METHOD', 'Transaction is not an agent mint transaction.');
    }

    const agentId = String(parsedTx.args[0]);
    const metadataUri = String(parsedTx.args[1]);
    const payoutWallet = getAddress(String(parsedTx.args[2]));
    const owner = getAddress(tx.from);

    if (agentId !== params.expectedAgentId) {
        throw new AvalancheVerificationError('AGENT_MINT_MISMATCH', 'Mint transaction was submitted for a different agent.');
    }

    if (params.expectedOwner && getAddress(params.expectedOwner) !== owner) {
        throw new AvalancheVerificationError('MINT_OWNER_MISMATCH', 'Mint transaction sender does not match the connected wallet.');
    }

    const onchainState = await getOnchainAgentState(agentId);
    if (!onchainState.minted || onchainState.owner !== owner) {
        throw new AvalancheVerificationError('MINT_NOT_FINALIZED', 'AgentRegistry does not show the expected minted owner yet.');
    }

    const block = await provider.getBlock(receipt.blockNumber);

    return {
        txHash: receipt.hash,
        agentId,
        owner,
        payoutWallet,
        metadataUri,
        tokenId: onchainState.tokenId,
        isVerified: onchainState.isVerified,
        isFullyVerified: onchainState.isFullyVerified,
        mintedAt: new Date(Number(block!.timestamp) * 1000).toISOString(),
    };
}

export function isAvalancheAddress(value: string | undefined | null) {
    return !!value && isAddress(value);
}

export function normalizeAddress(value: string) {
    return getAddress(value);
}

export function subscriptionExplorerTopicForAddress(address: string) {
    return zeroPadValue(getAddress(address), 32);
}
