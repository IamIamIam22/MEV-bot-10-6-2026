export type BotCategory =
  | 'arbitrage'
  | 'sandwich'
  | 'liquidation'
  | 'backrun'
  | 'frontrun'
  | 'timebandit'
  | 'oracle'
  | 'nft'
  | 'gasauction'
  | 'flashbots';

export interface MEVBotConfig {
  id: BotCategory;
  name: string;
  tag: string;
  description: string;
  enabled: boolean;
  strategySummary: string;
  detectionMechanism: string;
  executionLogic: string;
  contractInteraction: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  totalDetected: number;
  totalExecuted: number;
  successRate: number;
  profitCapturedUSD: number;
  currentStatus: 'IDLE' | 'SCANNING' | 'SIMULATING' | 'EXECUTING' | 'PAUSED';
  minProfitThresholdUSD: number;
  maxGasGwei: number;
  targetRouters: string[];
}

export interface BlockchainNetwork {
  id: string;
  chainId: number;
  name: string;
  symbol: string;
  rpcUrls: string[];
  blockExplorer: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    uniswapV2Router?: string;
    uniswapV2Factory?: string;
    sushiswapRouter?: string;
    aavePool?: string;
    flashbotsRelay?: string;
    multicall?: string;
  };
}

export interface ArbitrageOpportunity {
  id: string;
  tokenPair: string;
  tokenIn: string;
  tokenOut: string;
  poolA: {
    name: string;
    address: string;
    price: number;
    reserve0: string;
    reserve1: string;
  };
  poolB: {
    name: string;
    address: string;
    price: number;
    reserve0: string;
    reserve1: string;
  };
  priceDeltaPct: number;
  optimalInputUSD: number;
  grossProfitUSD: number;
  estimatedGasUSD: number;
  netProfitUSD: number;
  timestamp: number;
  route: string[];
  status: 'PENDING' | 'SIMULATED' | 'EXECUTED' | 'DEPLOYED' | 'EXPIRED';
}

export interface OpportunityLifecycleItem {
  id: string;
  opportunityId: string;
  tokenPair: string;
  tokenIn: string;
  tokenOut: string;
  networkName: string;
  networkSymbol: string;
  networkChainId: number;
  poolA: string;
  poolB: string;
  grossProfitUSD: number;
  gasCostUSD: number;
  netProfitUSD: number;
  depositedCoinSymbol: string;
  depositedCoinAmount: number;
  profitHolderWalletName: string;
  profitHolderAddress: string;
  profitHolderBalanceUSD: number;
  profitHolderAvailableCoins: { symbol: string; amount: number; amountUSD: number }[];
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  stage: 'GENERATED' | 'SIMULATED' | 'DEPLOYED' | 'CONFIRMED' | 'PROFIT_DEPOSITED';
  logs: string[];
}

export interface SandwichOpportunity {
  id: string;
  victimTxHash: string;
  targetPool: string;
  tokenIn: string;
  tokenOut: string;
  victimTradeAmountUSD: number;
  victimMaxSlippagePct: number;
  frontrunAmountUSD: number;
  backrunExpectedUSD: number;
  grossProfitUSD: number;
  gasBribeUSD: number;
  netProfitUSD: number;
  timestamp: number;
  status: 'DETECTED' | 'SIMULATED' | 'BUNDLED';
}

export interface LiquidationOpportunity {
  id: string;
  protocol: 'Aave V3' | 'Compound V3' | 'MakerDAO';
  borrower: string;
  collateralAsset: string;
  collateralAmountUSD: number;
  debtAsset: string;
  debtAmountUSD: number;
  healthFactor: number;
  liquidationBonusPct: number;
  potentialProfitUSD: number;
  timestamp: number;
  status: 'ELIGIBLE' | 'SIMULATED' | 'LIQUIDATED';
}

export interface LiveBlockInfo {
  number: number;
  timestamp: number;
  gasBaseFeeGwei: number;
  priorityFeeGwei: number;
  gasLimit: number;
  miner: string;
  txCount: number;
}

export interface ProfitTokenBalance {
  symbol: string;
  amount: number;
  amountUSD: number;
}

export interface ProfitHoldingWallet {
  id: string;
  name: string;
  address: string;
  privateKey?: string;
  mnemonic?: string;
  derivationPath?: string;
  isColdStorage: boolean;
  createdAt: number;
  balanceUSD: number;
  tokenBalances: ProfitTokenBalance[];
}

export interface ProfitPayoutTransaction {
  id: string;
  txHash: string;
  timestamp: number;
  sourceWalletAddress: string;
  sourceWalletName: string;
  recipientAddress: string;
  targetNetworkId: string;
  targetNetworkName: string;
  targetCoinSymbol: string;
  amountCoin: number;
  amountUSD: number;
  gasFeeUSD: number;
  bridgeFeeUSD: number;
  status: 'CONFIRMED' | 'PENDING' | 'FINALIZED';
  explorerUrl?: string;
}

export interface WalletState {
  executor: {
    address: string;
    privateKey: string;
    mnemonic?: string;
    derivationPath?: string;
    isEncrypted: boolean;
    nativeBalance: string;
    nativeBalanceUSD: number;
    gasReserved: string;
    isActive: boolean;
    nonce: number;
    txSuccessCount: number;
  };
  profit: {
    address: string;
    mnemonic?: string;
    derivationPath?: string;
    totalAccumulatedUSD: number;
    autoSweepThresholdUSD: number;
    lastSweepTimestamp: number | null;
    lastSweepTxHash: string | null;
    routingSplitPct: {
      coldStorage: number;
      reinvestGas: number;
      operatorFee: number;
    };
    holdingWallets?: ProfitHoldingWallet[];
    activeWalletId?: string;
    payoutHistory?: ProfitPayoutTransaction[];
    connectedPersonalWallet?: string;
    directPayoutEnabled?: boolean;
    executionMode?: 'LIVE_ONCHAIN' | 'FLASHBOTS_SANDBOX';
  };
}

export interface SmartContractTemplate {
  id: string;
  name: string;
  filename: string;
  category: string;
  description: string;
  solidityVersion: string;
  sourceCode: string;
  abi: string;
  bytecode?: string;
  features: string[];
}

export interface RPCBenchmarkResult {
  url: string;
  status: 'online' | 'offline' | 'error';
  latency: number;
  blockNumber: number | null;
  lastChecked: number;
}
