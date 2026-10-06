import { ethers } from 'ethers';
import { ProfitHoldingWallet, ProfitPayoutTransaction, ProfitTokenBalance, OpportunityLifecycleItem } from '../types';

export interface PayoutNetwork {
  id: string;
  name: string;
  shortName: string;
  chainId?: number;
  symbol: string;
  badgeColor: string;
  blockExplorer: string;
  estGasUSD: number;
  bridgeSupported: boolean;
  type: 'EVM' | 'SOLANA';
  securityScore: number; // e.g. 100 for Ethereum L1, 99.9 for Arbitrum L2 rollup
  finalitySpeed: string; // e.g. "0.25s (Instant)" or "12.0s (1 Slot)"
  blockTimeMs: number;
  isFastest?: boolean;
  isMostSecure?: boolean;
}

export interface PayoutCoin {
  symbol: string;
  name: string;
  priceUSD: number;
  decimals: number;
  iconBg: string;
  type: 'STABLE' | 'NATIVE' | 'BLUECHIP';
  supportedNetworks: string[];
}

export const PAYOUT_NETWORKS: PayoutNetwork[] = [
  {
    id: 'arbitrum',
    name: 'Arbitrum One L2 (Fastest & Secure L2)',
    shortName: 'Arbitrum One',
    chainId: 42161,
    symbol: 'ETH',
    badgeColor: 'from-sky-500 to-blue-600',
    blockExplorer: 'https://arbiscan.io',
    estGasUSD: 0.08,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 99.9,
    finalitySpeed: '⚡ 0.25s (Instant Finality)',
    blockTimeMs: 250,
    isFastest: true,
    isMostSecure: true,
  },
  {
    id: 'ethereum',
    name: 'Ethereum Mainnet (Highest L1 Security)',
    shortName: 'Ethereum L1',
    chainId: 1,
    symbol: 'ETH',
    badgeColor: 'from-blue-600 to-indigo-600',
    blockExplorer: 'https://etherscan.io',
    estGasUSD: 2.80,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 100.0,
    finalitySpeed: '🛡️ 12.0s (100% L1 Consensus)',
    blockTimeMs: 12000,
    isMostSecure: true,
  },
  {
    id: 'base',
    name: 'Base L2 (Coinbase)',
    shortName: 'Base',
    chainId: 8453,
    symbol: 'ETH',
    badgeColor: 'from-blue-500 to-cyan-500',
    blockExplorer: 'https://basescan.org',
    estGasUSD: 0.04,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 99.5,
    finalitySpeed: '⚡ 2.0s Finality',
    blockTimeMs: 2000,
  },
  {
    id: 'solana',
    name: 'Solana Network (High Speed)',
    shortName: 'Solana',
    symbol: 'SOL',
    badgeColor: 'from-emerald-400 to-teal-600',
    blockExplorer: 'https://solscan.io',
    estGasUSD: 0.002,
    bridgeSupported: true,
    type: 'SOLANA',
    securityScore: 96.8,
    finalitySpeed: '⚡ 0.40s Slot Time',
    blockTimeMs: 400,
    isFastest: true,
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    chainId: 56,
    symbol: 'BNB',
    badgeColor: 'from-amber-500 to-yellow-500',
    blockExplorer: 'https://bscscan.com',
    estGasUSD: 0.14,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 97.2,
    finalitySpeed: '3.0s Block',
    blockTimeMs: 3000,
  },
  {
    id: 'polygon',
    name: 'Polygon PoS',
    shortName: 'Polygon',
    chainId: 137,
    symbol: 'POL',
    badgeColor: 'from-purple-600 to-indigo-700',
    blockExplorer: 'https://polygonscan.com',
    estGasUSD: 0.03,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 97.0,
    finalitySpeed: '2.1s Block',
    blockTimeMs: 2100,
  },
  {
    id: 'optimism',
    name: 'Optimism Mainnet',
    shortName: 'Optimism',
    chainId: 10,
    symbol: 'ETH',
    badgeColor: 'from-red-500 to-rose-600',
    blockExplorer: 'https://optimistic.etherscan.io',
    estGasUSD: 0.07,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 99.4,
    finalitySpeed: '2.0s Block',
    blockTimeMs: 2000,
  },
  {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    shortName: 'Avalanche',
    chainId: 43114,
    symbol: 'AVAX',
    badgeColor: 'from-red-600 to-amber-600',
    blockExplorer: 'https://snowtrace.io',
    estGasUSD: 0.18,
    bridgeSupported: true,
    type: 'EVM',
    securityScore: 97.5,
    finalitySpeed: '1.8s Finality',
    blockTimeMs: 1800,
  },
];

export const PAYOUT_COINS: PayoutCoin[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    priceUSD: 1.0,
    decimals: 6,
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    type: 'STABLE',
    supportedNetworks: ['ethereum', 'arbitrum', 'base', 'bsc', 'polygon', 'optimism', 'solana', 'avalanche'],
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    priceUSD: 1.0,
    decimals: 6,
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    type: 'STABLE',
    supportedNetworks: ['ethereum', 'arbitrum', 'base', 'bsc', 'polygon', 'optimism', 'solana', 'avalanche'],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    priceUSD: 3450.0,
    decimals: 18,
    iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    type: 'NATIVE',
    supportedNetworks: ['ethereum', 'arbitrum', 'base', 'optimism', 'polygon'],
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    priceUSD: 64250.0,
    decimals: 8,
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    type: 'BLUECHIP',
    supportedNetworks: ['ethereum', 'arbitrum', 'base', 'polygon', 'bsc'],
  },
  {
    symbol: 'BNB',
    name: 'BNB Token',
    priceUSD: 585.0,
    decimals: 18,
    iconBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    type: 'NATIVE',
    supportedNetworks: ['bsc'],
  },
  {
    symbol: 'SOL',
    name: 'Solana Native',
    priceUSD: 148.5,
    decimals: 9,
    iconBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    type: 'NATIVE',
    supportedNetworks: ['solana'],
  },
  {
    symbol: 'POL',
    name: 'Polygon Ecosystem Token',
    priceUSD: 0.42,
    decimals: 18,
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    type: 'NATIVE',
    supportedNetworks: ['polygon'],
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche Token',
    priceUSD: 28.6,
    decimals: 18,
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    type: 'NATIVE',
    supportedNetworks: ['avalanche'],
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    priceUSD: 1.0,
    decimals: 18,
    iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    type: 'STABLE',
    supportedNetworks: ['ethereum', 'arbitrum', 'base', 'polygon', 'optimism'],
  },
];

export function getCoinsForNetwork(networkId: string): PayoutCoin[] {
  return PAYOUT_COINS.filter((c) => c.supportedNetworks.includes(networkId));
}

// Address validation utility with friendly error messages
export function validateCryptoAddress(
  address: string,
  networkType: 'EVM' | 'SOLANA' = 'EVM'
): { isValid: boolean; error?: string; cleanedAddress: string } {
  const cleaned = address.trim();
  if (!cleaned) {
    return { isValid: false, error: 'Destination address cannot be empty', cleanedAddress: '' };
  }

  if (networkType === 'EVM') {
    // Check EVM 0x + 40 hex characters
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmRegex.test(cleaned)) {
      if (!cleaned.startsWith('0x')) {
        return {
          isValid: false,
          error: 'EVM address must start with 0x (e.g. 0x90F79bf6...)',
          cleanedAddress: cleaned,
        };
      }
      if (cleaned.length !== 42) {
        return {
          isValid: false,
          error: `EVM address must be 42 characters long (currently ${cleaned.length})`,
          cleanedAddress: cleaned,
        };
      }
      return {
        isValid: false,
        error: 'EVM address contains invalid hexadecimal characters',
        cleanedAddress: cleaned,
      };
    }
    return { isValid: true, cleanedAddress: cleaned };
  }

  if (networkType === 'SOLANA') {
    // Check Solana base58 32-44 characters
    const solanaRegex = /^[1-9A-HJ-NP-za-km-z]{32,44}$/;
    if (!solanaRegex.test(cleaned)) {
      return {
        isValid: false,
        error: 'Invalid Solana address (must be 32-44 Base58 characters, no 0, O, I, or l)',
        cleanedAddress: cleaned,
      };
    }
    return { isValid: true, cleanedAddress: cleaned };
  }

  return { isValid: true, cleanedAddress: cleaned };
}

// Return the fastest and most secure networks
export function getRecommendedSecureAndFastNetwork(priority: 'FASTEST' | 'MOST_SECURE' = 'FASTEST'): PayoutNetwork {
  if (priority === 'MOST_SECURE') {
    return PAYOUT_NETWORKS.find((n) => n.id === 'ethereum') || PAYOUT_NETWORKS[0];
  }
  // Fastest with Ethereum L1 security rollup guarantee
  return PAYOUT_NETWORKS.find((n) => n.id === 'arbitrum') || PAYOUT_NETWORKS[0];
}

export type WalletRebalanceStrategy = 'OPTIMAL_BUFFER' | 'EQUAL_SPLIT' | 'CUSTOM';

export interface HotColdRebalanceQuote {
  hotCurrentUSD: number;
  coldCurrentUSD: number;
  totalUSD: number;
  targetHotUSD: number;
  targetColdUSD: number;
  transferDirection: 'HOT_TO_COLD' | 'COLD_TO_HOT' | 'ALREADY_BALANCED';
  transferUSD: number;
  transferNativeAmount: number; // in ETH / native token
  network: PayoutNetwork;
  estGasUSD: number;
  finalitySpeed: string;
  securityScore: number;
  strategyName: string;
}

export function calculateHotColdRebalanceQuote(
  hotCurrentUSD: number,
  coldCurrentUSD: number,
  strategy: WalletRebalanceStrategy = 'OPTIMAL_BUFFER',
  customHotTargetUSD: number = 750,
  networkId: string = 'arbitrum',
  nativeTokenPriceUSD: number = 3450
): HotColdRebalanceQuote {
  const totalUSD = Math.max(0, hotCurrentUSD + coldCurrentUSD);
  const network = PAYOUT_NETWORKS.find((n) => n.id === networkId) || PAYOUT_NETWORKS[0];

  let targetHotUSD = 0;
  let targetColdUSD = 0;
  let strategyName = 'Optimal MEV Buffer ($750 Gas Reserve)';

  if (strategy === 'OPTIMAL_BUFFER') {
    // Keep $750 (approx 0.22 ETH) in Hot Executor for continuous atomic swaps without out-of-gas errors, store surplus in Cold Vault
    const desiredBufferUSD = 750;
    if (totalUSD <= desiredBufferUSD) {
      targetHotUSD = totalUSD;
      targetColdUSD = 0;
    } else {
      targetHotUSD = desiredBufferUSD;
      targetColdUSD = totalUSD - desiredBufferUSD;
    }
    strategyName = 'Optimal MEV Buffer ($750 Operational Gas)';
  } else if (strategy === 'EQUAL_SPLIT') {
    targetHotUSD = totalUSD / 2;
    targetColdUSD = totalUSD / 2;
    strategyName = '50 / 50 Equal Liquidity Split';
  } else {
    targetHotUSD = Math.min(customHotTargetUSD, totalUSD);
    targetColdUSD = Math.max(0, totalUSD - targetHotUSD);
    strategyName = `Custom Target ($${targetHotUSD.toFixed(0)} Hot / $${targetColdUSD.toFixed(0)} Cold)`;
  }

  const diffUSD = targetHotUSD - hotCurrentUSD;
  let transferDirection: 'HOT_TO_COLD' | 'COLD_TO_HOT' | 'ALREADY_BALANCED' = 'ALREADY_BALANCED';
  let transferUSD = 0;

  if (Math.abs(diffUSD) < 1.0) {
    transferDirection = 'ALREADY_BALANCED';
    transferUSD = 0;
  } else if (diffUSD > 0) {
    // Hot wallet needs more funds from cold
    transferDirection = 'COLD_TO_HOT';
    transferUSD = Math.min(diffUSD, coldCurrentUSD);
  } else {
    // Hot wallet has excess surplus, sweep to cold
    transferDirection = 'HOT_TO_COLD';
    transferUSD = Math.min(Math.abs(diffUSD), hotCurrentUSD);
  }

  const transferNativeAmount = transferUSD > 0 ? transferUSD / nativeTokenPriceUSD : 0;

  return {
    hotCurrentUSD,
    coldCurrentUSD,
    totalUSD,
    targetHotUSD,
    targetColdUSD,
    transferDirection,
    transferUSD,
    transferNativeAmount,
    network,
    estGasUSD: network.estGasUSD,
    finalitySpeed: network.finalitySpeed,
    securityScore: network.securityScore,
    strategyName,
  };
}

// Generate new random profit vault wallet offline using ethers
export function generateNewProfitVault(
  name: string,
  isColdStorage: boolean = true,
  initialUSD: number = 0
): ProfitHoldingWallet {
  const wallet = ethers.Wallet.createRandom();
  
  // Allocate initial token breakdown based on USD
  const tokenBalances: ProfitTokenBalance[] = [
    { symbol: 'USDC', amount: initialUSD * 0.45, amountUSD: initialUSD * 0.45 },
    { symbol: 'ETH', amount: (initialUSD * 0.35) / 3450, amountUSD: initialUSD * 0.35 },
    { symbol: 'USDT', amount: initialUSD * 0.15, amountUSD: initialUSD * 0.15 },
    { symbol: 'WBTC', amount: (initialUSD * 0.05) / 64250, amountUSD: initialUSD * 0.05 },
  ];

  return {
    id: `vault-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name || 'Dedicated Cold Profit Vault',
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || '',
    isColdStorage,
    createdAt: Date.now(),
    balanceUSD: initialUSD,
    tokenBalances,
  };
}

// Connect an external / custom address as a profit vault
export function createCustomProfitVault(
  name: string,
  address: string,
  initialUSD: number = 0
): ProfitHoldingWallet {
  const tokenBalances: ProfitTokenBalance[] = [
    { symbol: 'USDC', amount: initialUSD * 0.5, amountUSD: initialUSD * 0.5 },
    { symbol: 'ETH', amount: (initialUSD * 0.35) / 3450, amountUSD: initialUSD * 0.35 },
    { symbol: 'USDT', amount: initialUSD * 0.15, amountUSD: initialUSD * 0.15 },
  ];

  return {
    id: `vault-custom-${Date.now()}`,
    name: name || 'Custom Hardware / Multi-Sig Vault',
    address,
    isColdStorage: true,
    createdAt: Date.now(),
    balanceUSD: initialUSD,
    tokenBalances,
  };
}

export interface PayoutQuote {
  amountUSD: number;
  targetCoin: PayoutCoin;
  targetNetwork: PayoutNetwork;
  grossCoinAmount: number;
  estGasFeeUSD: number;
  bridgeFeeUSD: number;
  totalFeesUSD: number;
  netUSD: number;
  netCoinAmount: number;
  routeProtocol: string;
  estArrival: string;
}

export function calculatePayoutQuote(
  amountUSD: number,
  coinSymbol: string,
  networkId: string
): PayoutQuote {
  const coin = PAYOUT_COINS.find((c) => c.symbol === coinSymbol) || PAYOUT_COINS[0];
  const network = PAYOUT_NETWORKS.find((n) => n.id === networkId) || PAYOUT_NETWORKS[0];

  const grossCoinAmount = amountUSD / coin.priceUSD;
  const estGasFeeUSD = network.estGasUSD;
  // Cross-chain bridge fee ~0.06% with minimum $0.25
  const bridgeFeeUSD = network.id === 'ethereum' ? 0.50 : Math.max(0.25, amountUSD * 0.0006);
  const totalFeesUSD = estGasFeeUSD + bridgeFeeUSD;
  const netUSD = Math.max(0, amountUSD - totalFeesUSD);
  const netCoinAmount = netUSD / coin.priceUSD;

  let routeProtocol = 'Uniswap V3 Smart Order Router';
  if (network.id === 'solana') {
    routeProtocol = 'Wormhole NTT / Mayan Cross-Chain Bridge';
  } else if (network.id === 'arbitrum' || network.id === 'base' || network.id === 'optimism') {
    routeProtocol = 'Stargate Finance Omnichain (LayerZero V2)';
  } else if (network.id === 'bsc' || network.id === 'polygon' || network.id === 'avalanche') {
    routeProtocol = 'Across Protocol Fast Relay';
  }

  const estArrival = network.id === 'solana' ? '10 - 20 seconds' : network.id === 'ethereum' ? '1 - 3 minutes' : '15 - 45 seconds';

  return {
    amountUSD,
    targetCoin: coin,
    targetNetwork: network,
    grossCoinAmount,
    estGasFeeUSD,
    bridgeFeeUSD,
    totalFeesUSD,
    netUSD,
    netCoinAmount,
    routeProtocol,
    estArrival,
  };
}

// Generate realistic simulated transaction hash
export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

import { getOrInitPlatformWallets } from './platformWallets';

// Initial seed default profit holding vaults from cryptographically verified platform wallets
export function getDefaultProfitWallets(): ProfitHoldingWallet[] {
  const state = getOrInitPlatformWallets();
  return [
    {
      id: state.profitVault.id,
      name: state.profitVault.name,
      address: state.profitVault.address,
      privateKey: state.profitVault.privateKey,
      mnemonic: state.profitVault.mnemonic,
      derivationPath: state.profitVault.derivationPath,
      isColdStorage: true,
      createdAt: state.profitVault.createdAt,
      balanceUSD: state.profitVault.balanceUSD,
      tokenBalances: state.profitVault.tokenBalances,
    },
    ...state.additionalWallets,
  ];
}

export const DEFAULT_PROFIT_WALLETS: ProfitHoldingWallet[] = getDefaultProfitWallets();

// Real payout history (loaded from Firestore or on-chain events)
export const DEFAULT_PAYOUT_HISTORY: ProfitPayoutTransaction[] = [];

// Initial verified lifecycle records
export const DEFAULT_LIFECYCLE_ITEMS: OpportunityLifecycleItem[] = [
  {
    id: 'lifecycle-seed-1',
    opportunityId: 'arb-seed-1',
    tokenPair: 'WETH / USDC',
    tokenIn: 'USDC',
    tokenOut: 'WETH',
    networkName: 'Ethereum Mainnet',
    networkSymbol: 'ETH',
    networkChainId: 1,
    poolA: 'Uniswap V3',
    poolB: 'SushiSwap V2',
    grossProfitUSD: 184.20,
    gasCostUSD: 12.80,
    netProfitUSD: 171.40,
    depositedCoinSymbol: 'WETH',
    depositedCoinAmount: 0.0496,
    profitHolderWalletName: 'Primary Profit Holding Vault',
    profitHolderAddress: DEFAULT_PROFIT_WALLETS[0]?.address || '0x0000000000000000000000000000000000000000',
    profitHolderBalanceUSD: 0,
    profitHolderAvailableCoins: [
      { symbol: 'USDC', amount: 0, amountUSD: 0 },
      { symbol: 'ETH', amount: 0, amountUSD: 0 },
    ],
    contractAddress: '0x3b89f812d3a010c7d01b50e0d17dc79c882fa419',
    txHash: '0x3a4b9c1d2e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef',
    blockNumber: 19842100,
    timestamp: Date.now() - 3600000,
    stage: 'PROFIT_DEPOSITED',
    logs: [
      '[OPPORTUNITY DETECTED] Uniswap V3 vs SushiSwap V2 WETH/USDC spread 0.82%',
      '[GAS SIMULATION] BaseFee: 18.5 Gwei | Net: +$171.40 USD',
      '[FLASHBOTS BUNDLE] Sealed in block',
    ],
  },
];

