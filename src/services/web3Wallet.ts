import { ethers } from 'ethers';
import { persistTransactionToCloud } from './firebase';

export interface ConnectedWeb3Wallet {
  address: string;
  chainId: number;
  chainName: string;
  balanceETH: string;
  providerType: 'INJECTED' | 'MANUAL' | 'EXTENSION' | 'WALLET_CONNECT';
  walletName?: string;
  walletIcon?: string;
  connectedAt: number;
}

export interface BrowserWalletExtension {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  tagline: string;
  brandColor: string;
  storeUrl: string;
  isDetected: () => boolean;
  getProvider: () => any;
}

// EIP-6963 Announced Provider Details
export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

const eip6963Providers: Map<string, EIP6963ProviderDetail> = new Map();

if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (event: any) => {
    if (event.detail && event.detail.info) {
      eip6963Providers.set(event.detail.info.rdns || event.detail.info.uuid, event.detail);
    }
  });
  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } catch {
    // ignore
  }
}

export const SUPPORTED_BROWSER_EXTENSIONS: BrowserWalletExtension[] = [
  {
    id: 'metamask',
    name: 'MetaMask Extension',
    shortName: 'MetaMask',
    icon: '🦊',
    tagline: 'World\'s #1 Ethereum & EVM Web3 Browser Extension',
    brandColor: '#F6851B',
    storeUrl: 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      const eth = (window as any).ethereum;
      if (!eth) return false;
      if (eth.isMetaMask && !eth.isRabby && !eth.isBraveWallet) return true;
      if (eth.providers && Array.isArray(eth.providers)) {
        return eth.providers.some((p: any) => p.isMetaMask && !p.isRabby);
      }
      return false;
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      const eth = (window as any).ethereum;
      if (!eth) return null;
      if (eth.providers && Array.isArray(eth.providers)) {
        const found = eth.providers.find((p: any) => p.isMetaMask && !p.isRabby);
        if (found) return found;
      }
      return eth;
    },
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    shortName: 'Rabby',
    icon: '🐰',
    tagline: 'Game-changing Web3 browser wallet with built-in security & multi-chain tracking',
    brandColor: '#8697FF',
    storeUrl: 'https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      return typeof (window as any).rabby !== 'undefined' || !!(window as any).ethereum?.isRabby;
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      if ((window as any).rabby) return (window as any).rabby;
      const eth = (window as any).ethereum;
      if (eth?.isRabby) return eth;
      if (eth?.providers && Array.isArray(eth.providers)) {
        const found = eth.providers.find((p: any) => p.isRabby);
        if (found) return found;
      }
      return eth;
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet Extension',
    shortName: 'Coinbase',
    icon: '🔵',
    tagline: 'Coinbase self-custody EVM & Base browser extension',
    brandColor: '#0052FF',
    storeUrl: 'https://chromewebstore.google.com/detail/coinbase-wallet-extension/hnfanknocfeofbddgcijnmhnfnkdnaad',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      return (
        typeof (window as any).coinbaseWalletExtension !== 'undefined' ||
        !!(window as any).ethereum?.isCoinbaseWallet
      );
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      if ((window as any).coinbaseWalletExtension) return (window as any).coinbaseWalletExtension;
      const eth = (window as any).ethereum;
      if (eth?.isCoinbaseWallet) return eth;
      if (eth?.providers && Array.isArray(eth.providers)) {
        const found = eth.providers.find((p: any) => p.isCoinbaseWallet);
        if (found) return found;
      }
      return eth;
    },
  },
  {
    id: 'brave',
    name: 'Brave Web3 Wallet',
    shortName: 'Brave',
    icon: '🦁',
    tagline: 'Built directly into the Brave Web Browser without separate extensions',
    brandColor: '#FB542B',
    storeUrl: 'https://brave.com/wallet/',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      return !!(window as any).ethereum?.isBraveWallet;
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      return (window as any).ethereum;
    },
  },
  {
    id: 'trust',
    name: 'Trust Wallet Extension',
    shortName: 'Trust Wallet',
    icon: '🛡️',
    tagline: 'Official Trust Wallet extension for Chrome, Brave, and Edge',
    brandColor: '#0500FF',
    storeUrl: 'https://chromewebstore.google.com/detail/trust-wallet/egjidjbpglichdcondbcbdnbeeppgdph',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      return (
        typeof (window as any).trustwallet !== 'undefined' ||
        !!(window as any).ethereum?.isTrust ||
        !!(window as any).ethereum?.isTrustWallet
      );
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      if ((window as any).trustwallet) return (window as any).trustwallet;
      return (window as any).ethereum;
    },
  },
  {
    id: 'okx',
    name: 'OKX Web3 Wallet',
    shortName: 'OKX Wallet',
    icon: '⬛',
    tagline: 'All-in-one Web3 gateway browser extension by OKX',
    brandColor: '#FFFFFF',
    storeUrl: 'https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      return (
        typeof (window as any).okxwallet !== 'undefined' ||
        !!(window as any).ethereum?.isOkxWallet
      );
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      if ((window as any).okxwallet) return (window as any).okxwallet;
      return (window as any).ethereum;
    },
  },
  {
    id: 'safepal',
    name: 'SafePal Extension',
    shortName: 'SafePal',
    icon: '🔐',
    tagline: 'Hardware and browser extension security suite',
    brandColor: '#10B981',
    storeUrl: 'https://chromewebstore.google.com/detail/safepal-extension-wallet/lgmpcpgieflojmfdacagmfnehennflhm',
    isDetected: () => {
      if (typeof window === 'undefined') return false;
      return (
        typeof (window as any).safepal !== 'undefined' ||
        !!(window as any).ethereum?.isSafePal
      );
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      if ((window as any).safepal) return (window as any).safepal;
      return (window as any).ethereum;
    },
  },
  {
    id: 'injected',
    name: 'Default Web3 Provider',
    shortName: 'Injected Browser Wallet',
    icon: '⚡',
    tagline: 'Standard window.ethereum provider injected into current browser tab',
    brandColor: '#06B6D4',
    storeUrl: 'https://metamask.io/download/',
    isDetected: () => {
      return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
    },
    getProvider: () => {
      if (typeof window === 'undefined') return null;
      return (window as any).ethereum;
    },
  },
];

let activeSelectedProvider: any = null;

export function getActiveBrowserProvider(): any {
  if (activeSelectedProvider) return activeSelectedProvider;
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

export function setActiveBrowserProvider(provider: any): void {
  activeSelectedProvider = provider;
}

const STORAGE_KEY = 'mev_connected_web3_wallet';
const ALCHEMY_STORAGE_KEY = 'mev_alchemy_api_key';

export function getSavedAlchemyKey(): string {
  try {
    return (
      localStorage.getItem(ALCHEMY_STORAGE_KEY) ||
      (import.meta as any).env?.VITE_ALCHEMY_API_KEY ||
      ''
    );
  } catch {
    return '';
  }
}

export function saveAlchemyKey(key: string): void {
  try {
    if (!key) {
      localStorage.removeItem(ALCHEMY_STORAGE_KEY);
    } else {
      localStorage.setItem(ALCHEMY_STORAGE_KEY, key.trim());
    }
  } catch {
    // ignore
  }
}

export function getSavedConnectedWallet(): ConnectedWeb3Wallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConnectedWallet(wallet: ConnectedWeb3Wallet | null) {
  try {
    if (!wallet) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    }
  } catch {
    // ignore
  }
}

export function isEthereumAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

export async function requestWeb3WalletConnection(): Promise<ConnectedWeb3Wallet> {
  const provider = getActiveBrowserProvider();
  if (!provider) {
    throw new Error(
      'No Web3 browser wallet detected (e.g. MetaMask, Rabby, Coinbase Wallet). Please open via your browser extension or phone wallet.'
    );
  }

  // Request accounts
  const accounts: string[] = await provider.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('User rejected wallet connection or no accounts available.');
  }

  const address = ethers.getAddress(accounts[0]);

  // Request chainId
  let chainId = 1;
  try {
    const chainIdHex: string = await provider.request({
      method: 'eth_chainId',
    });
    chainId = parseInt(chainIdHex, 16) || 1;
  } catch {
    chainId = 1;
  }

  // Request balance directly from RPC
  let balanceETH = '0.0000';
  try {
    const balHex = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    const wei = BigInt(balHex);
    balanceETH = (Number(wei) / 1e18).toFixed(4);
  } catch {
    balanceETH = '0.0000';
  }

  const chainNames: Record<number, string> = {
    1: 'Ethereum Mainnet',
    42161: 'Arbitrum One',
    8453: 'Base',
    56: 'BNB Smart Chain',
    137: 'Polygon',
    10: 'Optimism',
    11155111: 'Sepolia Testnet',
  };

  const connected: ConnectedWeb3Wallet = {
    address,
    chainId,
    chainName: chainNames[chainId] || `Chain #${chainId}`,
    balanceETH,
    providerType: 'INJECTED',
    walletName: 'Browser Web3 Wallet',
    walletIcon: '⚡',
    connectedAt: Date.now(),
  };

  saveConnectedWallet(connected);
  return connected;
}

export async function connectSpecificBrowserExtension(
  extensionId: string
): Promise<ConnectedWeb3Wallet> {
  const ext = SUPPORTED_BROWSER_EXTENSIONS.find((e) => e.id === extensionId);
  if (!ext) {
    return requestWeb3WalletConnection();
  }

  const provider = ext.getProvider();
  if (!provider) {
    throw new Error(
      `${ext.name} is not installed or enabled in this browser. Please install the extension from the Chrome Web Store or use another wallet.`
    );
  }

  setActiveBrowserProvider(provider);

  const accounts: string[] = await provider.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error(`Connection request to ${ext.name} was rejected or cancelled.`);
  }

  const address = ethers.getAddress(accounts[0]);

  let chainId = 1;
  try {
    const chainIdHex: string = await provider.request({ method: 'eth_chainId' });
    chainId = parseInt(chainIdHex, 16) || 1;
  } catch {
    chainId = 1;
  }

  let balanceETH = '0.0000';
  try {
    const balHex = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    balanceETH = (Number(BigInt(balHex)) / 1e18).toFixed(4);
  } catch {
    balanceETH = '0.0000';
  }

  const chainNames: Record<number, string> = {
    1: 'Ethereum Mainnet',
    42161: 'Arbitrum One',
    8453: 'Base',
    56: 'BNB Smart Chain',
    137: 'Polygon',
    10: 'Optimism',
    11155111: 'Sepolia Testnet',
  };

  const connected: ConnectedWeb3Wallet = {
    address,
    chainId,
    chainName: chainNames[chainId] || `Chain #${chainId}`,
    balanceETH,
    providerType: 'EXTENSION',
    walletName: ext.name,
    walletIcon: ext.icon,
    connectedAt: Date.now(),
  };

  saveConnectedWallet(connected);
  return connected;
}

export function createWalletConnectPairingSession(): {
  uri: string;
  topic: string;
  relayUrl: string;
} {
  const randomTopic = ethers.hexlify(ethers.randomBytes(32)).slice(2);
  const symKey = ethers.hexlify(ethers.randomBytes(32)).slice(2);
  const relay = 'relay.walletconnect.org';
  const uri = `wc:${randomTopic}@2?relay-protocol=irn&symKey=${symKey}`;
  return {
    uri,
    topic: randomTopic,
    relayUrl: `wss://${relay}`,
  };
}

export function linkManualExternalWallet(
  address: string,
  chainName: string = 'Ethereum Mainnet'
): ConnectedWeb3Wallet {
  const cleaned = address.trim();
  if (!cleaned.startsWith('0x') || cleaned.length !== 42) {
    throw new Error('Please enter a valid EVM address starting with 0x (42 characters).');
  }

  const checksummed = ethers.getAddress(cleaned);

  const connected: ConnectedWeb3Wallet = {
    address: checksummed,
    chainId: 1,
    chainName,
    balanceETH: '0.0000',
    providerType: 'MANUAL',
    connectedAt: Date.now(),
  };

  saveConnectedWallet(connected);
  return connected;
}

export interface LightningTransferReceipt {
  id: string;
  txHash: string;
  networkName: string;
  networkSymbol: string;
  chainId: number;
  amountCoin: number;
  amountUSD: number;
  recipientAddress: string;
  senderAddress: string;
  speedTier: 'LIGHTNING_TURBO' | 'EXPEDITED' | 'STANDARD_SECURE';
  settlementTimeSec: number;
  blockNumber: number;
  explorerUrl: string;
  status: 'BROADCASTING' | 'MEMPOOL_PROPAGATING' | 'MINED_IN_BLOCK' | 'CONFIRMED_IN_WALLET';
  timestamp: number;
  isRealOnChain: boolean;
}

export async function fetchLiveWalletBalance(
  address: string
): Promise<{ balanceETH: string; rawWei: bigint }> {
  if (isEthereumAvailable()) {
    try {
      const ethereum = (window as any).ethereum;
      const balHex: string = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const wei = BigInt(balHex);
      const balanceETH = (Number(wei) / 1e18).toFixed(5);
      return { balanceETH, rawWei: wei };
    } catch {
      // fallback
    }
  }

  // Fallback direct public RPC query
  try {
    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com', 1, {
      staticNetwork: true,
    });
    const wei = await provider.getBalance(address);
    return {
      balanceETH: (Number(wei) / 1e18).toFixed(5),
      rawWei: wei,
    };
  } catch {
    return { balanceETH: '0.0000', rawWei: BigInt(0) };
  }
}

// Real on-chain transaction execution with Ethers BrowserProvider or JsonRpcProvider and tx.wait(1)
export async function executeRealMainnetTransaction(txParams: {
  to: string;
  from?: string;
  valueWei?: string;
  data?: string;
  networkName?: string;
  chainId?: number;
  privateKey?: string;
}): Promise<{
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  receipt: any;
}> {
  const activeProvider = getActiveBrowserProvider();
  let signer: ethers.Signer | null = null;
  const toAddress = ethers.getAddress(txParams.to);
  const chainId = txParams.chainId || 1;

  if (activeProvider) {
    try {
      const browserProvider = new ethers.BrowserProvider(activeProvider);
      signer = await browserProvider.getSigner();
    } catch {
      // fallback to key
    }
  }

  // Fallback: If no browser provider is detected, use the executor private key via real network RPC
  if (!signer && txParams.privateKey) {
    const defaultRpcs: Record<number, string> = {
      1: 'https://eth.llamarpc.com',
      11155111: 'https://rpc.sepolia.org',
      8453: 'https://mainnet.base.org',
      42161: 'https://arb1.arbitrum.io/rpc',
      56: 'https://bsc-dataseed.binance.org/',
      137: 'https://polygon-rpc.com',
    };
    const rpcUrl = defaultRpcs[chainId] || 'https://eth.llamarpc.com';
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });
    signer = new ethers.Wallet(txParams.privateKey, rpcProvider);
  }

  if (!signer) {
    throw new Error(
      'Real on-chain transaction broadcast requires a connected Web3 wallet (MetaMask / Rabby / Coinbase) or a funded Executor Wallet key with network gas.'
    );
  }

  try {
    const txResponse = await signer.sendTransaction({
      to: toAddress,
      value: txParams.valueWei ? BigInt(txParams.valueWei) : BigInt(0),
      data: txParams.data || '0x',
    });

    // Asynchronously wait for the transaction to be mined on the real blockchain mempool/blocks
    const receipt = await txResponse.wait(1);

    if (!receipt) {
      throw new Error('Transaction was submitted to blockchain node but receipt was not returned in time.');
    }

    const gasUsed = receipt.gasUsed ? receipt.gasUsed.toString() : '21000';
    const blockNumber = receipt.blockNumber || 0;

    // Persist real transaction to Cloud Firestore
    const network = txParams.networkName || (chainId === 11155111 ? 'Sepolia Testnet' : chainId === 8453 ? 'Base Mainnet' : chainId === 42161 ? 'Arbitrum One' : 'Ethereum Mainnet');
    const explorerUrl =
      chainId === 11155111
        ? `https://sepolia.etherscan.io/tx/${receipt.hash}`
        : chainId === 42161
        ? `https://arbiscan.io/tx/${receipt.hash}`
        : chainId === 8453
        ? `https://basescan.org/tx/${receipt.hash}`
        : `https://etherscan.io/tx/${receipt.hash}`;

    const senderAddress = txParams.from || (await signer.getAddress());

    await persistTransactionToCloud({
      id: `tx-${Date.now()}-${receipt.hash.slice(2, 10)}`,
      txHash: receipt.hash,
      networkName: network,
      chainId,
      from: senderAddress,
      to: toAddress,
      valueETH: txParams.valueWei ? (Number(BigInt(txParams.valueWei)) / 1e18).toFixed(6) : '0',
      gasUsed,
      blockNumber,
      status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
      explorerUrl,
      timestamp: Date.now(),
    });

    return {
      txHash: receipt.hash,
      blockNumber,
      gasUsed,
      receipt,
    };
  } catch (err: any) {
    // Robust Web3 error handling
    if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected') || err.message?.includes('User rejected')) {
      throw new Error('Transaction rejected by user in Web3 wallet extension.');
    }
    if (err.code === 'INSUFFICIENT_FUNDS' || err.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds in wallet to cover amount and gas fee on the target blockchain.');
    }
    if (err.message?.includes('gas required exceeds allowance') || err.message?.includes('always failing transaction')) {
      throw new Error('Smart contract execution error or gas limit exceeded. Check inputs and token approvals.');
    }
    throw new Error(err.message || 'On-chain transaction execution failed.');
  }
}

// Convert ETH amount to hex wei
export function parseETHToHexWei(amountETH: number): string {
  try {
    const weiBigInt = ethers.parseEther(amountETH.toFixed(8));
    return '0x' + weiBigInt.toString(16);
  } catch {
    return '0x0';
  }
}

// Broadcasts real on-chain transaction and returns txHash string
export async function broadcastRealOnChainTransaction(params: {
  from: string;
  to: string;
  valueWei?: string;
  data?: string;
  gasLimitHex?: string;
  networkName?: string;
  chainId?: number;
}): Promise<string> {
  const result = await executeRealMainnetTransaction(params);
  return result.txHash;
}
