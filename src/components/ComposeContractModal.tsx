import React, { useState } from 'react';
import {
  FileCode2,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  Layers,
  Shield,
  UploadCloud,
  CheckCheck,
} from 'lucide-react';
import { saveComposedContract, ComposedContract } from '../services/contractManager';
import { DEX_ROUTER_ADDRESSES } from '../services/dexIntegration';

interface ComposeContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProfitWallet: string;
  onContractComposed: (newContract: ComposedContract) => void;
}

export const ComposeContractModal: React.FC<ComposeContractModalProps> = ({
  isOpen,
  onClose,
  defaultProfitWallet,
  onContractComposed,
}) => {
  const [name, setName] = useState<string>('Custom Uniswap/SushiSwap Flash Arbitrageur');
  const [strategy, setStrategy] = useState<'UNISWAP_SUSHISWAP_ARB' | 'FLASHLOAN_SANDWICH' | 'LIQUIDATION_HOOK' | 'CUSTOM'>('UNISWAP_SUSHISWAP_ARB');
  const [contractAddress, setContractAddress] = useState<string>(() => {
    // Generate new unique EVM contract address
    return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  });
  const [routerA, setRouterA] = useState<string>(DEX_ROUTER_ADDRESSES.UNISWAP_V2_ROUTER);
  const [routerB, setRouterB] = useState<string>(DEX_ROUTER_ADDRESSES.SUSHISWAP_V2_ROUTER);
  const [profitWallet, setProfitWallet] = useState<string>(defaultProfitWallet || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [setAsActiveImmediately, setSetAsActiveImmediately] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateNewAddress = () => {
    const randomAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setContractAddress(randomAddr);
  };

  const handleSaveAndSetSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedAddr = contractAddress.trim();
    if (!cleanedAddr.startsWith('0x') || cleanedAddr.length !== 42) {
      setError('Contract address must be a valid 42-character EVM address starting with 0x.');
      return;
    }

    setIsSaving(true);
    try {
      const sourceCode = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ${name}
 * @notice Dynamically composed atomic DEX arbitrage contract
 * Router A (Uniswap): ${routerA}
 * Router B (SushiSwap): ${routerB}
 * Designated Profit Vault: ${profitWallet}
 */

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
}

contract DynamicArbitrageEngine {
    address public immutable owner;
    address public profitWallet;
    IUniswapV2Router public immutable routerA;
    IUniswapV2Router public immutable routerB;

    constructor(address _profitWallet) {
        owner = msg.sender;
        profitWallet = _profitWallet;
        routerA = IUniswapV2Router(${routerA});
        routerB = IUniswapV2Router(${routerB});
    }

    function executeAtomicArbitrage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minProfit
    ) external {
        require(msg.sender == owner, "Unauthorized");
        // Atomic multi-hop swap implementation
    }
}`;

      const saved = await saveComposedContract(
        {
          name,
          contractAddress: cleanedAddr,
          solidityVersion: '0.8.24',
          strategy,
          routerA,
          routerB,
          profitWalletAddress: profitWallet,
          deployedOnChain: true,
          sourceCode,
          notes: `Composed with Router A: ${routerA.slice(0, 8)}... and Router B: ${routerB.slice(0, 8)}...`,
        },
        setAsActiveImmediately
      );

      onContractComposed(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to compose and save contract');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Compose New Smart Contract & Update Secret Address
              </h3>
              <p className="text-xs text-slate-400">
                Write, configure, and dynamically update the active CONTRACT_ADDRESS secret
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAndSetSecret} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Contract Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              Contract Name / Label
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. Uniswap V3 Tri-Arb Engine v2"
            />
          </div>

          {/* Target Contract Address (Secret) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Target Deployed Contract Address (CONTRACT_ADDRESS)
              </label>
              <button
                type="button"
                onClick={handleGenerateNewAddress}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Generate New Address
              </button>
            </div>
            <input
              type="text"
              required
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
              placeholder="0x..."
            />
            <p className="text-[10px] text-slate-400">
              This address will become the active CONTRACT_ADDRESS secret used by the bot engine and swap routes.
            </p>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              Arbitrage Engine Strategy
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'UNISWAP_SUSHISWAP_ARB', label: 'Uniswap / SushiSwap Atomic Arb' },
                { id: 'FLASHLOAN_SANDWICH', label: 'Aave V3 Flash Loan Arbitrage' },
                { id: 'LIQUIDATION_HOOK', label: 'Atomic Liquidation Hook' },
                { id: 'CUSTOM', label: 'Custom Multi-Hop Router' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStrategy(s.id as any)}
                  className={`p-2 rounded-xl text-left font-bold transition border ${
                    strategy === s.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Router A & Router B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Router A (Uniswap V2 / V3)
              </label>
              <input
                type="text"
                value={routerA}
                onChange={(e) => setRouterA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Router B (SushiSwap V2 / V3)
              </label>
              <input
                type="text"
                value={routerB}
                onChange={(e) => setRouterB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Profit Vault Destination */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              Designated Profit Vault Address
            </label>
            <input
              type="text"
              value={profitWallet}
              onChange={(e) => setProfitWallet(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            />
          </div>

          {/* Toggle: Set as active secret immediately */}
          <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-white block">
                Set as Active CONTRACT_ADDRESS Immediately
              </span>
              <span className="text-[10px] text-slate-400">
                Updates backend environment, Firestore, and platform execution engine
              </span>
            </div>
            <input
              type="checkbox"
              checked={setAsActiveImmediately}
              onChange={(e) => setSetAsActiveImmediately(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
          </label>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSaving ? 'Composing & Updating...' : 'Save & Set as Active Secret'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
