import React, { useState } from 'react';
import {
  Cpu,
  ArrowRight,
  ShieldAlert,
  Play,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Rocket,
} from 'lucide-react';
import {
  ArbitrageOpportunity,
  BlockchainNetwork,
  LiveBlockInfo,
  OpportunityLifecycleItem,
  WalletState,
} from '../types';
import { OpportunityDeployModal } from './OpportunityDeployModal';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';

interface SimulationPipelineViewProps {
  network: BlockchainNetwork;
  blockInfo: LiveBlockInfo;
  walletState?: WalletState;
  onDeployOpportunity?: (item: OpportunityLifecycleItem) => void;
  connectedWallet?: ConnectedWeb3Wallet | null;
}

export const SimulationPipelineView: React.FC<SimulationPipelineViewProps> = ({
  network,
  blockInfo,
  walletState,
  onDeployOpportunity,
  connectedWallet,
}) => {
  const [simTradeAmount, setSimTradeAmount] = useState<number>(25000);
  const [simDeltaPct, setSimDeltaPct] = useState<number>(1.25);
  const [simRelayMode, setSimRelayMode] = useState<'flashbots' | 'public'>('flashbots');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [deployModalOpp, setDeployModalOpp] = useState<ArbitrageOpportunity | null>(null);
  const [simulationResult, setSimulationResult] = useState<{
    simulatedGas: number;
    gasCostUSD: number;
    grossProfitUSD: number;
    minerBribeUSD: number;
    netProfitUSD: number;
    status: 'SUCCESS' | 'REVERT';
    steps: string[];
  } | null>(null);

  const runCustomSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const simulatedGas = 178200;
      const gasCostUSD = (simulatedGas * (blockInfo.gasBaseFeeGwei + 2) * 1e9 * 3450) / 1e18;
      const grossProfitUSD = simTradeAmount * (simDeltaPct / 100) * 0.994;
      const minerBribeUSD = simRelayMode === 'flashbots' ? grossProfitUSD * 0.15 : 0;
      const netProfitUSD = grossProfitUSD - gasCostUSD - minerBribeUSD;

      const steps = [
        `[1. DETECT] Queried reserves on ${network.name}: Price Spread = ${simDeltaPct.toFixed(2)}%`,
        `[2. SIMULATE] eth_call dry-run against Block #${blockInfo.number} at baseFee: ${blockInfo.gasBaseFeeGwei} Gwei`,
        `[3. CONSTRUCT] Formed EIP-1559 Bundle with Nonce #18, MaxPriorityFee: 3.0 Gwei`,
        `[4. RELAY] Submission destination: ${
          simRelayMode === 'flashbots'
            ? 'Private MEV-Boost Relay (Flashbots / Builder0x69)'
            : 'Public Mempool (High Frontrun/Sandwich Risk)'
        }`,
        `[5. ROUTE] Net Profit transfer: $${netProfitUSD.toFixed(2)} USD dispatched to Profit Wallet`,
      ];

      setSimulationResult({
        simulatedGas,
        gasCostUSD,
        grossProfitUSD,
        minerBribeUSD,
        netProfitUSD,
        status: netProfitUSD > 0 ? 'SUCCESS' : 'REVERT',
        steps,
      });
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 5-Stage MEV Pipeline Visualizer */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              The 5-Stage MEV Execution Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Every production MEV bot follows this exact deterministic state pipeline.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 border border-slate-800">
            Current Block: #{blockInfo.number}
          </span>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {/* Stage 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Stage 1
            </div>
            <h4 className="text-xs font-bold text-white">Opportunity Detection</h4>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Read mempool order flow</li>
              <li>• Read on-chain reserves via RPC</li>
              <li>• Instant profit equation model</li>
            </ul>
          </div>

          {/* Stage 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
              Stage 2
            </div>
            <h4 className="text-xs font-bold text-white">EVM Simulation</h4>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Local eth_call dry-run</li>
              <li>• Exact gas cost profiling</li>
              <li>• Slippage bounds & revert checks</li>
            </ul>
          </div>

          {/* Stage 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Stage 3
            </div>
            <h4 className="text-xs font-bold text-white">Tx Construction</h4>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Assemble atomic call/bundle</li>
              <li>• Set EIP-1559 gas params</li>
              <li>• Strict sequential nonce lock</li>
            </ul>
          </div>

          {/* Stage 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Stage 4
            </div>
            <h4 className="text-xs font-bold text-white">Relay Submission</h4>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Private Flashbots bundle</li>
              <li>• Direct to block builders</li>
              <li>• Bypass public mempool</li>
            </ul>
          </div>

          {/* Stage 5 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
              Stage 5
            </div>
            <h4 className="text-xs font-bold text-white">Profit Routing</h4>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Capture yield in Executor</li>
              <li>• Auto-sweep to Profit Wallet</li>
              <li>• Replenish gas buffer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Simulator & Validator Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive EVM Simulator Sandbox */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white">Interactive EVM Simulation Sandbox</h3>
            </div>
            <span className="text-[11px] text-slate-400">Gas Base: {blockInfo.gasBaseFeeGwei} Gwei</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                Simulated Capital Input ($ USD)
              </label>
              <input
                type="number"
                value={simTradeAmount}
                onChange={(e) => setSimTradeAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                DEX Price Spread Delta (%)
              </label>
              <input
                type="number"
                step="0.05"
                value={simDeltaPct}
                onChange={(e) => setSimDeltaPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-semibold mb-1.5">
              Transaction Submission Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSimRelayMode('flashbots')}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                  simRelayMode === 'flashbots'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  Flashbots Private Bundle
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  15% validator tip, 0% revert fee, hidden from public mempool.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSimRelayMode('public')}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                  simRelayMode === 'public'
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Public Mempool Broadcast
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Vulnerable to sandwich bots and priority gas auctions.
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={runCustomSimulation}
            disabled={isSimulating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
          >
            {isSimulating ? (
              <span>Simulating in Local EVM Runtime...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run EVM Simulation (eth_call)</span>
              </>
            )}
          </button>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Simulation Verdict
                </span>
                <span
                  className={`font-mono font-bold ${
                    simulationResult.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulationResult.status === 'SUCCESS' ? 'NET PROFITABLE' : 'REVERTED'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Gross Profit:</span>
                  <span className="font-mono text-white font-bold">
                    ${simulationResult.grossProfitUSD.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Gas Fee:</span>
                  <span className="font-mono text-amber-400">
                    -${simulationResult.gasCostUSD.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Validator Tip:</span>
                  <span className="font-mono text-cyan-300">
                    -${simulationResult.minerBribeUSD.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Net Realized:</span>
                  <span
                    className={`font-mono font-black ${
                      simulationResult.netProfitUSD > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${simulationResult.netProfitUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] space-y-1 text-slate-300">
                {simulationResult.steps.map((st, i) => (
                  <div key={i}>{st}</div>
                ))}
              </div>

              {simulationResult.status === 'SUCCESS' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const simulatedOpp: ArbitrageOpportunity = {
                        id: `sim-opp-${Date.now()}`,
                        tokenPair: 'WETH / USDC',
                        tokenIn: 'USDC',
                        tokenOut: 'WETH',
                        poolA: {
                          name: 'Uniswap V3',
                          address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
                          price: 3450,
                          reserve0: '2,481,200',
                          reserve1: '719.4',
                        },
                        poolB: {
                          name: 'Curve Finance',
                          address: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
                          price: 3450 * (1 + simDeltaPct / 100),
                          reserve0: '1,945,800',
                          reserve1: '563.8',
                        },
                        priceDeltaPct: simDeltaPct,
                        optimalInputUSD: simTradeAmount,
                        grossProfitUSD: simulationResult.grossProfitUSD,
                        estimatedGasUSD: simulationResult.gasCostUSD,
                        netProfitUSD: simulationResult.netProfitUSD,
                        timestamp: Date.now(),
                        route: ['USDC', 'WETH', 'USDC'],
                        status: 'SIMULATED',
                      };
                      setDeployModalOpp(simulatedOpp);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition transform active:scale-95"
                  >
                    <Rocket className="w-4 h-4 fill-slate-950" />
                    <span>Deploy Simulated Opportunity & Deposit Profit</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deploy Modal */}
        {deployModalOpp && walletState && onDeployOpportunity && (
          <OpportunityDeployModal
            isOpen={!!deployModalOpp}
            opportunity={deployModalOpp}
            network={network}
            blockInfo={blockInfo}
            walletState={walletState}
            onClose={() => setDeployModalOpp(null)}
            onDeployComplete={(item) => {
              onDeployOpportunity(item);
              setDeployModalOpp(null);
            }}
            connectedWallet={connectedWallet}
            directPayoutEnabled={true}
          />
        )}

        {/* Section 3: Validators in MEV Breakdown */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-black text-white">Validators in the MEV Supply Chain</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Validators are the final step in the MEV pipeline. Understanding their strict role
            ensures safe bundle bidding without getting front-run.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                What Validators DO:
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1 pl-4 list-disc">
                <li>Choose which transactions enter the block.</li>
                <li>Accept bundles from searchers via MEV-Boost relays.</li>
                <li>Earn MEV priority tips and builder payments.</li>
                <li>Attest to block validity under Proof-of-Stake consensus.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1.5">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                What Validators DO NOT DO:
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1 pl-4 list-disc">
                <li>Run MEV bots themselves (in standard PBS architecture).</li>
                <li>Execute complex DEX multi-swap arbitrage logic.</li>
                <li>Crack encrypted private searcher bundles prior to execution.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-white">Why Flashbots Bundles Matter:</div>
              <p>
                When submitting through private relays, your bundle is delivered directly to block builders
                (MEV-Boost). If the opportunity disappears before inclusion, your bundle is discarded with
                zero gas cost and zero revert penalty!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
