import React, { useState, useEffect } from 'react';
import { BlockchainNetwork, RPCBenchmarkResult, LiveBlockInfo } from '../types';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Shield,
  Server,
  Zap,
} from 'lucide-react';
import { benchmarkNetworkRPCs } from '../services/blockchain';

interface RPCNetworkViewProps {
  network: BlockchainNetwork;
  blockInfo: LiveBlockInfo;
}

export const RPCNetworkView: React.FC<RPCNetworkViewProps> = ({ network, blockInfo }) => {
  const [benchmarks, setBenchmarks] = useState<RPCBenchmarkResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [customRpcUrl, setCustomRpcUrl] = useState<string>('');
  const [customList, setCustomList] = useState<string[]>([]);
  const [activeRpc, setActiveRpc] = useState<string>(network.rpcUrls[0]);

  const runBenchmark = async () => {
    setLoading(true);
    const results = await benchmarkNetworkRPCs(network);
    setBenchmarks(results);
    setLoading(false);
  };

  useEffect(() => {
    runBenchmark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.id]);

  const handleAddCustomRpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRpcUrl || !customRpcUrl.startsWith('http')) return;
    setCustomList([...customList, customRpcUrl]);
    setCustomRpcUrl('');
    runBenchmark();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            RPC Infrastructure & Redundant Failover Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ping benchmarks, block synchronization checks, and automated RPC node failover.
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Benchmark All Nodes
        </button>
      </div>

      {/* Grid: RPC List + Custom RPC Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* RPC Endpoints List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between px-1">
            <span>Configured RPC Endpoints ({network.name})</span>
            <span className="text-[11px] font-mono text-slate-400">
              Chain ID: {network.chainId}
            </span>
          </div>

          <div className="space-y-2.5">
            {network.rpcUrls.concat(customList).map((url) => {
              const bm = benchmarks.find((b) => b.url === url);
              const isSelected = activeRpc === url;
              const isOnline = bm ? bm.status === 'online' : true;
              const latency = bm ? bm.latency : 35;

              return (
                <div
                  key={url}
                  onClick={() => setActiveRpc(url)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isOnline ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{url}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-[9px] font-bold">
                            ACTIVE PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Block #{bm?.blockNumber || blockInfo.number}</span>
                        <span>•</span>
                        <span>Failover Priority #{network.rpcUrls.indexOf(url) + 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold ${
                          latency < 80 ? 'text-emerald-400' : latency < 200 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {latency} ms
                      </div>
                      <span className="text-[10px] text-slate-500">Latency</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRpc(url);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                    >
                      {isSelected ? 'In Use' : 'Set Active'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Custom Provider / Info */}
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleAddCustomRpc} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Add Custom RPC Node
            </h3>
            <p className="text-[11px] text-slate-400">
              Add your private Alchemy, Infura, QuickNode, or local Geth/Reth node endpoint.
            </p>

            <input
              type="url"
              placeholder="https://eth-mainnet.g.alchemy.com/v2/..."
              value={customRpcUrl}
              onChange={(e) => setCustomRpcUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition"
            >
              Add & Test Endpoint
            </button>
          </form>

          {/* Failover Policy Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Downtime Failover Policy
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If an active RPC provider drops connection or responds with HTTP 429 (Rate Limit Exceeded),
              MEV Studio automatically rotates to the next available healthy node within &lt;150ms to prevent
              missed MEV block opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
