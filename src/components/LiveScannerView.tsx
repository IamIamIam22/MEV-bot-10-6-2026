import React, { useState } from 'react';
import {
  ArbitrageOpportunity,
  BlockchainNetwork,
  LiveBlockInfo,
  MEVBotConfig,
  OpportunityLifecycleItem,
  ProfitHoldingWallet,
  WalletState,
} from '../types';
import {
  RotateCw,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Rocket,
  Coins,
  Shield,
  Wallet,
  CheckCircle,
  ExternalLink,
  Zap,
  Smartphone,
  ArrowRightLeft,
} from 'lucide-react';
import { OpportunityDeployModal } from './OpportunityDeployModal';
import { LifecycleTrackerView } from './LifecycleTrackerView';
import { UniswapSushiArbitragePanel } from './UniswapSushiArbitragePanel';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';
import { getActiveContractAddress } from '../services/contractManager';

interface LiveScannerViewProps {
  network: BlockchainNetwork;
  blockInfo: LiveBlockInfo;
  bots: MEVBotConfig[];
  opportunities: ArbitrageOpportunity[];
  walletState: WalletState;
  lifecycleItems: OpportunityLifecycleItem[];
  onDeployOpportunity: (lifecycleItem: OpportunityLifecycleItem) => void;
  onRefreshOpportunities: () => void;
  isExecuting: boolean;
  activeExecutionLog: string[];
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
  onOpenLightningModal?: () => void;
  onOpenMobileWalletModal?: (walletId?: 'metamask' | 'safepal' | 'bluewallet' | 'rabby') => void;
}

export const LiveScannerView: React.FC<LiveScannerViewProps> = ({
  network,
  blockInfo,
  bots,
  opportunities,
  walletState,
  lifecycleItems,
  onDeployOpportunity,
  onRefreshOpportunities,
  isExecuting,
  activeExecutionLog,
  connectedWallet,
  onOpenConnectWallet,
  onOpenLightningModal,
  onOpenMobileWalletModal,
}) => {
  const [viewMode, setViewMode] = useState<'scanner' | 'uniswap_sushi' | 'lifecycle'>('scanner');
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [deployModalOpp, setDeployModalOpp] = useState<ArbitrageOpportunity | null>(null);
  const [autoExecute, setAutoExecute] = useState(false);

  const activeBotCount = bots.filter((b) => b.enabled).length;
  const totalCaptured = bots.reduce((acc, b) => acc + b.profitCapturedUSD, 0);

  const activeVault: ProfitHoldingWallet =
    walletState.profit.holdingWallets?.find(
      (w) => w.id === walletState.profit.activeWalletId
    ) ||
    walletState.profit.holdingWallets?.[0] || {
      id: 'default-vault',
      name: 'Primary Profit Holding Vault (Air-Gapped)',
      address: walletState.profit.address,
      isColdStorage: true,
      createdAt: Date.now(),
      balanceUSD: walletState.profit.totalAccumulatedUSD,
      tokenBalances: [
        { symbol: 'USDC', amount: 11200.0, amountUSD: 11200.0 },
        { symbol: 'ETH', amount: 2.52, amountUSD: 8694.0 },
        { symbol: 'USDT', amount: 3375.0, amountUSD: 3375.0 },
        { symbol: 'WBTC', amount: 0.0252, amountUSD: 1621.75 },
      ],
    };

  const handleOpenDeployModal = (opp: ArbitrageOpportunity) => {
    setDeployModalOpp(opp);
  };

  const handleDeployModalComplete = (item: OpportunityLifecycleItem) => {
    onDeployOpportunity(item);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active MEV Bots</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{activeBotCount}</span>
            <span className="text-xs text-slate-400">/ {bots.length} Online</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Parallel Mempool & RPC Polling
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Profit Holder Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              ${activeVault.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate flex items-center justify-between">
            {connectedWallet ? (
              <span className="truncate">
                Recipient: <span className="text-emerald-300 font-bold font-mono">{connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}</span>
              </span>
            ) : (
              <span className="truncate">
                Vault: <span className="text-slate-200 font-semibold">{activeVault.name}</span>
              </span>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {onOpenLightningModal && (
                <button
                  type="button"
                  onClick={onOpenLightningModal}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30 flex items-center gap-1 transition"
                  title="⚡ Lightning Transfer - Arrive in Wallet in Under 1 Minute"
                >
                  <Zap className="w-2.5 h-2.5 fill-amber-300" />
                  <span>⚡ Payout</span>
                </button>
              )}
              {onOpenMobileWalletModal && (
                <button
                  type="button"
                  onClick={() => onOpenMobileWalletModal()}
                  className="text-[10px] text-indigo-300 hover:text-white font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1 transition"
                  title="Open Mobile Wallet App (MetaMask, SafePal, BlueWallet, Rabby)"
                >
                  <Smartphone className="w-2.5 h-2.5 text-indigo-400" />
                  <span>📱 Phone</span>
                </button>
              )}
              {onOpenConnectWallet && (
                <button
                  type="button"
                  onClick={onOpenConnectWallet}
                  className="text-[10px] text-cyan-400 hover:underline font-bold ml-1"
                >
                  {connectedWallet ? 'Manage' : 'Link'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Executor Gas Reserve</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-300">
              {walletState.executor.nativeBalance} {network.symbol}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {walletState.executor.address.slice(0, 8)}...{walletState.executor.address.slice(-6)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Lifecycle Tracker</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {lifecycleItems.length}
            </span>
            <span className="text-xs text-slate-400">Deployed & Settled</span>
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'scanner' ? 'lifecycle' : 'scanner')}
            className="mt-2 text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            {viewMode === 'scanner' ? 'Inspect Lifecycle Tracker →' : '← Back to DEX Scanner'}
          </button>
        </div>
      </div>

      {/* Sub-Nav View Switcher */}
      <div className="flex items-center justify-between p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('scanner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'scanner'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Live DEX Scanner ({opportunities.length})
          </button>

          <button
            type="button"
            onClick={() => setViewMode('uniswap_sushi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'uniswap_sushi'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-pink-400" />
            Uniswap & SushiSwap Live Terminal
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lifecycle')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'lifecycle'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Opportunity Lifecycle Tracker ({lifecycleItems.length} Deployed)
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs pr-2">
          <span className="text-slate-400 text-[11px]">Network:</span>
          <span className="font-bold text-cyan-300 font-mono text-[11px]">{network.name}</span>
        </div>
      </div>

      {/* Conditional: ViewMode === 'lifecycle' */}
      {viewMode === 'lifecycle' ? (
        <LifecycleTrackerView
          lifecycleItems={lifecycleItems}
          network={network}
          walletState={walletState}
          onOpenDeployModalForOpp={() => {
            if (opportunities[0]) {
              handleOpenDeployModal(opportunities[0]);
            }
          }}
        />
      ) : viewMode === 'uniswap_sushi' ? (
        <UniswapSushiArbitragePanel
          activeContractAddress={getActiveContractAddress()}
          connectedWallet={connectedWallet}
          onOpenConnectWallet={onOpenConnectWallet}
          onArbitrageExecuted={(txHash, profitUSD) => {
            onRefreshOpportunities();
          }}
        />
      ) : (
        /* ViewMode === 'scanner' */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Opportunities Feed */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white">
                  Live DEX Arbitrage Opportunities ({network.name})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Auto-Execute Toggle */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
                  <input
                    type="checkbox"
                    checked={autoExecute}
                    onChange={(e) => setAutoExecute(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="font-semibold text-[11px]">Auto-Deploy Net &gt; $20</span>
                </label>

                <button
                  onClick={onRefreshOpportunities}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Rescan Pools"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List of real opportunities */}
            <div className="space-y-2.5">
              {opportunities.map((opp) => {
                const isSelected = selectedOpportunity?.id === opp.id;
                const isProfitable = opp.netProfitUSD > 0;
                const isDeployed = opp.status === 'DEPLOYED';

                return (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpportunity(opp)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700">
                          {opp.tokenPair}
                        </span>
                        <span className="text-xs text-slate-400">
                          {opp.poolA.name} → {opp.poolB.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-400">
                            Delta: <span className="text-cyan-300">+{opp.priceDeltaPct.toFixed(2)}%</span>
                          </div>
                          <div
                            className={`text-sm font-black font-mono ${
                              isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isProfitable ? '+' : ''}${opp.netProfitUSD.toFixed(2)} Net
                          </div>
                        </div>

                        {/* DEPLOY BUTTON */}
                        <button
                          disabled={isExecuting || !isProfitable}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeployModal(opp);
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition transform active:scale-95 ${
                            isDeployed
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                              : isProfitable
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Rocket className="w-3.5 h-3.5 fill-current" />
                          <span>{isDeployed ? 'Redeploy' : 'Deploy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Settlement & Available Coins Preview */}
                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Deposit Target:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {activeVault.name}
                        </span>
                        <span className="text-slate-400 font-mono">
                          (${activeVault.balanceUSD.toLocaleString()} USD)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>Available in Vault:</span>
                        <span className="text-slate-200 font-mono font-bold">
                          USDC, ETH, USDT, WBTC
                        </span>
                      </div>
                    </div>

                    {/* Pool Reserve Details */}
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="block text-slate-500">Pool A Price:</span>
                        <span className="font-mono text-slate-200">${opp.poolA.price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Pool B Price:</span>
                        <span className="font-mono text-slate-200">${opp.poolB.price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Gross Arbitrage:</span>
                        <span className="font-mono text-slate-200">${opp.grossProfitUSD.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Est. EIP-1559 Gas:</span>
                        <span className="font-mono text-amber-300">${opp.estimatedGasUSD.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: EVM Console & Profit Holder Account Status */}
          <div className="space-y-4">
            {/* Profit Holder Account Settlement Card */}
            <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Profit Holder Account</h4>
                    <span className="text-[10px] text-slate-400">Active Deposit Destination</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  Air-Gapped
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Vault Balance:</span>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  ${activeVault.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-1">
                  {activeVault.address}
                </div>
              </div>

              {/* What type of coin is available */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-slate-300 font-bold text-[11px] flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  What Coins Are Available in Account:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {(activeVault.tokenBalances || []).map((coin) => (
                    <div
                      key={coin.symbol}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between"
                    >
                      <span className="text-slate-400 font-bold text-[10px]">{coin.symbol}</span>
                      <span className="text-emerald-400 font-mono font-bold text-xs">
                        {coin.amount >= 1000 ? `${(coin.amount / 1000).toFixed(1)}k` : coin.amount.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        ~${coin.amountUSD.toLocaleString()} USD
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active Network:</span>
                <span className="font-bold text-cyan-300 font-mono">{network.name}</span>
              </div>
            </div>

            {/* Execution Console */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    EVM Execution Console
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Block #{blockInfo.number}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] h-52 overflow-y-auto space-y-1 text-slate-300">
                {activeExecutionLog.length === 0 ? (
                  <div className="text-slate-500 italic py-8 text-center text-xs">
                    Ready to deploy.<br />
                    Click &ldquo;Deploy&rdquo; on any opportunity to generate payload, broadcast to {network.name}, track in lifecycle tracker, and deposit profit into your profit holder account.
                  </div>
                ) : (
                  activeExecutionLog.map((log, i) => (
                    <div
                      key={i}
                      className={`${
                        log.includes('[SUCCESS]') || log.includes('[DEPOSIT]')
                          ? 'text-emerald-400 font-bold'
                          : log.includes('[REVERT]')
                          ? 'text-rose-400 font-bold'
                          : log.includes('[GENERATE]') || log.includes('[TRACE]')
                          ? 'text-cyan-300/90'
                          : 'text-slate-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Deploy Modal */}
      {deployModalOpp && (
        <OpportunityDeployModal
          isOpen={!!deployModalOpp}
          opportunity={deployModalOpp}
          network={network}
          blockInfo={blockInfo}
          walletState={walletState}
          onClose={() => setDeployModalOpp(null)}
          onDeployComplete={handleDeployModalComplete}
          connectedWallet={connectedWallet}
          directPayoutEnabled={true}
        />
      )}
    </div>
  );
};
