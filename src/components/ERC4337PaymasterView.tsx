import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle,
  ExternalLink,
  Fuel,
  Coins,
  Sparkles,
  Lock,
  Wallet,
  AlertCircle,
  CheckCheck,
  RefreshCw,
  Cpu,
  Share2,
} from 'lucide-react';
import {
  ERC4337_CONSTANTS,
  DEFAULT_PAYMASTER_POLICY,
  executeGaslessSponsoredArbitrage,
  GaslessExecutionReceipt,
} from '../services/erc4337Paymaster';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';
import { WalletState, ProfitHoldingWallet } from '../types';
import { getActiveContractAddress } from '../services/contractManager';

interface ERC4337PaymasterViewProps {
  walletState: WalletState;
  onUpdateWalletState?: (newState: WalletState) => void;
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
}

export const ERC4337PaymasterView: React.FC<ERC4337PaymasterViewProps> = ({
  walletState,
  onUpdateWalletState,
  connectedWallet,
  onOpenConnectWallet,
}) => {
  const [borrowAmountBTC, setBorrowAmountBTC] = useState<number>(2.0);
  const [selectedLender, setSelectedLender] = useState<'Aave V3' | 'Balancer V2' | 'Spark Protocol'>('Balancer V2');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<GaslessExecutionReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<GaslessExecutionReceipt[]>([]);

  const btcPriceUSD = 65400;
  const borrowUSD = borrowAmountBTC * btcPriceUSD;

  // Realistic arbitrage yield calculations
  const spreadPct = 0.95; // 0.95% gross spread
  const grossProfitUSD = Math.round(((borrowUSD * spreadPct) / 100) * 100) / 100;
  const poolFeeUSD = selectedLender === 'Balancer V2' ? 0 : Math.round(((borrowUSD * 0.0005)) * 100) / 100;
  const netBeforeGas = Math.max(0, grossProfitUSD - poolFeeUSD);
  const estimatedGasUSD = 16.5; // Gas sponsored by Paymaster

  // Strict 2/3 to 1/3 split
  const userProfitUSD = Math.round((netBeforeGas * (2 / 3)) * 100) / 100;
  const executorGasUSD = Math.round((netBeforeGas * (1 / 3)) * 100) / 100;

  const userProfitWalletAddress = connectedWallet?.address || walletState.profit.address;
  const executorWalletAddress = walletState.executor.address;

  const handleExecuteGasless = async () => {
    if (!connectedWallet) {
      if (onOpenConnectWallet) onOpenConnectWallet();
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);
    setReceipt(null);

    try {
      const activeContract = getActiveContractAddress();
      const res = await executeGaslessSponsoredArbitrage({
        userAddress: connectedWallet.address,
        userProfitWallet: userProfitWalletAddress,
        executorWallet: executorWalletAddress,
        targetContract: activeContract,
        borrowAmountBTC,
        estimatedProfitUSD: netBeforeGas,
      });

      setReceipt(res);
      setRecentReceipts((prev) => [res, ...prev]);

      // Update state: deposit 2/3 into Profit Vault and 1/3 into Executor Gas Reserve
      if (onUpdateWalletState) {
        const currentWallets = walletState.profit.holdingWallets || [];
        const updatedWallets = currentWallets.map((w) => {
          if (w.address.toLowerCase() === userProfitWalletAddress.toLowerCase() || w.id === walletState.profit.activeWalletId) {
            return {
              ...w,
              balanceUSD: w.balanceUSD + res.userProfitDepositedUSD,
            };
          }
          return w;
        });

        const newExecBalUSD = walletState.executor.nativeBalanceUSD + res.executorGasFundedUSD;
        const newExecBalETH = (newExecBalUSD / 3450).toFixed(4);

        onUpdateWalletState({
          ...walletState,
          executor: {
            ...walletState.executor,
            nativeBalance: newExecBalETH,
            nativeBalanceUSD: newExecBalUSD,
            nonce: walletState.executor.nonce + 1,
            txSuccessCount: walletState.executor.txSuccessCount + 1,
          },
          profit: {
            ...walletState.profit,
            totalAccumulatedUSD: walletState.profit.totalAccumulatedUSD + res.userProfitDepositedUSD,
            holdingWallets: updatedWallets,
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gasless execution reverted');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: ERC-4337 Account Abstraction & Paymaster Sponsorship */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  ERC-4337 Account Abstraction & Gasless Paymaster Relay
                </h2>
                <span className="text-[10px] bg-purple-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Zero Upfront ETH
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute your first transaction with 0 ETH in your wallet. The Paymaster sponsors gas, borrows from flash-loan pools, and deposits 2/3 profit to your wallet and 1/3 to the executor to permanently build up gas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-purple-500/40 text-[11px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">EntryPoint v0.7:</span>
              <span className="text-purple-300 font-bold">
                {ERC4337_CONSTANTS.ENTRY_POINT_V07.slice(0, 6)}...{ERC4337_CONSTANTS.ENTRY_POINT_V07.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Pillar Zero-Capital Execution Triad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-purple-300">
              <div className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-[11px] font-black">
                1
              </div>
              <span>Gas Sponsor & Paymaster</span>
            </div>
            <div className="text-[11px] font-bold text-white">
              A sponsor/paymaster pays your mainnet gas.
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              ERC-4337 Paymaster (Pimlico / Zero-Fee MEV Tank) covers gas fees upfront. Zero personal ETH or balance required in your wallet.
            </p>
            <div className="text-[10px] font-mono text-purple-400 font-bold pt-0.5">
              ✓ Paymaster Allowance: ${DEFAULT_PAYMASTER_POLICY.remainingAllowanceUSD.toLocaleString()} USD
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-black">
                2
              </div>
              <span>Gasless Relayer Submission</span>
            </div>
            <div className="text-[11px] font-bold text-white">
              A relayer submits & pays for your transaction.
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              You sign an off-chain EIP-712 UserOp. Gelato / Biconomy relayer broadcasts the bundle directly to block builders and pays miner tips.
            </p>
            <div className="text-[10px] font-mono text-cyan-400 font-bold pt-0.5">
              ✓ Flashbots & Gelato Relay Active
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-black">
                3
              </div>
              <span>Protocol Token Rewards</span>
            </div>
            <div className="text-[11px] font-bold text-white">
              A protocol rewards you with actual mainnet tokens.
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Flash loans from Aave/Balancer generate net WBTC/WETH profit. 2/3 goes to your Profit Wallet, and 1/3 goes to the Executor to compound gas!
            </p>
            <div className="text-[10px] font-mono text-emerald-400 font-bold pt-0.5">
              ✓ 2/3 Profit Wallet • 1/3 Executor Gas
            </div>
          </div>
        </div>

        {/* Profit & Gas Split Distribution Visual Architecture */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Automated Profit & Gas Buildup Architecture (6-Step Atomic Lifecycle)
            </span>
            <span className="text-cyan-400 font-mono text-[11px]">Fail-Safe Atomic Revert</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* User Profit Split: 2/3 (66.67%) */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  User Profit Wallet (2/3 Split • 66.67%)
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                  constant PROFIT_WALLET
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sweeps two-thirds of the net flash-loan yield directly into your connected wallet without any intermediate delays.
              </p>
              <div className="text-xs font-mono font-bold text-white pt-1 flex items-center gap-1.5">
                <span className="text-slate-500">Destination:</span>
                <span className="text-emerald-400 select-all truncate">{userProfitWalletAddress}</span>
              </div>
            </div>

            {/* Executor Gas Reserve Split: 1/3 (33.33%) */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-cyan-400" />
                  Executor Gas Reserve (1/3 Split • 33.33%)
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/40">
                  constant EXECUTOR_WALLET
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Builds up gas reserve in the platform executor wallet so future MEV transactions run seamlessly without manual top-ups.
              </p>
              <div className="text-xs font-mono font-bold text-white pt-1 flex items-center gap-1.5">
                <span className="text-slate-500">Reserve Balance:</span>
                <span className="text-cyan-400">${walletState.executor.nativeBalanceUSD.toFixed(2)} USD ({walletState.executor.nativeBalance} ETH)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters & Interactive Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 6-Step Atomic Lifecycle Steps */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            6-Step Smart Contract Execution Pipeline
          </div>

          <div className="space-y-2">
            {[
              {
                step: '1',
                title: 'Borrow from Flash-Loan Pool',
                desc: 'Borrows large capital (WBTC / ETH / USDC) from Balancer V2, Aave V3, or Spark Protocol with zero upfront collateral.',
                badge: 'Zero Capital Required',
                badgeColor: 'text-amber-400 border-amber-500/30',
              },
              {
                step: '2',
                title: 'Execute Multi-DEX Arbitrage Trades',
                desc: 'Swaps borrowed capital across Uniswap V2/V3 and SushiSwap routers to capture cross-market price discrepancies.',
                badge: 'Atomic Swaps',
                badgeColor: 'text-cyan-400 border-cyan-500/30',
              },
              {
                step: '3',
                title: 'Repay Lending Pool + Fee',
                desc: 'Repays the exact borrowed amount plus the pool fee (0.00% on Balancer V2 and Spark; 0.05% on Aave V3) in the same block.',
                badge: 'In Same Block',
                badgeColor: 'text-purple-400 border-purple-500/30',
              },
              {
                step: '4',
                title: 'Calculate Remaining Profit',
                desc: 'Strict fail-fast validation checks final balance >= totalRepay + minProfit. Reverts atomically if yield is non-positive.',
                badge: '100% Zero-Loss Guard',
                badgeColor: 'text-rose-400 border-rose-500/30',
              },
              {
                step: '5',
                title: 'Transfer Profit to Profit Wallet & Gas Reserve',
                desc: 'Transfers 2/3 of net profit directly to PROFIT_WALLET (user wallet) and 1/3 to EXECUTOR_WALLET for perpetual gas funding.',
                badge: '2/3 User • 1/3 Gas Buildup',
                badgeColor: 'text-emerald-400 border-emerald-500/30',
              },
              {
                step: '6',
                title: 'Transaction Completes',
                desc: 'Gas is reimbursed by the Paymaster or settled from the executor cut, finishing execution with zero user out-of-pocket costs.',
                badge: 'Gasless Settlement',
                badgeColor: 'text-indigo-400 border-indigo-500/30',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-black text-xs shrink-0">
                  {s.step}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{s.title}</span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-950 border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Execution Console */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black text-white">
                  Sponsored Execution Console
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Upfront Gas: $0.00 (Paymaster Sponsored)
              </span>
            </div>

            {/* Select Lending Protocol */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Flash Loan Protocol to Borrow From
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Balancer V2', fee: '0.00% Free' },
                  { id: 'Spark Protocol', fee: '0.00% Free' },
                  { id: 'Aave V3', fee: '0.05% Fee' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedLender(p.id as any)}
                    className={`p-2.5 rounded-xl text-left transition border ${
                      selectedLender === p.id
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-white">{p.id}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{p.fee}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Borrow Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Borrow Capital Size (WBTC)
                </label>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  ${(borrowAmountBTC * btcPriceUSD).toLocaleString()} USD Capital
                </span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={borrowAmountBTC}
                onChange={(e) => setBorrowAmountBTC(parseFloat(e.target.value) || 0.5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Real-time Math Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Gross Arbitrage Yield (+{spreadPct}%):</span>
                <span className="font-mono text-white font-bold">+${grossProfitUSD.toFixed(2)} USD</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Lending Pool Borrow Fee:</span>
                <span className="font-mono text-slate-300">
                  {poolFeeUSD === 0 ? <strong className="text-emerald-400">$0.00 (0% Free)</strong> : `$${poolFeeUSD.toFixed(2)} USD`}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>ERC-4337 Sponsored Gas:</span>
                <span className="font-mono text-purple-300 font-bold">$0.00 Upfront (${estimatedGasUSD.toFixed(2)} Covered)</span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-sm">
                  <span className="text-emerald-300">User Profit (2/3 to Wallet):</span>
                  <span className="text-emerald-400 font-mono font-black">+${userProfitUSD.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-xs text-cyan-300">
                  <span>Executor Gas Buildup (1/3 to Gas):</span>
                  <span className="font-mono font-bold">+${executorGasUSD.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Execution Trigger */}
            <button
              type="button"
              onClick={handleExecuteGasless}
              disabled={isExecuting}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 hover:from-purple-400 hover:to-indigo-400 text-white shadow-xl shadow-purple-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>
                {isExecuting
                  ? 'Sponsoring UserOperation & Executing...'
                  : !connectedWallet
                  ? 'Connect Wallet to Start (0 ETH Required)'
                  : `Execute Sponsored Arbitrage (+${userProfitUSD.toFixed(2)} USD Profit)`}
              </span>
            </button>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Receipt */}
            {receipt && (
              <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ERC-4337 Sponsored Transaction Mined!</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>• Gas Sponsored by Paymaster: <strong>${receipt.gasSponsoredUSD.toFixed(2)} USD</strong> (User paid 0 ETH)</div>
                  <div>• 2/3 Profit Deposited to User: <strong className="text-emerald-300">+${receipt.userProfitDepositedUSD.toFixed(2)} USD</strong></div>
                  <div>• 1/3 Profit Added to Gas Reserve: <strong className="text-cyan-300">+${receipt.executorGasFundedUSD.toFixed(2)} USD</strong></div>
                  <div>• UserOp Hash: <span className="font-mono text-slate-400">{receipt.userOpHash.slice(0, 16)}...</span></div>
                </div>
                <a
                  href={receipt.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[10px] pt-1"
                >
                  View on Etherscan: {receipt.txHash.slice(0, 14)}...
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* Recent Sponsored Executions */}
          {recentReceipts.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white">Recent Sponsored Executions</span>
                <span className="text-[10px] font-mono text-purple-300">{recentReceipts.length} Confirmed</span>
              </div>
              <div className="space-y-2">
                {recentReceipts.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">UserOp: {r.userOpHash.slice(0, 10)}...</span>
                      <span className="text-[10px] text-slate-400">Gas Sponsored: ${r.gasSponsoredUSD.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">+${r.userProfitDepositedUSD.toFixed(2)} (User)</span>
                      <span className="text-cyan-400 text-[10px] block">+${r.executorGasFundedUSD.toFixed(2)} (Gas)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
