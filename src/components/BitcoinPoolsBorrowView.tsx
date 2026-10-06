import React, { useState } from 'react';
import {
  Coins,
  Shield,
  Zap,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Lock,
  Wallet,
  AlertCircle,
  Clock,
  RotateCw,
  Sliders,
} from 'lucide-react';
import {
  BITCOIN_BORROW_POOLS,
  BitcoinLendingPool,
  calculateBitcoinBorrowMetrics,
  executeBitcoinPoolBorrowAndArb,
  BitcoinBorrowExecutionResult,
} from '../services/bitcoinPools';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';
import { WalletState, ProfitHoldingWallet } from '../types';
import { getActiveContractAddress } from '../services/contractManager';

interface BitcoinPoolsBorrowViewProps {
  walletState: WalletState;
  onUpdateWalletState?: (newState: WalletState) => void;
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
}

export const BitcoinPoolsBorrowView: React.FC<BitcoinPoolsBorrowViewProps> = ({
  walletState,
  onUpdateWalletState,
  connectedWallet,
  onOpenConnectWallet,
}) => {
  const [selectedPool, setSelectedPool] = useState<BitcoinLendingPool>(BITCOIN_BORROW_POOLS[0]);
  const [borrowAmountBTC, setBorrowAmountBTC] = useState<number>(2.5);
  const [selectedRoute, setSelectedRoute] = useState<string>('Uniswap V3 (WBTC/WETH) -> SushiSwap V2');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<BitcoinBorrowExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentBorrows, setRecentBorrows] = useState<BitcoinBorrowExecutionResult[]>([]);

  const btcPriceUSD = 65400;

  // Active Profit Vault to receive all proceeds
  const activeProfitVault: ProfitHoldingWallet =
    walletState.profit.holdingWallets?.find(
      (w) => w.id === walletState.profit.activeWalletId
    ) ||
    walletState.profit.holdingWallets?.[0] || {
      id: 'default-vault',
      name: 'Primary Profit Holding Vault',
      address: walletState.profit.address,
      isColdStorage: true,
      createdAt: Date.now(),
      balanceUSD: walletState.profit.totalAccumulatedUSD,
      tokenBalances: [
        { symbol: 'USDC', amount: 11200.0, amountUSD: 11200.0 },
        { symbol: 'ETH', amount: 2.52, amountUSD: 8694.0 },
        { symbol: 'WBTC', amount: 0.0252, amountUSD: 1621.75 },
      ],
    };

  const metrics = calculateBitcoinBorrowMetrics(selectedPool, borrowAmountBTC, btcPriceUSD);

  const totalPoolLiquidityBTC = BITCOIN_BORROW_POOLS.reduce((acc, p) => acc + p.totalLiquidityBTC, 0);
  const totalAvailableBorrowBTC = BITCOIN_BORROW_POOLS.reduce((acc, p) => acc + p.availableBorrowBTC, 0);

  const handleBorrowAndExecute = async () => {
    if (!connectedWallet) {
      if (onOpenConnectWallet) onOpenConnectWallet();
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);
    setExecutionResult(null);

    try {
      const activeContract = getActiveContractAddress();
      const result = await executeBitcoinPoolBorrowAndArb({
        pool: selectedPool,
        borrowAmountBTC,
        contractAddress: activeContract,
        userAddress: connectedWallet.address,
        profitWalletAddress: activeProfitVault.address,
        dexRoute: selectedRoute,
      });

      setExecutionResult(result);
      setRecentBorrows((prev) => [result, ...prev]);

      // Deposit net profit into designated profit wallet in state
      if (onUpdateWalletState) {
        const currentWallets = walletState.profit.holdingWallets || [];
        const updatedWallets = currentWallets.map((w) => {
          if (w.id === activeProfitVault.id || w.address.toLowerCase() === activeProfitVault.address.toLowerCase()) {
            const currentTokens = w.tokenBalances || [];
            const btcToken = currentTokens.find((t) => t.symbol === selectedPool.borrowAsset);
            let updatedTokens;
            if (btcToken) {
              updatedTokens = currentTokens.map((t) =>
                t.symbol === selectedPool.borrowAsset
                  ? {
                      ...t,
                      amount: t.amount + result.netProfitBTC,
                      amountUSD: t.amountUSD + result.netProfitUSD,
                    }
                  : t
              );
            } else {
              updatedTokens = [
                ...currentTokens,
                {
                  symbol: selectedPool.borrowAsset,
                  amount: result.netProfitBTC,
                  amountUSD: result.netProfitUSD,
                },
              ];
            }
            return {
              ...w,
              balanceUSD: w.balanceUSD + result.netProfitUSD,
              tokenBalances: updatedTokens,
            };
          }
          return w;
        });

        onUpdateWalletState({
          ...walletState,
          profit: {
            ...walletState.profit,
            totalAccumulatedUSD: walletState.profit.totalAccumulatedUSD + result.netProfitUSD,
            holdingWallets: updatedWallets,
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Bitcoin borrow or execution reverted.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Bitcoin Pools Overview & Profit Vault Destination */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20">
              <Coins className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Multi-Pool Bitcoin Borrowing & Flash Arbitrage Engine
                </h2>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  8 Bitcoin Pools
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Borrow up to 400 BTC with 0 upfront collateral, execute multi-DEX atomic arbitrage, and deposit all net profits into your profit vault.
              </p>
            </div>
          </div>

          {/* Designated Profit Vault Card */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <span>Profit Vault Destination:</span>
                <span className="text-emerald-400 font-mono">
                  ${activeProfitVault.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="text-xs font-black text-white font-mono flex items-center gap-1.5">
                <span>{activeProfitVault.name}</span>
                <span className="text-[10px] text-slate-500">
                  ({activeProfitVault.address.slice(0, 6)}...{activeProfitVault.address.slice(-4)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Bitcoin Liquidity Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Borrowable Depth</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {totalAvailableBorrowBTC.toLocaleString()} BTC
            </span>
            <span className="text-[10px] text-slate-500 block">
              ~${((totalAvailableBorrowBTC * btcPriceUSD) / 1e6).toFixed(1)}M USD Liquidity
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Zero-Fee Flash Loans</span>
            <span className="text-sm font-black text-emerald-400 font-mono">0.00% Premium</span>
            <span className="text-[10px] text-slate-500 block">Balancer V2 & Spark Protocol</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Bitcoin Assets Supported</span>
            <span className="text-sm font-black text-cyan-300 font-mono">WBTC • cbBTC • tBTC</span>
            <span className="text-[10px] text-slate-500 block">Native ERC-20 BTC Wrappers</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Safety Guard</span>
            <span className="text-sm font-black text-rose-300 font-mono">Atomic Revert</span>
            <span className="text-[10px] text-slate-500 block">100% Zero-Loss on Negative Yield</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pool Selection (Left) & Borrow/Execution Controller (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: All 8 Bitcoin Pools */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Bitcoin Lending Pool to Borrow From
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {BITCOIN_BORROW_POOLS.length} Live Pools
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {BITCOIN_BORROW_POOLS.map((pool) => {
              const isSelected = pool.id === selectedPool.id;
              return (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPool(pool)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/70 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                        ₿
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block">{pool.name}</span>
                        <span className="text-[10px] text-slate-400">{pool.protocol} • Asset: {pool.borrowAsset}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {pool.zeroFee ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          0.00% FREE BORROW
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                          {pool.flashLoanFeePct}% Fee
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {pool.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/70 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Available Depth:</span>
                      <span className="font-bold text-amber-200 font-mono">
                        {pool.availableBorrowBTC.toFixed(1)} {pool.borrowAsset}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Max Single Loan:</span>
                      <span className="font-bold text-white font-mono">
                        {pool.maxSingleBorrowBTC} {pool.borrowAsset}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Pool Contract:</span>
                      <a
                        href={pool.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-cyan-400 hover:underline flex items-center justify-end gap-1 font-mono"
                      >
                        {pool.poolContractAddress.slice(0, 6)}...
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Borrow & Execution Controller */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Borrow & Execution Parameters
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Pool: <strong className="text-amber-300">{selectedPool.name}</strong>
              </span>
            </div>

            {/* Borrow Amount Input & Quick Sliders */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Borrow Amount ({selectedPool.borrowAsset})
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ${(borrowAmountBTC * btcPriceUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD Value
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedPool.maxSingleBorrowBTC}
                  value={borrowAmountBTC}
                  onChange={(e) => setBorrowAmountBTC(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs font-bold text-slate-400 shrink-0">
                  {selectedPool.borrowAsset}
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0.5, 1.0, 2.5, 5.0].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBorrowAmountBTC(amt)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
                      borrowAmountBTC === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {amt} {selectedPool.borrowAsset}
                  </button>
                ))}
              </div>
            </div>

            {/* Target DEX Arbitrage Route */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Target Arbitrage Execution Route
              </label>
              <div className="space-y-1.5">
                {[
                  'Uniswap V3 (WBTC/WETH) -> SushiSwap V2',
                  'Uniswap V2 (WBTC/USDC) -> Curve Finance Pool',
                  'Balancer V2 Vault -> Uniswap V3 Tri-Hop',
                ].map((route) => (
                  <button
                    key={route}
                    type="button"
                    onClick={() => setSelectedRoute(route)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition border flex items-center justify-between ${
                      selectedRoute === route
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{route}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Real-Time Live Execution Math Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Borrowed Principal:</span>
                <span className="font-mono text-white">
                  {borrowAmountBTC.toFixed(4)} {selectedPool.borrowAsset} (${(borrowAmountBTC * btcPriceUSD).toLocaleString()})
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Pool Flash Loan Fee ({selectedPool.flashLoanFeePct}%):</span>
                <span className="font-mono text-slate-300">
                  {selectedPool.zeroFee ? (
                    <strong className="text-emerald-400 font-bold">$0.00 (0% Free)</strong>
                  ) : (
                    `$${metrics.feePaidUSD.toFixed(2)} USD (${metrics.feePaidBTC.toFixed(6)} BTC)`
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Gross Cross-DEX Spread (+{metrics.grossSpreadPct}%):</span>
                <span className="font-mono text-emerald-400">
                  +${metrics.grossProfitUSD.toFixed(2)} USD
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated EVM Gas Cost:</span>
                <span className="font-mono text-slate-300">
                  ${metrics.estimatedGasUSD.toFixed(2)} USD
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-bold text-sm">
                <span className="text-white">Net Profit to Deposit into Vault:</span>
                <span className="text-emerald-400 font-mono font-black">
                  +${metrics.netProfitUSD.toFixed(2)} USD ({metrics.netProfitBTC.toFixed(6)} BTC)
                </span>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={handleBorrowAndExecute}
              disabled={isExecuting || !metrics.profitable}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-xl ${
                metrics.profitable
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isExecuting
                  ? 'Borrowing from Bitcoin Pool & Executing...'
                  : !connectedWallet
                  ? 'Connect Wallet to Borrow'
                  : `Borrow ${borrowAmountBTC} ${selectedPool.borrowAsset} & Execute Arbitrage`}
              </span>
            </button>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Execution Confirmation Card */}
            {executionResult && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bitcoin Flash Loan Arbitrage Settled on Mainnet!</span>
                </div>
                <div className="text-slate-300 text-[11px] space-y-1">
                  <div>
                    • Borrowed: <strong>{executionResult.borrowAmountBTC} BTC</strong> from {executionResult.poolName}
                  </div>
                  <div>
                    • Loan Repaid: <strong>In Same Block (#{executionResult.blockNumber})</strong>
                  </div>
                  <div>
                    • Net Profit Deposited: <strong className="text-emerald-300">+${executionResult.netProfitUSD.toFixed(2)} USD ({executionResult.netProfitBTC.toFixed(6)} BTC)</strong>
                  </div>
                  <div>
                    • Destination: <span className="font-mono text-slate-400">{executionResult.profitWalletAddress}</span>
                  </div>
                </div>
                <a
                  href={`https://etherscan.io/tx/${executionResult.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[10px] pt-1"
                >
                  View on Etherscan: {executionResult.txHash.slice(0, 14)}...
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* Recent Bitcoin Borrows & Deposited Profit Ledger */}
          {recentBorrows.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white">Recent Bitcoin Borrows & Swept Profits</span>
                <span className="text-[10px] font-mono text-slate-400">{recentBorrows.length} Executed</span>
              </div>

              <div className="space-y-2">
                {recentBorrows.map((b, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        Borrowed {b.borrowAmountBTC} BTC ({b.poolName})
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Block #{b.blockNumber} • Repaid in same block
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-400 font-mono block">
                        +${b.netProfitUSD.toFixed(2)} USD
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        +{b.netProfitBTC.toFixed(6)} BTC swept
                      </span>
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
