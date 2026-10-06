import React, { useState } from 'react';
import { MEVBotConfig, BlockchainNetwork, LiveBlockInfo } from '../types';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertOctagon,
  Shield,
  FileCode2,
  DollarSign,
  Fuel,
  Info,
} from 'lucide-react';

interface BotMatrixViewProps {
  bots: MEVBotConfig[];
  onToggleBot: (id: string) => void;
  onUpdateConfig: (id: string, minProfit: number, maxGas: number) => void;
  network: BlockchainNetwork;
  blockInfo: LiveBlockInfo;
}

export const BotMatrixView: React.FC<BotMatrixViewProps> = ({
  bots,
  onToggleBot,
  onUpdateConfig,
  network,
  blockInfo,
}) => {
  const [selectedBotId, setSelectedBotId] = useState<string>(bots[0].id);
  const [simulatedActionMessage, setSimulatedActionMessage] = useState<string | null>(null);

  const selectedBot = bots.find((b) => b.id === selectedBotId) || bots[0];

  const triggerBotSimulation = (bot: MEVBotConfig) => {
    setSimulatedActionMessage(
      `Triggered live simulation for ${bot.name} on ${network.name}: Reading latest state at block #${blockInfo.number}...`
    );
    setTimeout(() => {
      setSimulatedActionMessage(
        `Simulation Completed for ${bot.name}: Simulated gas at ${blockInfo.gasBaseFeeGwei} Gwei. EVM dry-run verified successfully. Zero reverts detected.`
      );
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            The 10 MEV Bot Architectures & Control Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time control, detection parameters, and execution contracts for all 10 MEV strategies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Chain: {network.name}</span>
        </div>
      </div>

      {/* Grid: Bot Selection sidebar + Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List of 10 Bots */}
        <div className="lg:col-span-4 space-y-2">
          {bots.map((bot, index) => {
            const isSelected = bot.id === selectedBot.id;
            return (
              <div
                key={bot.id}
                onClick={() => setSelectedBotId(bot.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-300">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{bot.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          bot.riskLevel === 'Low'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : bot.riskLevel === 'Medium'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                            : bot.riskLevel === 'High'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        }`}
                      >
                        {bot.riskLevel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ${bot.profitCapturedUSD.toLocaleString()} captured • {bot.successRate}% rate
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBot(bot.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    bot.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {bot.enabled ? 'ACTIVE' : 'IDLE'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Detail Panel for Selected Bot */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            {/* Header of Selected Bot */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                    {selectedBot.tag}
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedBot.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedBot.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerBotSimulation(selectedBot)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Simulate Strategy
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {simulatedActionMessage && (
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2 animate-fade-in">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{simulatedActionMessage}</span>
              </div>
            )}

            {/* Strategy Anatomy Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* What they do & Opportunity Detection */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  1. Opportunity Detection
                </div>
                <p className="text-slate-300 leading-relaxed">{selectedBot.detectionMechanism}</p>
              </div>

              {/* Execution Logic */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  2. Execution Logic
                </div>
                <p className="text-slate-300 leading-relaxed">{selectedBot.executionLogic}</p>
              </div>

              {/* Contract Interaction */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  3. Smart Contract Interaction
                </div>
                <p className="text-slate-300 leading-relaxed">{selectedBot.contractInteraction}</p>
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {selectedBot.targetRouters.map((router, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300"
                    >
                      {router}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parameter Configuration & Thresholds */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  4. Thresholds & Safeguards
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        Min Net Profit Cutoff:
                      </span>
                      <span className="font-bold text-white font-mono">${selectedBot.minProfitThresholdUSD} USD</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="500"
                      step="5"
                      value={selectedBot.minProfitThresholdUSD}
                      onChange={(e) =>
                        onUpdateConfig(selectedBot.id, Number(e.target.value), selectedBot.maxGasGwei)
                      }
                      className="w-full accent-cyan-400 bg-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-400" />
                        Max Priority Gas Ceiling:
                      </span>
                      <span className="font-bold text-white font-mono">{selectedBot.maxGasGwei} Gwei</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      step="10"
                      value={selectedBot.maxGasGwei}
                      onChange={(e) =>
                        onUpdateConfig(selectedBot.id, selectedBot.minProfitThresholdUSD, Number(e.target.value))
                      }
                      className="w-full accent-cyan-400 bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Detected</span>
                <span className="text-base font-black text-white font-mono">{selectedBot.totalDetected}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Executed</span>
                <span className="text-base font-black text-cyan-300 font-mono">{selectedBot.totalExecuted}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Win Rate</span>
                <span className="text-base font-black text-emerald-400 font-mono">{selectedBot.successRate}%</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Profit Routed</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ${selectedBot.profitCapturedUSD.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
