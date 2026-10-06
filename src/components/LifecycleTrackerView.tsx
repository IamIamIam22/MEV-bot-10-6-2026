import React, { useState } from 'react';
import { OpportunityLifecycleItem, BlockchainNetwork, WalletState } from '../types';
import {
  Cpu,
  CheckCircle,
  ExternalLink,
  Copy,
  Coins,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Terminal,
  Wallet,
} from 'lucide-react';

interface LifecycleTrackerViewProps {
  lifecycleItems: OpportunityLifecycleItem[];
  network: BlockchainNetwork;
  walletState: WalletState;
  onOpenDeployModalForOpp?: () => void;
}

export const LifecycleTrackerView: React.FC<LifecycleTrackerViewProps> = ({
  lifecycleItems,
  network,
  walletState,
  onOpenDeployModalForOpp,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OpportunityLifecycleItem | null>(
    lifecycleItems[0] || null
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const activeVault =
    walletState.profit.holdingWallets?.find(
      (w) => w.id === walletState.profit.activeWalletId
    ) ||
    walletState.profit.holdingWallets?.[0] || {
      name: 'Primary Profit Holding Vault',
      address: walletState.profit.address,
      balanceUSD: walletState.profit.totalAccumulatedUSD,
      tokenBalances: [
        { symbol: 'USDC', amount: 11200.0, amountUSD: 11200.0 },
        { symbol: 'ETH', amount: 2.52, amountUSD: 8694.0 },
        { symbol: 'USDT', amount: 3375.0, amountUSD: 3375.0 },
        { symbol: 'WBTC', amount: 0.0252, amountUSD: 1621.75 },
      ],
    };

  const totalCapturedInTracker = lifecycleItems.reduce((acc, item) => acc + item.netProfitUSD, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner: Profit Holder Account Status & Available Coins Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Cpu className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Opportunity Lifecycle Tracker & Profit Settlement
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic auditing of opportunities: Generate → Deploy → Relay → Confirmed → Profit Holder Deposit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Profit Holder Account Badge */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-right text-xs">
              <span className="text-[10px] text-slate-400 block">
                Profit Holder Account Balance:
              </span>
              <span className="text-base font-black text-emerald-400 font-mono">
                ${activeVault.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>
        </div>

        {/* Available Coins In Profit Holder Account */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              What Coins Are Available in Profit Holder Account ({activeVault.name}):
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              Active Network: {network.name} (Chain #{network.chainId})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(activeVault.tokenBalances || []).map((coin) => (
              <div
                key={coin.symbol}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{coin.symbol}</span>
                  <span className="text-[10px] text-slate-400">
                    ~${coin.amountUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400">
                    {coin.amount >= 1000 ? `${(coin.amount / 1000).toFixed(2)}k` : coin.amount.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-emerald-400/80 block uppercase font-bold">Liquid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tracker Grid */}
      {lifecycleItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Cpu className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-white">No Opportunities Deployed Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Go to the Live DEX Scanner tab, choose any profitable opportunity, and click &ldquo;Deploy&rdquo; to generate, deploy, track its full lifecycle, and deposit profits into your profit holder account!
          </p>
          {onOpenDeployModalForOpp && (
            <button
              onClick={onOpenDeployModalForOpp}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Deploy Sample Opportunity Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Deployed Opportunities Feed */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span>Deployed Opportunities ({lifecycleItems.length})</span>
              <span>Total Captured: +${totalCapturedInTracker.toFixed(2)} USD</span>
            </div>

            <div className="space-y-3">
              {lifecycleItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/20'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700">
                          {item.tokenPair}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.poolA} → {item.poolB}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                          {item.networkName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-emerald-400">
                            +${item.netProfitUSD.toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.depositedCoinAmount.toFixed(4)} {item.depositedCoinSymbol}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          PROFIT DEPOSITED
                        </span>
                      </div>
                    </div>

                    {/* 5-Stage Lifecycle Visualizer Mini-Bar */}
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold pt-1">
                      <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                        1. Generated
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                        2. Simulated
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                        3. Deployed
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                        4. Confirmed
                      </div>
                      <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 ring-1 ring-cyan-500/30">
                        5. Deposited ✓
                      </div>
                    </div>

                    {/* Settlement details */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Profit Holder Destination:</span>
                        <span className="font-semibold text-slate-200">{item.profitHolderWalletName}</span>
                        <span className="font-mono text-slate-400 text-[10px] block truncate max-w-[280px]">
                          {item.profitHolderAddress}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500 text-[11px] block">Vault Balance Post-Deposit:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          ${item.profitHolderBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Opportunity Lifecycle Inspector */}
          {selectedItem && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    Lifecycle Execution Log
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Block #{selectedItem.blockNumber}
                </span>
              </div>

              {/* Execution log terminal */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 max-h-56 overflow-y-auto">
                {selectedItem.logs.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.includes('[DEPOSIT]') || log.includes('[VAULT]')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('[GENERATE]')
                        ? 'text-cyan-300'
                        : log.includes('[DEPLOY]')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>

              {/* On-Chain Artifacts */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Transaction Hash:</span>
                  <button
                    onClick={() => copyToClipboard(selectedItem.txHash, selectedItem.id)}
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedHash === selectedItem.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 truncate select-all flex items-center justify-between">
                  <span>{selectedItem.txHash}</span>
                  {network.blockExplorer && (
                    <a
                      href={`${network.blockExplorer}/tx/${selectedItem.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 ml-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Contract Address:</span>
                  <span className="font-mono text-slate-300">{selectedItem.contractAddress}</span>
                </div>
              </div>

              {/* Available Coins in Vault */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Available Coins in {selectedItem.profitHolderWalletName}:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {selectedItem.profitHolderAvailableCoins.map((c) => (
                    <div key={c.symbol} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="font-bold text-white block">{c.symbol}</span>
                      <span className="text-emerald-400 font-mono">
                        {c.amount.toFixed(2)} (~${c.amountUSD.toLocaleString()})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
