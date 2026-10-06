import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Zap,
  ArrowRightLeft,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  fetchUniswapSushiQuote,
  executeUniswapSushiArbitrageTx,
  DEX_ROUTER_ADDRESSES,
  MAINNET_TOKENS,
  ArbitrageSpreadResult,
  DEXQuote,
} from '../services/dexIntegration';
import { ConnectedWeb3Wallet } from '../services/web3Wallet';

interface UniswapSushiArbitragePanelProps {
  activeContractAddress: string;
  connectedWallet?: ConnectedWeb3Wallet | null;
  onOpenConnectWallet?: () => void;
  onArbitrageExecuted?: (txHash: string, profitUSD: number) => void;
}

export const UniswapSushiArbitragePanel: React.FC<UniswapSushiArbitragePanelProps> = ({
  activeContractAddress,
  connectedWallet,
  onOpenConnectWallet,
  onArbitrageExecuted,
}) => {
  const [selectedPair, setSelectedPair] = useState<'WETH_USDC' | 'WBTC_WETH' | 'LINK_WETH'>('WETH_USDC');
  const [inputAmount, setInputAmount] = useState<string>('2.5');
  const [loading, setLoading] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [uniQuote, setUniQuote] = useState<DEXQuote | null>(null);
  const [sushiQuote, setSushiQuote] = useState<DEXQuote | null>(null);
  const [spread, setSpread] = useState<ArbitrageSpreadResult | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQuotes = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let tokenIn: keyof typeof MAINNET_TOKENS = 'WETH';
      let tokenOut: keyof typeof MAINNET_TOKENS = 'USDC';

      if (selectedPair === 'WBTC_WETH') {
        tokenIn = 'WBTC';
        tokenOut = 'WETH';
      } else if (selectedPair === 'LINK_WETH') {
        tokenIn = 'LINK';
        tokenOut = 'WETH';
      }

      const res = await fetchUniswapSushiQuote(tokenIn, tokenOut, inputAmount);
      setUniQuote(res.uniswapQuote);
      setSushiQuote(res.sushiswapQuote);
      setSpread(res.spread);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch DEX quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
    const interval = setInterval(loadQuotes, 7000);
    return () => clearInterval(interval);
  }, [selectedPair, inputAmount]);

  const handleExecuteArbitrage = async () => {
    if (!spread) return;
    if (!connectedWallet) {
      if (onOpenConnectWallet) onOpenConnectWallet();
      return;
    }

    setExecuting(true);
    setErrorMessage(null);
    setTxSuccess(null);

    try {
      const res = await executeUniswapSushiArbitrageTx({
        spread,
        contractAddress: activeContractAddress,
        userAddress: connectedWallet.address,
      });

      setTxSuccess(
        `Atomic DEX Arbitrage confirmed on Mainnet! Block #${res.blockNumber} (Tx: ${res.txHash.slice(0, 10)}...)`
      );

      if (onArbitrageExecuted) {
        onArbitrageExecuted(res.txHash, spread.netProfitUSD);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-pink-500/20">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                Uniswap V2/V3 & SushiSwap Cross-DEX Arbitrage Terminal
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-950 text-pink-300 border border-pink-700/40 animate-pulse">
                Live Liquidity
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Atomic multi-hop trading between Uniswap and SushiSwap with slippage protection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Contract Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Active MEV Contract:</span>
            <span className="text-cyan-300 font-bold">
              {activeContractAddress.slice(0, 6)}...{activeContractAddress.slice(-4)}
            </span>
          </div>

          <button
            onClick={loadQuotes}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Quotes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar: Token Pair & Input Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Target Token Pair
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'WETH_USDC', label: 'WETH / USDC' },
              { id: 'WBTC_WETH', label: 'WBTC / WETH' },
              { id: 'LINK_WETH', label: 'LINK / WETH' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPair(p.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition text-center ${
                  selectedPair === p.id
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Trade Size (Input Amount)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs font-bold text-slate-400 shrink-0">
              {selectedPair === 'WBTC_WETH' ? 'WBTC' : selectedPair === 'LINK_WETH' ? 'LINK' : 'WETH'}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Estimated Net Yield
          </label>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Net Profit (After Gas):</span>
            <span
              className={`text-xs font-bold font-mono ${
                spread && spread.netProfitUSD > 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {spread ? `+$${spread.netProfitUSD.toFixed(2)} USD` : 'Calculating...'}
            </span>
          </div>
        </div>
      </div>

      {/* Live DEX Price Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Uniswap V2 Card */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-pink-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🦄</span>
              <span className="text-xs font-black text-pink-300">Uniswap V2 / V3</span>
            </div>
            <a
              href={`https://etherscan.io/address/${DEX_ROUTER_ADDRESSES.UNISWAP_V2_ROUTER}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-slate-400 hover:text-pink-300 flex items-center gap-1 font-mono transition"
            >
              Router02
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-slate-400">Effective Output:</span>
            <span className="text-sm font-black text-white font-mono">
              {uniQuote?.amountOutFormatted || '---'} {selectedPair.split('_')[1]}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <span>Rate:</span>
            <span className="font-mono text-slate-300">
              ${uniQuote?.pricePerToken.toFixed(2) || '0.00'} / token
            </span>
          </div>
        </div>

        {/* SushiSwap V2 Card */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🍣</span>
              <span className="text-xs font-black text-blue-300">SushiSwap V2</span>
            </div>
            <a
              href={`https://etherscan.io/address/${DEX_ROUTER_ADDRESSES.SUSHISWAP_V2_ROUTER}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-slate-400 hover:text-blue-300 flex items-center gap-1 font-mono transition"
            >
              Router02
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-slate-400">Effective Output:</span>
            <span className="text-sm font-black text-white font-mono">
              {sushiQuote?.amountOutFormatted || '---'} {selectedPair.split('_')[1]}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <span>Rate:</span>
            <span className="font-mono text-slate-300">
              ${sushiQuote?.pricePerToken.toFixed(2) || '0.00'} / token
            </span>
          </div>
        </div>
      </div>

      {/* Execution Route Banner & Action */}
      {spread && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Atomic Route:
              </span>
              <span className="text-xs font-bold text-cyan-300">
                {spread.buyDEX} (Buy) <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400" />{' '}
                {spread.sellDEX} (Sell)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              <span>Spread: <strong className="text-emerald-400 font-mono">+{spread.spreadPercent}%</strong></span>
              <span>•</span>
              <span>Gross: <strong className="text-white font-mono">${spread.grossProfitUSD.toFixed(2)}</strong></span>
              <span>•</span>
              <span>Gas Est: <strong className="text-slate-400 font-mono">${spread.estimatedGasUSD.toFixed(2)}</strong></span>
            </div>
          </div>

          <button
            onClick={handleExecuteArbitrage}
            disabled={executing}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg ${
              spread.profitable
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {executing
                ? 'Broadcasting to Mainnet...'
                : !connectedWallet
                ? 'Connect Wallet to Execute'
                : `Execute Arbitrage (+$${spread.netProfitUSD.toFixed(2)})`}
            </span>
          </button>
        </div>
      )}

      {/* Messages */}
      {txSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{txSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
