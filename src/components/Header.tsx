import React from 'react';
import { BlockchainNetwork, LiveBlockInfo, WalletState } from '../types';
import {
  Layers,
  Fuel,
  Activity,
  Download,
  ShieldCheck,
  ChevronDown,
  Circle,
  Zap,
  Wallet,
  Smartphone,
} from 'lucide-react';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';

interface HeaderProps {
  networks: BlockchainNetwork[];
  activeNetwork: BlockchainNetwork;
  onSelectNetwork: (network: BlockchainNetwork) => void;
  blockInfo: LiveBlockInfo;
  walletState: WalletState;
  onOpenInstallModal: () => void;
  isInstallable: boolean;
  rpcLatency: number;
  onOpenBalanceModal?: () => void;
  onOpenLightningModal?: () => void;
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
  onOpenMobileWalletModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  networks,
  activeNetwork,
  onSelectNetwork,
  blockInfo,
  walletState,
  onOpenInstallModal,
  isInstallable,
  rpcLatency,
  onOpenBalanceModal,
  onOpenLightningModal,
  connectedWallet,
  onOpenConnectWallet,
  onOpenMobileWalletModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 fill-yellow-300" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black tracking-tight text-white">
                MEV<span className="text-cyan-400">STUDIO</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                PRO ENGINE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Multi-DEX Flash Arbitrage & Private Relay Executor
            </p>
          </div>
        </div>

        {/* Live Blockchain Telemetry */}
        <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          {/* Block Number */}
          <div className="flex items-center gap-1.5" title="Latest On-Chain Block Number">
            <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[11px]">Block</span>
            <span className="font-mono font-bold text-slate-100">
              #{blockInfo.number.toLocaleString()}
            </span>
          </div>

          <div className="w-px h-3.5 bg-slate-800" />

          {/* Gas Price */}
          <div className="flex items-center gap-1.5" title="Current Base Gas Fee">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px]">Base Fee</span>
            <span className="font-mono font-bold text-amber-300">
              {blockInfo.gasBaseFeeGwei} Gwei
            </span>
          </div>

          <div className="w-px h-3.5 bg-slate-800" />

          {/* RPC Latency */}
          <div className="flex items-center gap-1.5" title="Direct Node Response Time">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-cyan-300 text-[11px]">
              {rpcLatency > 0 ? `${rpcLatency}ms` : '<45ms'}
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Switcher Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:border-slate-700 cursor-pointer transition">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[90px] sm:max-w-none">{activeNetwork.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 hidden group-hover:block z-50 animate-fade-in">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Select Blockchain Network
              </div>
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => onSelectNetwork(net)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                    activeNetwork.id === net.id
                      ? 'bg-cyan-950/60 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{net.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{net.symbol}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Executor Status pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">Executor</span>
            <span className="font-mono text-slate-200 text-[11px]">
              {walletState.executor.address.slice(0, 5)}...{walletState.executor.address.slice(-3)}
            </span>
          </div>

          {/* Profit Vault Balance badge */}
          <div
            onClick={onOpenBalanceModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-emerald-500/50 transition"
            title="Click to view & balance Profit Vault"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[11px]">Vault:</span>
            <span className="font-mono text-emerald-400 font-bold text-[11px]">
              ${walletState.profit.totalAccumulatedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Quick Balance Button */}
          {onOpenBalanceModal && (
            <button
              onClick={onOpenBalanceModal}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition shadow-sm"
              title="Balance Cold & Hot Wallets on Fastest Network"
            >
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span>Balance</span>
            </button>
          )}

          {/* Instant Lightning Payout Button */}
          {onOpenLightningModal && (
            <button
              onClick={onOpenLightningModal}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-400/50 text-xs font-black transition shadow-sm shadow-amber-500/10"
              title="⚡ Lightning Transfer: Real On-Chain Payout Arriving in Your Wallet in Under 1 Minute"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 animate-pulse text-amber-300" />
              <span className="hidden sm:inline">⚡ Lightning</span>
              <span className="sm:hidden">⚡ Fast</span>
            </button>
          )}

          {/* Open Mobile Wallet App (MetaMask / SafePal / BlueWallet / Rabby) */}
          {onOpenMobileWalletModal && (
            <button
              onClick={() => onOpenMobileWalletModal()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-indigo-950/80 hover:from-indigo-900/90 hover:to-purple-900/90 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition shadow-sm cursor-pointer"
              title="📱 Open Mobile Wallet App: MetaMask, SafePal, BlueWallet, Rabby"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden lg:inline">📱 Open Wallet App</span>
              <span className="lg:hidden">📱 Phone</span>
            </button>
          )}

          {/* Web3 Wallet Connect Button */}
          {onOpenConnectWallet && (
            <button
              onClick={onOpenConnectWallet}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                connectedWallet
                  ? 'bg-slate-900 border border-emerald-500/50 text-white hover:border-emerald-400'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
              title={
                connectedWallet
                  ? `Connected: ${connectedWallet.address} (${connectedWallet.chainName}) [${connectedWallet.walletName || connectedWallet.providerType}]`
                  : 'Connect Web Browser Extension (MetaMask / Rabby / Coinbase) or Phone Wallet'
              }
            >
              <Wallet className={`w-3.5 h-3.5 ${connectedWallet ? 'text-emerald-400' : 'text-white'}`} />
              <span className="hidden sm:inline">
                {connectedWallet
                  ? `${connectedWallet.walletIcon ? connectedWallet.walletIcon + ' ' : ''}${connectedWallet.address.slice(0, 6)}...${connectedWallet.address.slice(-4)}`
                  : 'Connect Extension / Wallet'}
              </span>
              <span className="sm:hidden">
                {connectedWallet ? `${connectedWallet.address.slice(0, 4)}...` : 'Connect'}
              </span>
              {connectedWallet && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          )}

          {/* Android APK / Install Button */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/30 transition transform active:scale-95"
            title="Install Mobile App / Android APK"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstallable ? 'Install APK' : 'Get Mobile App'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
