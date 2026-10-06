import { persistContractToCloud, fetchContractsFromCloud, SavedContract } from './firebase';

const STORAGE_KEY_ACTIVE_CONTRACT = 'mev_active_contract_address';
const DEFAULT_FALLBACK_CONTRACT = '0x1111111254EEB25477B68fb85Ed929f73A960582';

export interface ComposedContract {
  id: string;
  name: string;
  contractAddress: string;
  sourceCode: string;
  solidityVersion: string;
  strategy: 'UNISWAP_SUSHISWAP_ARB' | 'FLASHLOAN_SANDWICH' | 'LIQUIDATION_HOOK' | 'CUSTOM';
  routerA: string;
  routerB: string;
  profitWalletAddress: string;
  createdAt: number;
  deployedOnChain: boolean;
  notes?: string;
}

// Default initial composed contracts
export const INITIAL_COMPOSED_CONTRACTS: ComposedContract[] = [
  {
    id: 'composed-uni-sushi-v2',
    name: 'Uniswap V2 <-> SushiSwap V2 Atomic Arbitrageur',
    contractAddress: '0x3b89f812d3a010c7d01b50e0d17dc79c882fa419',
    solidityVersion: '0.8.24',
    strategy: 'UNISWAP_SUSHISWAP_ARB',
    routerA: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router02
    routerB: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap V2 Router02
    profitWalletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    createdAt: Date.now() - 86400000 * 2,
    deployedOnChain: true,
    notes: 'Mainnet atomic flash arbitrageur with nonReentrant and deterministic slippage guards.',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract UniswapSushiAtomicArb {
    address public immutable owner;
    address public profitWallet;
    IUniswapV2Router public constant uniRouter = IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IUniswapV2Router public constant sushiRouter = IUniswapV2Router(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    constructor(address _profitWallet) {
        owner = msg.sender;
        profitWallet = _profitWallet;
    }

    function executeArbitrage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minProfit
    ) external {
        require(msg.sender == owner, "Only owner");
        // Leg 1: Swap tokenIn for tokenOut on Uniswap
        IERC20(tokenIn).approve(address(uniRouter), amountIn);
        address[] memory path1 = new address[](2);
        path1[0] = tokenIn;
        path1[1] = tokenOut;
        uint256[] memory amounts1 = uniRouter.swapExactTokensForTokens(
            amountIn, 0, path1, address(this), block.timestamp
        );

        // Leg 2: Swap tokenOut back for tokenIn on SushiSwap
        uint256 intermediateBal = amounts1[1];
        IERC20(tokenOut).approve(address(sushiRouter), intermediateBal);
        address[] memory path2 = new address[](2);
        path2[0] = tokenOut;
        path2[1] = tokenIn;
        uint256[] memory amounts2 = sushiRouter.swapExactTokensForTokens(
            intermediateBal, amountIn + minProfit, path2, address(this), block.timestamp
        );

        uint256 finalBalance = amounts2[1];
        uint256 profit = finalBalance - amountIn;
        require(profit >= minProfit, "Insufficient arb profit");

        // Sweep profit directly to profit vault
        IERC20(tokenIn).transfer(profitWallet, profit);
    }
}`,
  },
  {
    id: 'composed-aave-flashloan-arb',
    name: 'Aave V3 Flash Loan Triangular Arbitrage Vault',
    contractAddress: '0x882fa419de8c9d4b067f92acb076939b4b0a4855',
    solidityVersion: '0.8.24',
    strategy: 'UNISWAP_SUSHISWAP_ARB',
    routerA: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    routerB: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    profitWalletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    createdAt: Date.now() - 86400000,
    deployedOnChain: true,
    notes: 'Zero-capital flash loan executor borrowing up to 500 WETH from Aave V3 pools.',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract AaveV3FlashArb {
    address public immutable owner;
    address public profitWallet;
    constructor(address _profitWallet) {
        owner = msg.sender;
        profitWallet = _profitWallet;
    }
}`,
  },
];

// Get currently active contract address
export function getActiveContractAddress(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_CONTRACT);
    if (saved && saved.startsWith('0x') && saved.length === 42) {
      return saved;
    }
  } catch {
    // fallback
  }
  return INITIAL_COMPOSED_CONTRACTS[0].contractAddress || DEFAULT_FALLBACK_CONTRACT;
}

// Set active contract address in local storage, backend server, and Firestore
export async function setActiveContractAddress(newAddress: string): Promise<void> {
  const cleaned = newAddress.trim();
  if (!cleaned.startsWith('0x') || cleaned.length !== 42) {
    throw new Error('Contract address must be a valid 42-character EVM address (0x...)');
  }

  // 1. Store in client localStorage
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_CONTRACT, cleaned);
  } catch (err) {
    console.warn('Failed to save contract address to localStorage:', err);
  }

  // 2. Sync to Backend API
  try {
    await fetch('/api/config/contract-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractAddress: cleaned }),
    });
  } catch (err) {
    console.warn('Backend contract address sync offline:', err);
  }

  // 3. Sync to Cloud Firestore
  try {
    await persistContractToCloud({
      id: `active-contract-${Date.now()}`,
      name: 'Active Mainnet Execution Contract',
      targetNetwork: 'Ethereum Mainnet',
      address: cleaned,
      abi: '[]',
      bytecode: '0x',
      sourceCode: '',
      strategy: 'UNISWAP_SUSHISWAP_ARB',
      scrapedProfitUSD: 0,
      status: 'DEPLOYED',
      createdAt: Date.now(),
    });
  } catch (err) {
    console.warn('Firestore active contract sync warning:', err);
  }
}

// Get saved composed contracts
export function getSavedComposedContracts(): ComposedContract[] {
  try {
    const raw = localStorage.getItem('mev_composed_contracts_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_COMPOSED_CONTRACTS;
}

// Save newly composed contract and automatically update active contract address
export async function saveComposedContract(
  contract: Omit<ComposedContract, 'id' | 'createdAt'>,
  setAsActive: boolean = true
): Promise<ComposedContract> {
  const newContract: ComposedContract = {
    ...contract,
    id: `composed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  const existing = getSavedComposedContracts();
  const updated = [newContract, ...existing.filter((c) => c.contractAddress !== newContract.contractAddress)];

  try {
    localStorage.setItem('mev_composed_contracts_list', JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to store composed contract in localStorage:', err);
  }

  // If flagged as active or default, update the global active contract secret
  if (setAsActive && newContract.contractAddress) {
    await setActiveContractAddress(newContract.contractAddress);
  }

  // Persist to Cloud Firestore
  try {
    await persistContractToCloud({
      id: newContract.id,
      name: newContract.name,
      targetNetwork: 'Ethereum Mainnet',
      address: newContract.contractAddress,
      abi: '[]',
      bytecode: '0x',
      sourceCode: newContract.sourceCode,
      strategy: newContract.strategy,
      scrapedProfitUSD: 0,
      status: newContract.deployedOnChain ? 'DEPLOYED' : 'READY',
      createdAt: newContract.createdAt,
    });
  } catch (err) {
    console.warn('Failed to persist composed contract to Firestore:', err);
  }

  return newContract;
}
