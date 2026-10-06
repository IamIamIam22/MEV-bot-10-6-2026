import { BlockchainNetwork } from '../types';

export const SUPPORTED_NETWORKS: BlockchainNetwork[] = [
  {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://cloudflare-eth.com',
    ],
    blockExplorer: 'https://etherscan.io',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    contracts: {
      uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      sushiswapRouter: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      aavePool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      flashbotsRelay: 'https://relay.flashbots.net',
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://arbitrum-one.publicnode.com',
    ],
    blockExplorer: 'https://arbiscan.io',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    contracts: {
      uniswapV2Router: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24', // Camelot Router
      sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  {
    id: 'base',
    chainId: 8453,
    name: 'Base L2',
    symbol: 'ETH',
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://base-rpc.publicnode.com',
    ],
    blockExplorer: 'https://basescan.org',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    contracts: {
      uniswapV2Router: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24', // Aerodrome / BaseSwap
      aavePool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  {
    id: 'bsc',
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrls: [
      'https://bsc-dataseed.binance.org/',
      'https://binance.llamarpc.com',
      'https://bsc-rpc.publicnode.com',
    ],
    blockExplorer: 'https://bscscan.com',
    isTestnet: false,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    contracts: {
      uniswapV2Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap Router V2
      sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon PoS',
    symbol: 'POL',
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
      'https://polygon-bor-rpc.publicnode.com',
    ],
    blockExplorer: 'https://polygonscan.com',
    isTestnet: false,
    nativeCurrency: { name: 'Polygon Ecosystem Token', symbol: 'POL', decimals: 18 },
    contracts: {
      uniswapV2Router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap Router
      sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  {
    id: 'sepolia',
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'SepoliaETH',
    rpcUrls: [
      'https://rpc.sepolia.org',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc2.sepolia.org',
    ],
    blockExplorer: 'https://sepolia.etherscan.io',
    isTestnet: true,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    contracts: {
      uniswapV2Router: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008',
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
];

export const DEFAULT_NETWORKS = SUPPORTED_NETWORKS;
