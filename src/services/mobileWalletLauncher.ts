export interface MobileWalletApp {
  id: 'metamask' | 'safepal' | 'bluewallet' | 'rabby' | 'trust' | 'coinbase';
  name: string;
  tagline: string;
  badge: string;
  brandColor: string;
  accentBg: string;
  borderColor: string;
  textColor: string;
  iconType: 'metamask' | 'safepal' | 'bluewallet' | 'rabby' | 'trust' | 'coinbase';
  schemes: {
    appScheme: string;
    dappUniversalLink: (url: string) => string;
    dappSchemeLink: (url: string) => string;
    paymentLink?: (params: { address: string; amount?: number; memo?: string }) => string;
  };
  storeLinks: {
    ios: string;
    android: string;
    website: string;
  };
  features: string[];
  supportsLightning: boolean;
  supportsHardware: boolean;
}

export const SUPPORTED_MOBILE_WALLETS: MobileWalletApp[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    tagline: 'World\'s #1 Web3 Mobile & Desktop Wallet',
    badge: 'EVM & Arbitrum / Base',
    brandColor: '#F6851B',
    accentBg: 'bg-orange-500/10 hover:bg-orange-500/20',
    borderColor: 'border-orange-500/40 hover:border-orange-500',
    textColor: 'text-orange-400',
    iconType: 'metamask',
    schemes: {
      appScheme: 'metamask://',
      dappUniversalLink: (url: string) => {
        const clean = url.replace(/^https?:\/\//, '');
        return `https://metamask.app.link/dapp/${clean}`;
      },
      dappSchemeLink: (url: string) => {
        const clean = url.replace(/^https?:\/\//, '');
        return `metamask://dapp/${clean}`;
      },
      paymentLink: ({ address, amount }) => {
        return amount
          ? `ethereum:${address}?value=${amount}`
          : `ethereum:${address}`;
      },
    },
    storeLinks: {
      ios: 'https://apps.apple.com/app/metamask-blockchain-wallet/id1438144202',
      android: 'https://play.google.com/store/apps/details?id=io.metamask',
      website: 'https://metamask.io',
    },
    features: [
      'In-App Web3 dApp Browser',
      'Instant On-Chain Signatures',
      'Gas Fee Customization (EIP-1559)',
      'Arbitrum, Base, Ethereum & Sepolia',
    ],
    supportsLightning: false,
    supportsHardware: true,
  },
  {
    id: 'safepal',
    name: 'SafePal',
    tagline: 'Secure Hardware & Mobile Software Crypto Suite',
    badge: 'Hardware & Cold Storage',
    brandColor: '#3B82F6',
    accentBg: 'bg-blue-500/10 hover:bg-blue-500/20',
    borderColor: 'border-blue-500/40 hover:border-blue-500',
    textColor: 'text-blue-400',
    iconType: 'safepal',
    schemes: {
      appScheme: 'safepal://',
      dappUniversalLink: (url: string) => {
        return `https://link.safepal.io/dapp?url=${encodeURIComponent(url)}`;
      },
      dappSchemeLink: (url: string) => {
        return `safepal://dapp?url=${encodeURIComponent(url)}`;
      },
      paymentLink: ({ address }) => `safepal://transfer?address=${address}`,
    },
    storeLinks: {
      ios: 'https://apps.apple.com/app/safepal-crypto-wallet/id1548297139',
      android: 'https://play.google.com/store/apps/details?id=com.safepal.wallet',
      website: 'https://www.safepal.com',
    },
    features: [
      'S1 Air-Gapped Cold Hardware Pairing',
      'Multi-Chain dApp Browser with RPC Switch',
      'Encrypted Mnemonic & Master Key Import',
      '100+ Blockchains Supported',
    ],
    supportsLightning: false,
    supportsHardware: true,
  },
  {
    id: 'bluewallet',
    name: 'BlueWallet',
    tagline: 'Premier Bitcoin & Lightning Network Mobile Wallet',
    badge: '⚡ Lightning & Instant BTC',
    brandColor: '#0A84FF',
    accentBg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    borderColor: 'border-cyan-500/40 hover:border-cyan-500',
    textColor: 'text-cyan-400',
    iconType: 'bluewallet',
    schemes: {
      appScheme: 'bluewallet://',
      dappUniversalLink: (_url: string) => 'https://bluewallet.io',
      dappSchemeLink: (_url: string) => 'bluewallet://open',
      paymentLink: ({ address, amount, memo }) => {
        // If address looks like lightning or invoice, use lightning:
        if (address.toLowerCase().startsWith('lnbc') || address.toLowerCase().startsWith('lightning:')) {
          const invoice = address.replace(/^lightning:/i, '');
          return `lightning:${invoice}`;
        }
        let btcUri = `bitcoin:${address}`;
        const queryParams: string[] = [];
        if (amount) queryParams.push(`amount=${amount}`);
        if (memo) queryParams.push(`message=${encodeURIComponent(memo)}`);
        if (queryParams.length > 0) btcUri += `?${queryParams.join('&')}`;
        return btcUri;
      },
    },
    storeLinks: {
      ios: 'https://apps.apple.com/app/bluewallet-bitcoin-wallet/id1376878040',
      android: 'https://play.google.com/store/apps/details?id=io.bluewallet.bluewallet',
      website: 'https://bluewallet.io',
    },
    features: [
      'Sub-Minute Lightning Network Payouts',
      'Zero-Fee Layer 2 Microtransfers',
      'Mnemonic Seed & Master Key Import',
      'Watch-Only Cold Storage Vaults',
    ],
    supportsLightning: true,
    supportsHardware: true,
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    tagline: 'Game-Changing Game-Ready Multi-Chain Web3 Mobile & Extension',
    badge: 'Rabbit Security & DeBank',
    brandColor: '#8676FF',
    accentBg: 'bg-purple-500/10 hover:bg-purple-500/20',
    borderColor: 'border-purple-500/40 hover:border-purple-500',
    textColor: 'text-purple-300',
    iconType: 'rabby',
    schemes: {
      appScheme: 'rabby://',
      dappUniversalLink: (url: string) => {
        return `https://rabby.io?dapp=${encodeURIComponent(url)}`;
      },
      dappSchemeLink: (url: string) => {
        return `rabby://dapp?url=${encodeURIComponent(url)}`;
      },
      paymentLink: ({ address }) => `rabby://send?address=${address}`,
    },
    storeLinks: {
      ios: 'https://apps.apple.com/app/rabby-wallet-crypto-defi/id6474381473',
      android: 'https://play.google.com/store/apps/details?id=com.debank.rabbymobile',
      website: 'https://rabby.io',
    },
    features: [
      'Pre-Transaction Phishing & Honeypot Detection',
      'Multi-Chain Auto Switch Without Confirmation',
      'Simulation of Asset Balances Before Signing',
      'Direct Mobile Sync with Desktop Extension',
    ],
    supportsLightning: false,
    supportsHardware: true,
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    tagline: 'Secure Multi-Coin Crypto & dApp Gateway',
    badge: 'Binance & Multi-Chain',
    brandColor: '#0500FF',
    accentBg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    borderColor: 'border-indigo-500/40 hover:border-indigo-500',
    textColor: 'text-indigo-400',
    iconType: 'trust',
    schemes: {
      appScheme: 'trust://',
      dappUniversalLink: (url: string) => {
        return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`;
      },
      dappSchemeLink: (url: string) => {
        return `trust://open_url?url=${encodeURIComponent(url)}`;
      },
      paymentLink: ({ address }) => `ethereum:${address}`,
    },
    storeLinks: {
      ios: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
      android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
      website: 'https://trustwallet.com',
    },
    features: [
      'Built-in Web3 Browser',
      'Token Staking & Yield Vaults',
      'DEX & Bridge Integrations',
    ],
    supportsLightning: false,
    supportsHardware: false,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    tagline: 'Self-Custody Mobile Wallet by Coinbase',
    badge: 'Base & Smart Wallets',
    brandColor: '#0052FF',
    accentBg: 'bg-blue-600/10 hover:bg-blue-600/20',
    borderColor: 'border-blue-600/40 hover:border-blue-600',
    textColor: 'text-blue-300',
    iconType: 'coinbase',
    schemes: {
      appScheme: 'cbwallet://',
      dappUniversalLink: (url: string) => {
        return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`;
      },
      dappSchemeLink: (url: string) => {
        return `cbwallet://dapp?url=${encodeURIComponent(url)}`;
      },
      paymentLink: ({ address }) => `ethereum:${address}`,
    },
    storeLinks: {
      ios: 'https://apps.apple.com/app/coinbase-wallet-nfts-crypto/id1278383455',
      android: 'https://play.google.com/store/apps/details?id=org.toshi',
      website: 'https://www.coinbase.com/wallet',
    },
    features: [
      'Base L2 Native Support',
      'Passkey & Seed Phrase Security',
      'Universal Web3 dApp Browser',
    ],
    supportsLightning: false,
    supportsHardware: true,
  },
];

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
}

export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Get current application URL to open inside mobile wallet dApp browsers
 */
export function getCurrentAppUrl(): string {
  if (typeof window === 'undefined') return 'https://arbitrage-mev.app';
  return window.location.href;
}

/**
 * Triggers mobile app opening or falls back safely without breaking iframe
 */
export function openWalletApp(wallet: MobileWalletApp, mode: 'DAPP_BROWSER' | 'NATIVE_APP' | 'PAYMENT', paymentParams?: { address: string; amount?: number; memo?: string }) {
  const currentUrl = getCurrentAppUrl();
  let targetLink = '';

  if (mode === 'PAYMENT' && paymentParams && wallet.schemes.paymentLink) {
    targetLink = wallet.schemes.paymentLink(paymentParams);
  } else if (mode === 'DAPP_BROWSER') {
    targetLink = wallet.schemes.dappUniversalLink(currentUrl);
  } else {
    // Native app scheme or universal link
    targetLink = wallet.schemes.dappUniversalLink(currentUrl);
  }

  // Attempt to open
  try {
    const isMobile = isMobileDevice();
    if (isMobile) {
      // In mobile Safari or Chrome, redirecting or opening in new window triggers the OS deep link handler
      window.location.href = targetLink;
    } else {
      window.open(targetLink, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.error('Failed to launch wallet app:', err);
    // fallback to store
    const store = isIOS() ? wallet.storeLinks.ios : wallet.storeLinks.android;
    window.open(store, '_blank', 'noopener,noreferrer');
  }

  return targetLink;
}
