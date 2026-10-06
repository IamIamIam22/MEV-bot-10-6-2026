import { ethers } from 'ethers';

export interface PlatformKeypair {
  id: string;
  name: string;
  address: string;
  privateKey: string;
  mnemonic: string;
  derivationPath: string;
  createdAt: number;
  balanceETH: string;
  balanceUSD: number;
  isColdStorage: boolean;
  tokenBalances: Array<{ symbol: string; amount: number; amountUSD: number }>;
}

export interface PlatformWalletsState {
  executor: PlatformKeypair;
  profitVault: PlatformKeypair;
  additionalWallets: PlatformKeypair[];
}

const STORAGE_KEY = 'mev_platform_wallets_v3';

// Verify that a mnemonic phrase mathematically derives to the expected address
export function verifyMnemonicMatch(
  mnemonic: string,
  expectedAddress: string,
  path: string = "m/44'/60'/0'/0/0"
): { matches: boolean; derivedAddress: string; error?: string } {
  try {
    const cleaned = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
    const wallet = ethers.HDNodeWallet.fromPhrase(cleaned, undefined, path);
    const matches = wallet.address.toLowerCase() === expectedAddress.toLowerCase();
    return {
      matches,
      derivedAddress: wallet.address,
    };
  } catch (err: any) {
    return {
      matches: false,
      derivedAddress: '',
      error: err.message || 'Invalid BIP-39 mnemonic phrase format',
    };
  }
}

// Generate a cryptographically genuine fresh wallet with 100% matching 12-word seed
export function generateGenuineWallet(
  id: string,
  name: string,
  isColdStorage: boolean
): PlatformKeypair {
  const randomWallet = ethers.Wallet.createRandom();
  const phrase = randomWallet.mnemonic?.phrase || '';
  const path = "m/44'/60'/0'/0/0";

  return {
    id,
    name,
    address: randomWallet.address,
    privateKey: randomWallet.privateKey,
    mnemonic: phrase,
    derivationPath: path,
    createdAt: Date.now(),
    balanceETH: '0.0000',
    balanceUSD: 0,
    isColdStorage,
    tokenBalances: [
      { symbol: 'USDC', amount: 0, amountUSD: 0 },
      { symbol: 'ETH', amount: 0, amountUSD: 0 },
    ],
  };
}

// Import an existing mnemonic phrase with mathematical derivation
export function restoreWalletFromPhrase(
  mnemonic: string,
  name: string,
  isColdStorage: boolean,
  path: string = "m/44'/60'/0'/0/0"
): PlatformKeypair {
  const cleaned = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  const hdWallet = ethers.HDNodeWallet.fromPhrase(cleaned, undefined, path);

  return {
    id: `wallet-custom-${Date.now()}`,
    name,
    address: hdWallet.address,
    privateKey: hdWallet.privateKey,
    mnemonic: cleaned,
    derivationPath: path,
    createdAt: Date.now(),
    balanceETH: '0.0000',
    balanceUSD: 0,
    isColdStorage,
    tokenBalances: [
      { symbol: 'USDC', amount: 0, amountUSD: 0 },
      { symbol: 'ETH', amount: 0, amountUSD: 0 },
    ],
  };
}

// Check for legacy/mock test addresses (like hardhat 0x7099... or 0x397f...)
function isLegacyMockAddress(address?: string): boolean {
  if (!address) return true;
  const legacy = [
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    '0x2546bcd3c84621e976d8185a91a922ae77ecec30',
    '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
  ];
  return legacy.includes(address.toLowerCase());
}

// Initialize or load real platform wallets
export function getOrInitPlatformWallets(): PlatformWalletsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PlatformWalletsState;
      // Ensure existing wallets are genuine and not legacy mock test accounts
      if (
        parsed.executor &&
        parsed.profitVault &&
        !isLegacyMockAddress(parsed.executor.address) &&
        !isLegacyMockAddress(parsed.profitVault.address)
      ) {
        // Validate mathematical derivation of both
        const execVerify = verifyMnemonicMatch(parsed.executor.mnemonic, parsed.executor.address);
        const vaultVerify = verifyMnemonicMatch(parsed.profitVault.mnemonic, parsed.profitVault.address);

        if (execVerify.matches && vaultVerify.matches) {
          return parsed;
        }
      }
    }
  } catch {
    // initialize fresh
  }

  // Generate genuine fresh wallets unique to this platform instance
  const executor = generateGenuineWallet(
    'executor-hot-node',
    'Hot MEV Executor Node (Gas Signer)',
    false
  );

  const profitVault = generateGenuineWallet(
    'vault-primary-profit',
    'Primary Profit Holding Vault (Air-Gapped Cold Storage)',
    true
  );

  const initial: PlatformWalletsState = {
    executor,
    profitVault,
    additionalWallets: [],
  };

  savePlatformWallets(initial);
  return initial;
}

export function savePlatformWallets(state: PlatformWalletsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save platform wallets to localStorage:', err);
  }
}
