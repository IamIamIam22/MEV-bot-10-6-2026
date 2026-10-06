import React, { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Copy,
  Clock,
  Sparkles,
  Lock,
  Wallet,
  Coins,
  Radio,
  Flame,
  CheckCheck,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Smartphone,
} from 'lucide-react';
import {
  BlockchainNetwork,
  LiveBlockInfo,
  ProfitPayoutTransaction,
  WalletState,
} from '../types';
import {
  ConnectedWeb3Wallet,
  fetchLiveWalletBalance,
  isEthereumAvailable,
} from '../services/web3Wallet';
import { LightningTransferModal } from './LightningTransferModal';

interface LightningTransferViewProps {
  network: BlockchainNetwork;
  blockInfo: LiveBlockInfo;
  walletState: WalletState;
  onUpdateWalletState: (newState: WalletState) => void;
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
  onOpenMobileWalletModal?: (walletId?: 'metamask' | 'safepal' | 'bluewallet' | 'rabby') => void;
}

export const LightningTransferView: React.FC<LightningTransferViewProps> = ({
  network,
  blockInfo,
  walletState,
  onUpdateWalletState,
  connectedWallet,
  onOpenConnectWallet,
  onOpenMobileWalletModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [liveBalanceETH, setLiveBalanceETH] = useState<string>('0.0000');
  const [isRefreshingBal, setIsRefreshingBal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Poll recipient balance
  const refreshRecipientBal = async () => {
    if (!connectedWallet?.address) return;
    setIsRefreshingBal(true);
    try {
      const res = await fetchLiveWalletBalance(connectedWallet.address);
      setLiveBalanceETH(res.balanceETH);
    } catch {
      // ignore
    } finally {
      setIsRefreshingBal(false);
    }
  };

  useEffect(() => {
    if (connectedWallet?.address) {
      refreshRecipientBal();
      const intv = setInterval(refreshRecipientBal, 8000);
      return () => clearInterval(intv);
    }
  }, [connectedWallet?.address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handlePayoutSuccess = (newTx: ProfitPayoutTransaction, updatedState?: WalletState) => {
    if (updatedState) {
      onUpdateWalletState(updatedState);
    }
    refreshRecipientBal();
  };

  const recentTxs = walletState.profit.payoutHistory || [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>Sub-Minute Lightning Settlement Protocol</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Instant Payouts & Real-Wallet Delivery
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Execute high-priority on-chain withdrawals that arrive in your personal wallet in under 1 minute.
              Backed by Arbitrum Nitro 0.25s block times, Base L2, and Turbo Gas replacement relays.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition transform active:scale-95 shrink-0"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Launch Lightning Transfer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Wallet Quick Launch Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <span>Open Wallet App Directly On Your Phone</span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-800/40">
                1-Tap Mobile Link
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Open BlueWallet for Lightning payments, or MetaMask, SafePal, and Rabby for instant L2 settlement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'bluewallet', label: '⚡ BlueWallet', color: 'border-cyan-500/50 hover:bg-cyan-950/40 text-cyan-300' },
            { id: 'metamask', label: '🦊 MetaMask', color: 'border-orange-500/50 hover:bg-orange-950/40 text-orange-300' },
            { id: 'safepal', label: '🛡️ SafePal', color: 'border-blue-500/50 hover:bg-blue-950/40 text-blue-300' },
            { id: 'rabby', label: '🐰 Rabby', color: 'border-purple-500/50 hover:bg-purple-950/40 text-purple-300' },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                if (onOpenMobileWalletModal) {
                  onOpenMobileWalletModal(w.id as any);
                }
              }}
              className={`px-3 py-1.5 rounded-xl bg-slate-900 border text-xs font-bold transition shadow-sm ${w.color}`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Balance & Destination Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connected Destination Wallet Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Destination Wallet
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="mt-3 space-y-1">
            {connectedWallet ? (
              <>
                <div className="text-xs text-slate-400">Connected Personal Wallet</div>
                <div className="font-mono text-emerald-300 font-bold text-sm truncate">
                  {connectedWallet.address}
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Live Balance:</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1">
                    {isRefreshingBal ? '...' : `${liveBalanceETH} ETH`}
                    <button
                      onClick={refreshRecipientBal}
                      className="p-1 hover:text-emerald-400"
                      title="Refresh Balance"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingBal ? 'animate-spin' : ''}`} />
                    </button>
                  </span>
                </div>
              </>
            ) : (
              <div className="py-2 text-center space-y-2">
                <p className="text-xs text-slate-400">No external wallet connected yet.</p>
                {onOpenConnectWallet && (
                  <button
                    onClick={onOpenConnectWallet}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition"
                  >
                    Link MetaMask or Ledger Wallet
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hot Executor Ready Gas Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Flame className="w-4 h-4 text-amber-400" />
              Hot Executor (Liquid Gas)
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/40">
              Immediate Send
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              ${walletState.executor.nativeBalanceUSD.toFixed(2)}{' '}
              <span className="text-xs text-slate-400">USD</span>
            </div>
            <div className="text-xs text-indigo-300 font-mono mt-0.5">
              {walletState.executor.nativeBalance} ETH Liquid Reserve
            </div>
            <div className="mt-2 text-[11px] text-slate-400 truncate">
              {walletState.executor.address}
            </div>
          </div>
        </div>

        {/* Cold Storage Vault Balance Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              Accumulated Bot Profits
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              Air-Gapped Vault
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${walletState.profit.totalAccumulatedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs text-slate-400">USD</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Available for instant sweep to your personal wallet
            </div>
            <div className="mt-2 text-[11px] text-slate-400 truncate">
              {walletState.profit.address}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Second Settlement Speedboard */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Live L2 & Lightning Network Finality Speedboard</h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Live Block: #{blockInfo.number}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span>Arbitrum Nitro</span>
              <span className="text-emerald-400 font-black">FASTEST</span>
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">0.25s</div>
            <div className="text-[10px] text-slate-500">Block finality • $0.08 gas</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span>Base L2</span>
              <span className="text-cyan-400 font-black">SUB-2S</span>
            </div>
            <div className="text-xl font-black text-cyan-300 font-mono">1.50s</div>
            <div className="text-[10px] text-slate-500">Coinbase OP • $0.05 gas</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span>Solana Slot</span>
              <span className="text-teal-400 font-black">400MS</span>
            </div>
            <div className="text-xl font-black text-teal-300 font-mono">0.40s</div>
            <div className="text-[10px] text-slate-500">Ultra-fast slot • $0.003 fee</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span>Ethereum L1</span>
              <span className="text-indigo-400 font-black">MAX SECURE</span>
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono">12.0s</div>
            <div className="text-[10px] text-slate-500">L1 PoS slot • $1.40 gas</div>
          </div>
        </div>
      </div>

      {/* Verified On-Chain Lightning Settlement History */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Verified Real-Time Payout Ledger ({recentTxs.length} Transactions)
            </h3>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>+ Send New Lightning Payout</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No payout transactions dispatched yet. Click &ldquo;Launch Lightning Transfer&rdquo; to send funds to your wallet!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/30 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap className="w-4 h-4 fill-amber-400/20" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        +${tx.amountUSD.toFixed(2)} USD
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({tx.amountCoin.toFixed(4)} {tx.targetCoinSymbol})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Route: <strong className="text-slate-200">{tx.targetNetworkName}</strong></span>
                      <span>•</span>
                      <span>To: <strong className="text-emerald-300 font-mono">{tx.recipientAddress.slice(0, 6)}...{tx.recipientAddress.slice(-4)}</strong></span>
                      <span>•</span>
                      <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                    <span>{tx.txHash.slice(0, 10)}...</span>
                    <button
                      onClick={() => copyToClipboard(tx.txHash)}
                      className="p-1 hover:text-white"
                      title="Copy Tx Hash"
                    >
                      {copiedHash === tx.txHash ? (
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Mount */}
      <LightningTransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        walletState={walletState}
        connectedWallet={connectedWallet}
        onOpenConnectWallet={onOpenConnectWallet}
        onSuccess={handlePayoutSuccess}
        onOpenMobileWalletModal={onOpenMobileWalletModal}
      />
    </div>
  );
};
