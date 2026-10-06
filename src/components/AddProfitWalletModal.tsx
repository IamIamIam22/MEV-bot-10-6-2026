import React, { useState } from 'react';
import { Shield, Key, Plus, Copy, CheckCircle, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';
import { generateNewProfitVault, createCustomProfitVault } from '../services/profitPayout';
import { ProfitHoldingWallet } from '../types';

interface AddProfitWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWallet: (wallet: ProfitHoldingWallet) => void;
}

export const AddProfitWalletModal: React.FC<AddProfitWalletModalProps> = ({
  isOpen,
  onClose,
  onAddWallet,
}) => {
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [walletName, setWalletName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [initialUSD, setInitialUSD] = useState(0);
  const [generatedPreview, setGeneratedPreview] = useState<ProfitHoldingWallet | null>(null);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasBackedUp, setHasBackedUp] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartGenerate = () => {
    const fresh = generateNewProfitVault(
      walletName.trim() || 'Cold Storage Profit Vault',
      true,
      initialUSD
    );
    setGeneratedPreview(fresh);
  };

  const handleConfirmAdd = () => {
    if (mode === 'generate') {
      if (!generatedPreview) return;
      onAddWallet(generatedPreview);
    } else {
      if (!customAddress.trim()) return;
      const custom = createCustomProfitVault(
        walletName.trim() || 'External Hardware Vault',
        customAddress.trim(),
        initialUSD
      );
      onAddWallet(custom);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Add Profit Holding Wallet</h3>
              <p className="text-xs text-slate-400">
                Create a dedicated vault to accumulate and lock bot profits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setMode('generate');
                setGeneratedPreview(null);
              }}
              className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                mode === 'generate'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Generate Air-Gapped Keypair
            </button>
            <button
              onClick={() => {
                setMode('import');
                setGeneratedPreview(null);
              }}
              className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                mode === 'import'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Connect Custom Address
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Vault Nickname / Label:
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder={
                  mode === 'generate'
                    ? 'e.g. Treasury Cold Vault #2'
                    : 'e.g. Ledger Nano X Cold Stash'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            {mode === 'import' ? (
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Recipient Public Address (EVM or Cross-Chain):
                </label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : !generatedPreview ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartGenerate}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Generate Cryptographic Keypair & Seed
                </button>
              </div>
            ) : null}

            {/* If Generated Preview Available */}
            {mode === 'generate' && generatedPreview && (
              <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 animate-fade-in">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    New Vault Keypair Generated
                  </span>
                  <button
                    type="button"
                    onClick={handleStartGenerate}
                    className="text-cyan-400 hover:underline"
                  >
                    Regenerate
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Public Address:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedPreview.address, 'addr')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKey === 'addr' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 select-all truncate">
                    {generatedPreview.address}
                  </div>
                </div>

                {generatedPreview.mnemonic && (
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        12-Word Recovery Mnemonic:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSeed(!showSeed)}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showSeed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showSeed ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 select-all">
                      {showSeed
                        ? generatedPreview.mnemonic
                        : '•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••'}
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBackedUp}
                    onChange={(e) => setHasBackedUp(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>I have securely written down or backed up the recovery details.</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              mode === 'generate'
                ? !generatedPreview || !hasBackedUp
                : !customAddress.trim()
            }
            onClick={handleConfirmAdd}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Profit Vaults
          </button>
        </div>
      </div>
    </div>
  );
};
