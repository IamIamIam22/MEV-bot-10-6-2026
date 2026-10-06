import React from 'react';
import {
  Radar,
  Sliders,
  Cpu,
  Wallet,
  Zap,
  FileCode2,
  Server,
  Coins,
  Fuel,
  Droplets,
} from 'lucide-react';

export type TabId = 'scanner' | 'btc-pools' | 'paymaster' | 'faucet-bridge' | 'bots' | 'pipeline' | 'wallets' | 'lightning' | 'contracts' | 'rpc';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'scanner', label: 'DEX Scanner', icon: Radar },
    { id: 'btc-pools', label: '₿ Bitcoin Pools', icon: Coins },
    { id: 'paymaster', label: '⛽ Gasless Paymaster', icon: Fuel },
    { id: 'faucet-bridge', label: '🚰 Faucet & Bridge', icon: Droplets },
    { id: 'bots', label: '10 MEV Bots', icon: Sliders },
    { id: 'pipeline', label: 'EVM Pipeline', icon: Cpu },
    { id: 'wallets', label: 'Dual Wallets', icon: Wallet },
    { id: 'lightning', label: '⚡ Lightning Payout', icon: Zap },
    { id: 'contracts', label: 'Smart Contracts', icon: FileCode2 },
    { id: 'rpc', label: 'RPC & Failover', icon: Server },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Navigation Bar */}
      <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation Bar (Android Phone native feel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabId)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
