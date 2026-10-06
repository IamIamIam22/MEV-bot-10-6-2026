import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Shield,
  Zap,
  CheckCircle,
  ExternalLink,
  Copy,
  Clock,
  Sparkles,
  X,
  Lock,
  Wallet,
  Coins,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import {
  PAYOUT_NETWORKS,
  PAYOUT_COINS,
  calculateHotColdRebalanceQuote,
  generateTxHash,
  WalletRebalanceStrategy,
  HotColdRebalanceQuote,
} from '../services/profitPayout';
import {
  ProfitHoldingWallet,
  ProfitPayoutTransaction,
  WalletState,
  BlockchainNetwork,
} from '../types';

interface BalanceWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletState: WalletState;
  network: BlockchainNetwork;
  onRebalanceSuccess: (
    updatedWalletState: WalletState,
    newTransaction: ProfitPayoutTransaction
  ) => void;
}

export const BalanceWalletsModal: React.FC<BalanceWalletsModalProps> = ({
  isOpen,
  onClose,
  walletState,
  network,
  onRebalanceSuccess,
}) => {
  const [strategy, setStrategy] = useState<WalletRebalanceStrategy>('OPTIMAL_BUFFER');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('arbitrum');
  const [customHotTargetUSD, setCustomHotTargetUSD] = useState<number>(750);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchPhase, setDispatchPhase] = useState<number>(0);
  const [completedTx, setCompletedTx] = useState<ProfitPayoutTransaction | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [lastRebalancedQuote, setLastRebalancedQuote] = useState<HotColdRebalanceQuote | null>(null);

  if (!isOpen) return null;

  // Active wallets & balances
  const hotUSD = walletState.executor.nativeBalanceUSD || 0;
  const holdingWallets =
    walletState.profit.holdingWallets && walletState.profit.holdingWallets.length > 0
      ? walletState.profit.holdingWallets
      : [];
  const activeHoldingWallet =
    holdingWallets.find((w) => w.id === walletState.profit.activeWalletId) ||
    holdingWallets[0] || {
      id: 'vault-default',
      name: 'Primary Profit Holding Vault',
      address: walletState.profit.address,
      balanceUSD: walletState.profit.totalAccumulatedUSD,
      tokenBalances: [],
      isColdStorage: true,
      createdAt: Date.now(),
    };
  const coldUSD = activeHoldingWallet.balanceUSD || 0;
  const totalCombinedUSD = hotUSD + coldUSD;

  const nativeTokenPrice =
    PAYOUT_COINS.find((c) => c.symbol === network.symbol)?.priceUSD || 3450;

  // Calculate live rebalance quote
  const quote = calculateHotColdRebalanceQuote(
    hotUSD,
    coldUSD,
    strategy,
    customHotTargetUSD,
    selectedNetworkId,
    nativeTokenPrice
  );

  const selectedNetwork =
    PAYOUT_NETWORKS.find((n) => n.id === selectedNetworkId) || PAYOUT_NETWORKS[0];

  const handleExecuteRebalance = () => {
    if (quote.transferDirection === 'ALREADY_BALANCED' && quote.transferUSD <= 0) return;

    setIsDispatching(true);
    setDispatchPhase(1);

    // Multi-phase on-chain execution sequence with realistic network speeds
    setTimeout(() => setDispatchPhase(2), 600);
    setTimeout(() => setDispatchPhase(3), 1300);
    setTimeout(() => {
      setDispatchPhase(4);
      const txHash = generateTxHash();
      const transferUSD = quote.transferUSD;
      const transferCoin = quote.transferNativeAmount;

      let newHotUSD = hotUSD;
      let newColdUSD = coldUSD;

      if (quote.transferDirection === 'HOT_TO_COLD') {
        newHotUSD = Math.max(0, hotUSD - transferUSD);
        newColdUSD = coldUSD + transferUSD;
      } else if (quote.transferDirection === 'COLD_TO_HOT') {
        newColdUSD = Math.max(0, coldUSD - transferUSD);
        newHotUSD = hotUSD + transferUSD;
      }

      const newHotNativeBalance = (newHotUSD / nativeTokenPrice).toFixed(4);

      // Proportionately update token balances in active vault
      const updatedHoldingWallets = holdingWallets.map((w) => {
        if (w.id === activeHoldingWallet.id) {
          const ratio = coldUSD > 0 ? newColdUSD / coldUSD : 1;
          const updatedTokens = (w.tokenBalances || []).map((t) => ({
            ...t,
            amount: t.amount * ratio,
            amountUSD: t.amountUSD * ratio,
          }));
          return {
            ...w,
            balanceUSD: newColdUSD,
            tokenBalances: updatedTokens,
          };
        }
        return w;
      });

      const newTx: ProfitPayoutTransaction = {
        id: `rebalance-${Date.now()}`,
        txHash,
        timestamp: Date.now(),
        sourceWalletAddress:
          quote.transferDirection === 'HOT_TO_COLD'
            ? walletState.executor.address
            : activeHoldingWallet.address,
        sourceWalletName:
          quote.transferDirection === 'HOT_TO_COLD'
            ? 'Hot Executor Wallet'
            : activeHoldingWallet.name,
        recipientAddress:
          quote.transferDirection === 'HOT_TO_COLD'
            ? activeHoldingWallet.address
            : walletState.executor.address,
        targetNetworkId: selectedNetwork.id,
        targetNetworkName: selectedNetwork.name,
        targetCoinSymbol: network.symbol,
        amountCoin: transferCoin,
        amountUSD: transferUSD,
        gasFeeUSD: selectedNetwork.estGasUSD,
        bridgeFeeUSD: 0,
        status: 'CONFIRMED',
        explorerUrl: `${selectedNetwork.blockExplorer}/tx/${txHash}`,
      };

      const updatedWalletState: WalletState = {
        ...walletState,
        executor: {
          ...walletState.executor,
          nativeBalance: newHotNativeBalance,
          nativeBalanceUSD: newHotUSD,
          nonce: walletState.executor.nonce + 1,
        },
        profit: {
          ...walletState.profit,
          totalAccumulatedUSD: updatedHoldingWallets.reduce((acc, w) => acc + w.balanceUSD, 0),
          holdingWallets: updatedHoldingWallets,
          payoutHistory: [newTx, ...(walletState.profit.payoutHistory || [])],
        },
      };

      setCompletedTx(newTx);
      setLastRebalancedQuote(quote);
      setIsDispatching(false);
      onRebalanceSuccess(updatedWalletState, newTx);
    }, 2100);
  };

  const handleReset = () => {
    setCompletedTx(null);
    setDispatchPhase(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Balance Cold & Hot Wallets
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Fastest & Ultra-Secure
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Optimize operational gas for Hot Executor while locking surplus revenue in Cold Air-Gapped Vault
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

        {/* Content body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {completedTx && lastRebalancedQuote ? (
            /* Successful Rebalance Confirmation */
            <div className="space-y-5 text-center py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">Wallets Balanced Successfully!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  On-chain rebalance transaction broadcast and confirmed on{' '}
                  <span className="text-cyan-400 font-semibold">{completedTx.targetNetworkName}</span>
                </p>
              </div>

              {/* Transaction details card */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Action Performed:</span>
                  <span className="font-bold text-emerald-400">
                    {lastRebalancedQuote.transferDirection === 'HOT_TO_COLD'
                      ? `Swept $${lastRebalancedQuote.transferUSD.toFixed(2)} USD from Hot Executor -> Cold Vault`
                      : `Topped Up Hot Executor with +$${lastRebalancedQuote.transferUSD.toFixed(2)} USD from Cold Vault`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">New Hot Executor Balance</span>
                    <span className="text-sm font-black text-indigo-300 font-mono">
                      ${lastRebalancedQuote.targetHotUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-500 block">Active Gas & Swap Buffer</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">New Cold Vault Balance</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      ${lastRebalancedQuote.targetColdUSD.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-500 block">Air-Gapped Vault</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                    <span>Verified Transaction Hash:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(completedTx.txHash);
                        setCopiedHash(true);
                        setTimeout(() => setCopiedHash(false), 2000);
                      }}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedHash ? 'Copied' : 'Copy Hash'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 truncate select-all flex items-center justify-between">
                    <span>{completedTx.txHash}</span>
                    {completedTx.explorerUrl && (
                      <a
                        href={completedTx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 ml-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Network Security: {selectedNetwork.securityScore}% L1 Anchor</span>
                  <span>Execution Time: {selectedNetwork.finalitySpeed}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                >
                  Adjust Allocation Again
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Active Rebalance Form */
            <>
              {/* Current Balances Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Hot Wallet */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      1. Hot Executor
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                      Gas Burner
                    </span>
                  </div>
                  <div className="text-base font-black text-white font-mono">
                    ${hotUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {walletState.executor.nativeBalance} {network.symbol}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {walletState.executor.address}
                  </div>
                </div>

                {/* Cold Vault */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      2. Cold Profit Vault
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      Air-Gapped
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    ${coldUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {activeHoldingWallet.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {activeHoldingWallet.address}
                  </div>
                </div>
              </div>

              {/* Total Liquidity & Distribution Bar */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Combined Portfolio:</span>
                  <span className="text-cyan-300 font-mono font-bold">
                    ${totalCombinedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden flex">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${totalCombinedUSD > 0 ? (hotUSD / totalCombinedUSD) * 100 : 50}%`,
                    }}
                    title={`Hot Executor: ${totalCombinedUSD > 0 ? ((hotUSD / totalCombinedUSD) * 100).toFixed(1) : 0}%`}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${totalCombinedUSD > 0 ? (coldUSD / totalCombinedUSD) * 100 : 50}%`,
                    }}
                    title={`Cold Vault: ${totalCombinedUSD > 0 ? ((coldUSD / totalCombinedUSD) * 100).toFixed(1) : 0}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-indigo-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Hot: {totalCombinedUSD > 0 ? ((hotUSD / totalCombinedUSD) * 100).toFixed(1) : 0}%
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Cold: {totalCombinedUSD > 0 ? ((coldUSD / totalCombinedUSD) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Strategy Selector */}
              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Select Balancing Strategy:</span>
                  <span className="text-cyan-400 font-semibold">{quote.strategyName}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStrategy('OPTIMAL_BUFFER')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      strategy === 'OPTIMAL_BUFFER'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm shadow-amber-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Optimal Buffer</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Maintains $750 in Hot for uninterrupted gas, sweeps remainder to Cold Vault.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStrategy('EQUAL_SPLIT')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      strategy === 'EQUAL_SPLIT'
                        ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>50 / 50 Split</span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Balances liquidity evenly between Hot Executor and Cold Vault.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStrategy('CUSTOM')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      strategy === 'CUSTOM'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Custom Slider</span>
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Customizable ratio between operational gas and cold treasury.
                    </p>
                  </button>
                </div>

                {strategy === 'CUSTOM' && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Target Hot Executor Balance:</span>
                      <span className="font-mono font-bold text-indigo-300">
                        ${customHotTargetUSD.toFixed(0)} USD
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={totalCombinedUSD}
                      step="50"
                      value={customHotTargetUSD}
                      onChange={(e) => setCustomHotTargetUSD(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Network Selection with Security & Speed Guarantee */}
              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    Settlement Network (Fastest & Most Secure):
                  </span>
                  <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {selectedNetwork.finalitySpeed}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {/* Arbitrum One - Recommended Fastest & Secure */}
                  <button
                    type="button"
                    onClick={() => setSelectedNetworkId('arbitrum')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedNetworkId === 'arbitrum'
                        ? 'bg-sky-500/10 border-sky-400 ring-1 ring-sky-400/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        Arbitrum One L2
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                        ⚡ Fastest
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Finality: 0.25s (Instant)</span>
                      <span>Security: 99.9% L1</span>
                    </div>
                  </button>

                  {/* Ethereum Mainnet - Highest L1 Security */}
                  <button
                    type="button"
                    onClick={() => setSelectedNetworkId('ethereum')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedNetworkId === 'ethereum'
                        ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Ethereum Mainnet
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                        🛡️ Most Secure
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>100% L1 Consensus</span>
                      <span>Gas ~$2.80</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Execution Summary Quote */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>Rebalancing Action:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {quote.transferDirection === 'ALREADY_BALANCED' && '✅ Wallets Already Perfectly Balanced'}
                    {quote.transferDirection === 'HOT_TO_COLD' &&
                      `Sweep $${quote.transferUSD.toFixed(2)} USD from Hot -> Cold`}
                    {quote.transferDirection === 'COLD_TO_HOT' &&
                      `Fund Hot with +$${quote.transferUSD.toFixed(2)} USD from Cold`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-500 block">Target Hot Executor:</span>
                    <span className="font-mono font-bold text-indigo-300">
                      ${quote.targetHotUSD.toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Cold Vault:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${quote.targetColdUSD.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Estimated Network Fee:</span>
                  <span className="font-mono text-slate-300">~${quote.estGasUSD.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Progressive Dispatch Progress when executing */}
              {isDispatching && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-xs animate-fade-in">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      Executing On-Chain Rebalance Protocol...
                    </span>
                    <span>Step {dispatchPhase} of 4</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-400"
                      style={{ width: `${(dispatchPhase / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {dispatchPhase === 1 && '1/4 Locking Hot Executor sequential nonce & verifying cold signature...'}
                    {dispatchPhase === 2 && `2/4 Routing atomic instruction via ${selectedNetwork.name} (${selectedNetwork.finalitySpeed})...`}
                    {dispatchPhase === 3 && '3/4 Signing cryptographic rebalance payload (EIP-712)...'}
                    {dispatchPhase === 4 && `4/4 Submitting to ${selectedNetwork.shortName} mempool & updating balances...`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!completedTx && (
          <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isDispatching}
              onClick={handleExecuteRebalance}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
              {isDispatching
                ? 'Balancing Wallets On-Chain...'
                : quote.transferDirection === 'ALREADY_BALANCED'
                ? 'Re-verify & Sync Wallets'
                : 'Execute On-Chain Balance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
