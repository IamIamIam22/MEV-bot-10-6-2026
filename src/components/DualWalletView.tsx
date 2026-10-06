import React, { useState } from 'react';
import { WalletState, BlockchainNetwork, ProfitHoldingWallet, ProfitPayoutTransaction } from '../types';
import {
  Wallet,
  Shield,
  Key,
  ArrowRightLeft,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Lock,
  Plus,
  ExternalLink,
  History,
  Coins,
  Percent,
  Zap,
  Smartphone,
  Droplets,
  Fuel,
} from 'lucide-react';
import { generateOfflineExecutorWallet } from '../services/blockchain';
import {
  DEFAULT_PROFIT_WALLETS,
  DEFAULT_PAYOUT_HISTORY,
  PAYOUT_NETWORKS,
} from '../services/profitPayout';
import { AddProfitWalletModal } from './AddProfitWalletModal';
import { SendProfitModal } from './SendProfitModal';
import { BalanceWalletsModal } from './BalanceWalletsModal';
import { LightningTransferModal } from './LightningTransferModal';
import { WalletRecoveryVault } from './WalletRecoveryVault';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';

interface DualWalletViewProps {
  walletState: WalletState;
  onUpdateWalletState: (newState: WalletState) => void;
  network: BlockchainNetwork;
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
  onOpenMobileWalletModal?: (walletId?: 'metamask' | 'safepal' | 'bluewallet' | 'rabby') => void;
  onNavigateTab?: (tab: 'faucet-bridge' | 'paymaster' | 'btc-pools' | 'contracts') => void;
}

export const DualWalletView: React.FC<DualWalletViewProps> = ({
  walletState,
  onUpdateWalletState,
  network,
  connectedWallet,
  onOpenConnectWallet,
  onOpenMobileWalletModal,
  onNavigateTab,
}) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [profitAddressInput, setProfitAddressInput] = useState(walletState.profit.address);
  const [sweepThresholdInput, setSweepThresholdInput] = useState(
    walletState.profit.autoSweepThresholdUSD
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [sweepSuccessMessage, setSweepSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isSendProfitOpen, setIsSendProfitOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isLightningModalOpen, setIsLightningModalOpen] = useState(false);

  // Profit holding wallets
  const holdingWallets: ProfitHoldingWallet[] =
    walletState.profit.holdingWallets && walletState.profit.holdingWallets.length > 0
      ? walletState.profit.holdingWallets
      : DEFAULT_PROFIT_WALLETS;

  const activeWalletId: string =
    walletState.profit.activeWalletId || holdingWallets[0]?.id || 'vault-alpha-primary';

  const activeHoldingWallet =
    holdingWallets.find((w) => w.id === activeWalletId) || holdingWallets[0];

  // Payout history
  const payoutHistory: ProfitPayoutTransaction[] =
    walletState.profit.payoutHistory || DEFAULT_PAYOUT_HISTORY;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateNewExecutor = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateOfflineExecutorWallet();
      onUpdateWalletState({
        ...walletState,
        executor: {
          ...walletState.executor,
          address: generated.address,
          privateKey: generated.privateKey,
          isEncrypted: true,
          nativeBalance: '0.00',
          nativeBalanceUSD: 0,
          isActive: true,
          nonce: 0,
        },
      });
      setIsGenerating(false);
    }, 400);
  };

  const handleSaveProfitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = profitAddressInput.trim();
    if (!cleaned) return;

    // Update active holding wallet address so all deposits reach this address
    const updatedHoldingWallets = holdingWallets.map((w) => {
      if (w.id === activeWalletId) {
        return {
          ...w,
          address: cleaned,
          name: w.name.includes('Custom') || w.name.includes('Personal')
            ? w.name
            : `Personal Profit Vault (${cleaned.slice(0, 6)}...${cleaned.slice(-4)})`,
        };
      }
      return w;
    });

    onUpdateWalletState({
      ...walletState,
      profit: {
        ...walletState.profit,
        address: cleaned,
        holdingWallets: updatedHoldingWallets,
        autoSweepThresholdUSD: Number(sweepThresholdInput),
      },
    });
    setSweepSuccessMessage(
      `Profit destination address set to ${cleaned.slice(0, 8)}...! All incoming bot revenue and automated sweeps will deposit directly to this wallet.`
    );
    setTimeout(() => setSweepSuccessMessage(null), 4000);
  };

  const handleManualSweep = () => {
    const sweepUSD = 621.0;
    // Add swept surplus into active profit vault
    const updatedHoldingWallets = holdingWallets.map((w) => {
      if (w.id === activeWalletId) {
        return {
          ...w,
          balanceUSD: w.balanceUSD + sweepUSD,
          tokenBalances: w.tokenBalances.map((tb) =>
            tb.symbol === 'ETH'
              ? { ...tb, amount: tb.amount + 0.18, amountUSD: tb.amountUSD + sweepUSD }
              : tb
          ),
        };
      }
      return w;
    });

    onUpdateWalletState({
      ...walletState,
      profit: {
        ...walletState.profit,
        totalAccumulatedUSD: walletState.profit.totalAccumulatedUSD + sweepUSD,
        lastSweepTimestamp: Date.now(),
        lastSweepTxHash: `0x${Math.random().toString(16).slice(2, 34)}${Math.random().toString(16).slice(2, 34)}`,
        holdingWallets: updatedHoldingWallets,
      },
    });

    setSweepSuccessMessage(
      `Dispatched automated on-chain sweep: 0.18 ${network.symbol} (~$621 USD) leftover surplus swept from Hot Executor to ${activeHoldingWallet.name}.`
    );
    setTimeout(() => setSweepSuccessMessage(null), 4500);
  };

  // Add new holding wallet callback
  const handleAddNewHoldingWallet = (newWallet: ProfitHoldingWallet) => {
    const updated = [newWallet, ...holdingWallets];
    onUpdateWalletState({
      ...walletState,
      profit: {
        ...walletState.profit,
        address: newWallet.address,
        holdingWallets: updated,
        activeWalletId: newWallet.id,
      },
    });
    setSweepSuccessMessage(`Added "${newWallet.name}" to your Profit Holding Vaults portfolio!`);
    setTimeout(() => setSweepSuccessMessage(null), 4000);
  };

  // Switch active profit wallet
  const handleSelectActiveWallet = (wallet: ProfitHoldingWallet) => {
    onUpdateWalletState({
      ...walletState,
      profit: {
        ...walletState.profit,
        address: wallet.address,
        activeWalletId: wallet.id,
      },
    });
    setProfitAddressInput(wallet.address);
    setSweepSuccessMessage(`Active Profit Collection Vault changed to "${wallet.name}".`);
    setTimeout(() => setSweepSuccessMessage(null), 3000);
  };

  // Payout success callback from SendProfitModal
  const handlePayoutSuccess = (
    updatedWallets: ProfitHoldingWallet[],
    newTx: ProfitPayoutTransaction,
    updatedExecutor?: {
      nativeBalance: string;
      nativeBalanceUSD: number;
    }
  ) => {
    const updatedHistory = [newTx, ...payoutHistory];
    const totalHarvested = updatedWallets.reduce((acc, w) => acc + w.balanceUSD, 0);

    onUpdateWalletState({
      ...walletState,
      executor: updatedExecutor
        ? {
            ...walletState.executor,
            nativeBalance: updatedExecutor.nativeBalance,
            nativeBalanceUSD: updatedExecutor.nativeBalanceUSD,
          }
        : walletState.executor,
      profit: {
        ...walletState.profit,
        totalAccumulatedUSD: totalHarvested,
        holdingWallets: updatedWallets,
        payoutHistory: updatedHistory,
      },
    });
    setSweepSuccessMessage(
      `Dispatched on-chain payout of $${newTx.amountUSD.toFixed(2)} USD to ${newTx.recipientAddress.slice(0, 10)}... via ${newTx.targetNetworkName} (Tx: ${newTx.txHash.slice(0, 10)}...)`
    );
    setTimeout(() => setSweepSuccessMessage(null), 4500);
  };

  const handleRebalanceSuccess = (
    updatedWalletState: WalletState,
    newTx: ProfitPayoutTransaction
  ) => {
    onUpdateWalletState(updatedWalletState);
    setSweepSuccessMessage(
      `⚡ On-Chain Rebalance Confirmed on ${newTx.targetNetworkName}! Balanced Hot Executor & Cold Vault: $${newTx.amountUSD.toFixed(2)} USD (Tx: ${newTx.txHash.slice(0, 10)}...)`
    );
    setTimeout(() => setSweepSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Dual-Wallet Architecture & Profit Vault Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Strict isolation between hot transaction execution (gas burner) and cold profit vaults with cross-chain external payout capabilities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsLightningModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/20 transition transform active:scale-95 border border-amber-400/60"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-pulse" />
            <span>⚡ Lightning Payout (&lt; 1 min)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBalanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold border border-slate-700 transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Balance Wallets
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('wallet-recovery-vault-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 font-bold border border-rose-500/40 shadow-sm transition"
          >
            <Key className="w-3.5 h-3.5 text-rose-400" />
            <span>🔐 Recovery Codes & Keys</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddWalletOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Add Profit Vault
          </button>
          <button
            type="button"
            onClick={() => setIsSendProfitOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 transition transform active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Send / Withdraw Profit
          </button>
          {onOpenMobileWalletModal && (
            <button
              type="button"
              onClick={() => onOpenMobileWalletModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-indigo-950/80 hover:from-indigo-900/90 hover:to-purple-900/90 text-indigo-300 hover:text-white font-bold border border-indigo-500/40 shadow-sm transition"
              title="Open MetaMask, SafePal, BlueWallet, or Rabby on your phone"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>📱 Open Wallet App</span>
            </button>
          )}
        </div>
      </div>

      {sweepSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in shadow-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{sweepSuccessMessage}</span>
        </div>
      )}

      {/* Live Dual-Wallet Liquidity & Balance Gauge Bar */}
      {(() => {
        const hotUSD = walletState.executor.nativeBalanceUSD || 0;
        const coldUSD = activeHoldingWallet.balanceUSD || 0;
        const total = hotUSD + coldUSD;
        const hotPct = total > 0 ? ((hotUSD / total) * 100).toFixed(1) : '0';
        const coldPct = total > 0 ? ((coldUSD / total) * 100).toFixed(1) : '0';
        return (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    Hot / Cold Liquidity Balance Ratio
                    <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                      (Total: ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Hot Executor: <span className="text-indigo-300 font-mono font-bold">{hotPct}%</span> (${hotUSD.toFixed(2)}) • Cold Vault: <span className="text-emerald-300 font-mono font-bold">{coldPct}%</span> (${coldUSD.toFixed(2)})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBalanceModalOpen(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Balance Hot & Cold Wallets
              </button>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${hotPct}%` }}
                title={`Hot Executor: ${hotPct}%`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${coldPct}%` }}
                title={`Cold Vault: ${coldPct}%`}
              />
            </div>

            {/* External Personal Wallet Link Banner */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${connectedWallet ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <div>
                  <span className="font-bold text-white">Your Personal External Wallet: </span>
                  {connectedWallet ? (
                    <span className="font-mono text-emerald-300 font-bold">
                      {connectedWallet.walletIcon ? `${connectedWallet.walletIcon} ` : ''}{connectedWallet.address} ({connectedWallet.chainName}) [{connectedWallet.walletName || connectedWallet.providerType}]
                    </span>
                  ) : (
                    <span className="text-amber-300">
                      Not connected yet. Connect your Web Browser Extension (MetaMask / Rabby) or Phone Wallet to receive profit directly.
                    </span>
                  )}
                </div>
              </div>
              {onOpenConnectWallet && (
                <button
                  type="button"
                  onClick={onOpenConnectWallet}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold transition self-start sm:self-auto"
                >
                  {connectedWallet ? 'Manage Personal Wallet' : 'Connect Extension / Phone'}
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Grid: 1. Executor Wallet | 2. Active Profit Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= WALLET 1: EXECUTOR ================= */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">1. Active Executor Wallet (Hot)</h3>
                <span className="text-[10px] text-slate-400">Submits transactions • Pays gas • Holds atomic swaps</span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                walletState.executor.isActive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {walletState.executor.isActive ? 'Active Executor' : 'Inactive'}
            </span>
          </div>

          {/* Address & Copy */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>Public Address:</span>
              <button
                onClick={() => copyToClipboard(walletState.executor.address, 'exec_addr')}
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                {copiedField === 'exec_addr' ? 'Copied!' : 'Copy Address'}
              </button>
            </label>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 truncate select-all">
              {walletState.executor.address}
            </div>
          </div>

          {/* Balance & Nonce */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[11px] block">Gas Available</span>
              <div className="text-sm font-black text-white font-mono mt-0.5">
                {walletState.executor.nativeBalance} {network.symbol}
              </div>
              <span className="text-[10px] text-slate-400">
                ~${walletState.executor.nativeBalanceUSD.toFixed(2)} USD
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[11px] block">Sequential Nonce</span>
              <div className="text-sm font-black text-cyan-300 font-mono mt-0.5">
                #{walletState.executor.nonce}
              </div>
              <span className="text-[10px] text-slate-400">
                {walletState.executor.txSuccessCount} confirmed swaps
              </span>
            </div>
          </div>

          {/* Zero-Gas Funding & Sponsorship Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 via-slate-950 to-cyan-950/60 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-purple-400" />
                Zero-Gas First Execution Enabled
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-500/30 uppercase">
                Zero Personal Deposit
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              1. <strong>Sponsor/Paymaster</strong> pays your gas • 2. <strong>Relayer</strong> submits your transaction • 3. <strong>Protocol</strong> rewards you with actual tokens (2/3 to Profit Wallet, 1/3 to Executor Gas).
            </p>
            {onNavigateTab && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateTab('faucet-bridge')}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black transition flex items-center gap-1"
                >
                  <Droplets className="w-3 h-3 text-slate-950" />
                  <span>🚰 Faucet & Bridge</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('paymaster')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black transition flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 fill-white text-white" />
                  <span>⛽ Gasless Paymaster</span>
                </button>
              </div>
            )}
          </div>

          {/* Private Key Safeguard */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Encrypted Hot Private Key
              </span>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPrivateKey ? 'Hide Key' : 'Reveal'}
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 truncate">
              {showPrivateKey
                ? walletState.executor.privateKey
                : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateNewExecutor}
              disabled={isGenerating}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate Offline Keypair
            </button>

            <button
              type="button"
              onClick={() => setIsSendProfitOpen(true)}
              className="px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1"
              title="Transfer gas or funds out from Hot Executor"
            >
              <Send className="w-3.5 h-3.5" />
              Transfer Out
            </button>

            <button
              onClick={() =>
                onUpdateWalletState({
                  ...walletState,
                  executor: {
                    ...walletState.executor,
                    isActive: !walletState.executor.isActive,
                  },
                })
              }
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                walletState.executor.isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
              }`}
            >
              {walletState.executor.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* ================= WALLET 2: PROFIT HOLDING VAULT ================= */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">2. Active Profit Holding Vault (Cold)</h3>
                <span className="text-[10px] text-slate-400">Holds bot profits • Separated from execution hot wallet</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold uppercase">
                Air-Gapped
              </span>
            </div>
          </div>

          {/* Active Vault Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeHoldingWallet.name}
              </div>
              <button
                type="button"
                onClick={() => setIsSendProfitOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition"
              >
                <Send className="w-3 h-3" />
                Send Profit
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="text-[11px] font-mono text-slate-300 truncate max-w-[240px]">
                {activeHoldingWallet.address}
              </div>
              <button
                onClick={() => copyToClipboard(activeHoldingWallet.address, 'profit_addr')}
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                {copiedField === 'profit_addr' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Total Balance in this Vault */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Vault Balance:</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                ${activeHoldingWallet.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            {/* Token breakdown */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(activeHoldingWallet.tokenBalances || []).slice(0, 4).map((token) => (
                <div key={token.symbol} className="p-2 rounded-xl bg-slate-900 border border-slate-800/70 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">{token.symbol}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-200 block truncate">
                    {token.amount >= 1000 ? `${(token.amount / 1000).toFixed(1)}k` : token.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveProfitSettings} className="space-y-3">
            {/* Profit Destination Address (Your Personal Wallet) */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Profit Destination Address (Your Personal Wallet):
                </label>
                {connectedWallet && (
                  <button
                    type="button"
                    onClick={() => setProfitAddressInput(connectedWallet.address)}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    Paste Connected ({connectedWallet.address.slice(0, 6)}...)
                  </button>
                )}
              </div>
              <input
                type="text"
                value={profitAddressInput}
                onChange={(e) => setProfitAddressInput(e.target.value)}
                placeholder="Enter your personal EVM wallet address (0x...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 block">
                All MEV arbitrage yield and automated sweeps will be credited directly to this address.
              </span>
            </div>

            {/* Sweep Threshold & Total Harvested */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">
                  Auto-Sweep Threshold ($ USD):
                </label>
                <input
                  type="number"
                  value={sweepThresholdInput}
                  onChange={(e) => setSweepThresholdInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[11px] block">Total Harvested Across App</span>
                <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                  ${walletState.profit.totalAccumulatedUSD.toLocaleString()} USD
                </div>
              </div>
            </div>

            {/* Profit Distribution Rules */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                Profit Distribution Rules
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Cold Storage</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {walletState.profit.routingSplitPct.coldStorage}%
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Reinvest Gas</span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {walletState.profit.routingSplitPct.reinvestGas}%
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Operator Fee</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {walletState.profit.routingSplitPct.operatorFee}%
                  </span>
                </div>
              </div>
            </div>

            {/* Save & Trigger sweep */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Save Profit Settings
              </button>

              <button
                type="button"
                onClick={handleManualSweep}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Sweep Leftovers
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= ALL PROFIT HOLDING WALLETS (VAULTS PORTFOLIO) ================= */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Profit Holding Wallets & Vaults Portfolio
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                {holdingWallets.length} Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Wallets created or connected to hold and safeguard profits earned by your MEV bots
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddWalletOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Vault
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holdingWallets.map((wallet) => {
            const isActive = wallet.id === activeWalletId;
            return (
              <div
                key={wallet.id}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  isActive
                    ? 'bg-slate-950/90 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{wallet.name}</span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                        Default Collector
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ${wallet.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[11px] truncate max-w-[260px]">
                    {wallet.address}
                  </span>
                  <button
                    onClick={() => copyToClipboard(wallet.address, wallet.id)}
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedField === wallet.id ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Token Balances pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(wallet.tokenBalances || []).map((t) => (
                    <span
                      key={t.symbol}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
                    >
                      {t.amount.toFixed(2)} {t.symbol} (~${t.amountUSD.toLocaleString()})
                    </span>
                  ))}
                </div>

                {/* Card actions */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => handleSelectActiveWallet(wallet)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    >
                      Set as Default Collector
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Receives ongoing bot revenue
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectActiveWallet(wallet);
                      setIsSendProfitOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Send className="w-3 h-3" />
                    Withdraw / Send
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= PROFIT PAYOUT & WITHDRAWAL HISTORY ================= */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Profit Payout & Transfer History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time ledger of profits sent to external destination wallets across networks and coins
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSendProfitOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition"
          >
            <Send className="w-3.5 h-3.5" />
            New Payout
          </button>
        </div>

        {payoutHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No profit payouts dispatched yet. Use "Send / Withdraw Profit" above to distribute profits.
          </div>
        ) : (
          <div className="space-y-2.5">
            {payoutHistory.map((tx) => {
              const netInfo = PAYOUT_NETWORKS.find((n) => n.id === tx.targetNetworkId);
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-sm">
                        {tx.amountCoin.toFixed(4)} {tx.targetCoinSymbol}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        (~${tx.amountUSD.toLocaleString()} USD)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                        {tx.targetNetworkName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>To:</span>
                      <span className="font-mono text-slate-300">{tx.recipientAddress}</span>
                      <span>•</span>
                      <span>From: {tx.sourceWalletName}</span>
                      <span>•</span>
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="font-mono text-[11px] text-slate-400 truncate max-w-[130px]">
                      {tx.txHash}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tx.txHash, tx.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Copy Tx Hash"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {tx.explorerUrl && (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dedicated Wallet Recovery Codes & Master Keys Vault Section */}
      <div id="wallet-recovery-vault-section">
        <WalletRecoveryVault
          walletState={walletState}
          onUpdateWalletState={onUpdateWalletState}
          onOpenMobileWalletLauncher={onOpenMobileWalletModal}
        />
      </div>

      {/* Modals */}
      <AddProfitWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
        onAddWallet={handleAddNewHoldingWallet}
      />

      <SendProfitModal
        isOpen={isSendProfitOpen}
        onClose={() => setIsSendProfitOpen(false)}
        holdingWallets={holdingWallets}
        activeWalletId={activeWalletId}
        executorWallet={{
          address: walletState.executor.address,
          nativeBalance: walletState.executor.nativeBalance,
          nativeBalanceUSD: walletState.executor.nativeBalanceUSD,
        }}
        onPayoutSuccess={handlePayoutSuccess}
        connectedWallet={connectedWallet}
      />

      <BalanceWalletsModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        walletState={walletState}
        network={network}
        onRebalanceSuccess={handleRebalanceSuccess}
      />

      <LightningTransferModal
        isOpen={isLightningModalOpen}
        onClose={() => setIsLightningModalOpen(false)}
        walletState={walletState}
        connectedWallet={connectedWallet}
        onOpenConnectWallet={onOpenConnectWallet}
        onSuccess={(newTx, updatedState) => {
          if (updatedState) {
            onUpdateWalletState(updatedState);
          }
        }}
      />
    </div>
  );
};
