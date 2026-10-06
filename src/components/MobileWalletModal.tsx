import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  ExternalLink,
  Copy,
  CheckCircle,
  X,
  Zap,
  Shield,
  Download,
  Share2,
  Layers,
  ArrowRight,
  Info,
  CheckCheck,
  Flame,
  Radio,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import {
  SUPPORTED_MOBILE_WALLETS,
  MobileWalletApp,
  isMobileDevice,
  isIOS,
  isAndroid,
  getCurrentAppUrl,
  openWalletApp,
} from '../services/mobileWalletLauncher';

interface MobileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWalletId?: 'metamask' | 'safepal' | 'bluewallet' | 'rabby';
  defaultMode?: 'DAPP_BROWSER' | 'NATIVE_APP' | 'PAYMENT';
  targetAddress?: string;
  onOpenRecoveryVault?: () => void;
}

export const MobileWalletModal: React.FC<MobileWalletModalProps> = ({
  isOpen,
  onClose,
  defaultWalletId = 'metamask',
  defaultMode = 'DAPP_BROWSER',
  targetAddress,
  onOpenRecoveryVault,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(defaultWalletId);
  const [activeMode, setActiveMode] = useState<'DAPP_BROWSER' | 'NATIVE_APP' | 'PAYMENT'>(defaultMode);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);

  const selectedWallet =
    SUPPORTED_MOBILE_WALLETS.find((w) => w.id === selectedWalletId) ||
    SUPPORTED_MOBILE_WALLETS[0];

  const isMobile = isMobileDevice();
  const ios = isIOS();
  const android = isAndroid();
  const appUrl = getCurrentAppUrl();

  // Compute active deep link
  const getActiveDeepLink = () => {
    if (activeMode === 'PAYMENT' && targetAddress && selectedWallet.schemes.paymentLink) {
      return selectedWallet.schemes.paymentLink({ address: targetAddress });
    }
    if (activeMode === 'DAPP_BROWSER') {
      return selectedWallet.schemes.dappUniversalLink(appUrl);
    }
    return selectedWallet.schemes.dappUniversalLink(appUrl);
  };

  const activeDeepLink = getActiveDeepLink();

  // Generate QR Code
  useEffect(() => {
    if (!isOpen) return;

    // Generate high resolution QR code
    QRCode.toDataURL(activeDeepLink, {
      width: 280,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [activeDeepLink, isOpen]);

  if (!isOpen) return null;

  const handleLaunch = () => {
    setLaunchStatus(`Launching ${selectedWallet.name}...`);
    openWalletApp(
      selectedWallet,
      activeMode,
      targetAddress ? { address: targetAddress } : undefined
    );
    setTimeout(() => {
      setLaunchStatus(`Opened ${selectedWallet.name}. If app didn't open, install from store below.`);
      setTimeout(() => setLaunchStatus(null), 4000);
    }, 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeDeepLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto text-xs">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Open Mobile Wallet App
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  Phone Deep-Link & QR Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Instantly launch <strong className="text-orange-400">MetaMask</strong>,{' '}
                <strong className="text-blue-400">SafePal</strong>,{' '}
                <strong className="text-cyan-400">BlueWallet</strong>, or{' '}
                <strong className="text-purple-300">Rabby</strong> on your phone
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

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Status feedback */}
          {launchStatus && (
            <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
              <span>{launchStatus}</span>
            </div>
          )}

          {/* Device Detection Banner */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">
                Detected Device:{' '}
                <strong className="text-white">
                  {isMobile ? (ios ? '📱 Apple iOS (iPhone/iPad)' : '📱 Android Device') : '💻 Desktop / Laptop Workstation'}
                </strong>
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {isMobile ? '1-Tap Direct Launch' : 'Scan Phone QR or Click'}
            </span>
          </div>

          {/* Wallet Selector Tabs */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              1. Select Your Mobile Wallet App:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_MOBILE_WALLETS.slice(0, 4).map((wallet) => {
                const isSelected = wallet.id === selectedWallet.id;
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setSelectedWalletId(wallet.id)}
                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? `${wallet.accentBg} ${wallet.borderColor} ring-2 ring-indigo-500/30`
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">
                          {wallet.id === 'metamask' && '🦊'}
                          {wallet.id === 'safepal' && '🛡️'}
                          {wallet.id === 'bluewallet' && '⚡'}
                          {wallet.id === 'rabby' && '🐰'}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="font-black text-white text-xs">{wallet.name}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${wallet.textColor}`}>
                        {wallet.badge}
                      </div>
                    </div>

                    {wallet.supportsLightning && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40 self-start">
                        <Zap className="w-2.5 h-2.5" /> Lightning
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Secondary Wallets row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SUPPORTED_MOBILE_WALLETS.slice(4).map((wallet) => {
                const isSelected = wallet.id === selectedWallet.id;
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setSelectedWalletId(wallet.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? `${wallet.accentBg} ${wallet.borderColor} ring-2 ring-indigo-500/30`
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {wallet.id === 'trust' && '🛡️'}
                        {wallet.id === 'coinbase' && '🔵'}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs">{wallet.name}</div>
                        <div className="text-[10px] text-slate-400">{wallet.badge}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Mode Switcher */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              2. Choose How to Open on Your Phone:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveMode('DAPP_BROWSER')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  activeMode === 'DAPP_BROWSER'
                    ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    Open In {selectedWallet.name} dApp Browser
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 py-0.5 rounded font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Opens this MEV terminal inside {selectedWallet.name} so you can sign transactions and receive profits directly.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('NATIVE_APP')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  activeMode === 'NATIVE_APP'
                    ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">
                    Launch Native {selectedWallet.name} App
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Directly opens the wallet app on your phone to check balances and transaction history.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Box: Big Launch Button + QR Code */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code Canvas */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-2.5 bg-white rounded-2xl shadow-xl border border-slate-700 flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`${selectedWallet.name} QR Code`}
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">
                      Generating QR...
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-semibold flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                  Scan with Phone Camera or Wallet
                </span>
              </div>

              {/* Details & Direct Button */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">
                      {selectedWallet.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900 border ${selectedWallet.borderColor} ${selectedWallet.textColor}`}>
                      {selectedWallet.badge}
                    </span>
                  </div>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {selectedWallet.tagline}. Supported features:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedWallet.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Direct Launch Button */}
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-400 hover:via-purple-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-indigo-900/30 transition transform active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open {selectedWallet.name} App on My Phone</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                {/* Deep Link URL Copy */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-[10px] text-slate-400 truncate">
                    {activeDeepLink}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold flex items-center gap-1 text-[11px] shrink-0 transition"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* App Store / Google Play fallback badges */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Don't have {selectedWallet.name} installed yet?
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedWallet.storeLinks.ios}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <span>🍎 Apple App Store</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
                <a
                  href={selectedWallet.storeLinks.android}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <span>🤖 Google Play</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
                <a
                  href={selectedWallet.storeLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick link to Wallet Recovery Codes & Master Keys */}
          {onOpenRecoveryVault && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    Need Master Keys or Seed Phrase to Import?
                    <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded font-bold">
                      Recovery Vault
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    View 12-word recovery codes and raw private keys for MetaMask, SafePal, BlueWallet, and Rabby import.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecoveryVault();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 shrink-0 transition flex items-center gap-1"
              >
                <span>View Master Keys</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supported: MetaMask, SafePal, BlueWallet (Lightning), Rabby Wallet</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
