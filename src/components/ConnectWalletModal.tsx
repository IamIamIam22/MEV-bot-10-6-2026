import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Wallet,
  CheckCircle,
  ExternalLink,
  Copy,
  AlertCircle,
  X,
  Zap,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  LogOut,
  Info,
  Smartphone,
  Monitor,
  Key,
  QrCode,
  Download,
  Check,
  RefreshCw,
  Globe,
} from 'lucide-react';
import {
  ConnectedWeb3Wallet,
  requestWeb3WalletConnection,
  connectSpecificBrowserExtension,
  createWalletConnectPairingSession,
  linkManualExternalWallet,
  isEthereumAvailable,
  SUPPORTED_BROWSER_EXTENSIONS,
  BrowserWalletExtension,
} from '../services/web3Wallet';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: ConnectedWeb3Wallet | null;
  onWalletUpdated: (wallet: ConnectedWeb3Wallet | null) => void;
  directPayoutEnabled: boolean;
  onToggleDirectPayout: (enabled: boolean) => void;
  onSetAsPrimaryProfitWallet: (address: string) => void;
  onOpenMobileWalletModal?: (walletId?: 'metamask' | 'safepal' | 'bluewallet' | 'rabby') => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onWalletUpdated,
  directPayoutEnabled,
  onToggleDirectPayout,
  onSetAsPrimaryProfitWallet,
  onOpenMobileWalletModal,
}) => {
  const [activeTab, setActiveTab] = useState<'extension' | 'mobile' | 'manual'>('extension');
  const [manualAddress, setManualAddress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectingExtId, setConnectingExtId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedWcUri, setCopiedWcUri] = useState<boolean>(false);

  // WalletConnect pairing session state
  const [wcSession, setWcSession] = useState<{ uri: string; topic: string } | null>(null);
  const [wcQrCodeUrl, setWcQrCodeUrl] = useState<string>('');

  // Generate WalletConnect session when modal opens or mobile tab is chosen
  useEffect(() => {
    if (!isOpen) return;
    const session = createWalletConnectPairingSession();
    setWcSession(session);

    QRCode.toDataURL(session.uri, {
      width: 260,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    })
      .then((url) => setWcQrCodeUrl(url))
      .catch((err) => console.error('Error generating WalletConnect QR:', err));
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Connect via default injected provider
  const handleConnectDefaultInjected = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const wallet = await requestWeb3WalletConnection();
      onWalletUpdated(wallet);
      onSetAsPrimaryProfitWallet(wallet.address);
      setSuccessMsg(`Successfully connected ${wallet.address.slice(0, 8)}... (${wallet.chainName})!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect Web3 browser wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect to a specific browser extension (e.g. MetaMask, Rabby, Coinbase)
  const handleConnectExtension = async (ext: BrowserWalletExtension) => {
    setConnectingExtId(ext.id);
    setErrorMsg(null);
    try {
      const wallet = await connectSpecificBrowserExtension(ext.id);
      onWalletUpdated(wallet);
      onSetAsPrimaryProfitWallet(wallet.address);
      setSuccessMsg(`Successfully connected ${ext.name} (${wallet.address.slice(0, 8)}...)!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to connect ${ext.name}.`);
    } finally {
      setConnectingExtId(null);
    }
  };

  // Link manual cold storage address
  const handleLinkManual = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const wallet = linkManualExternalWallet(manualAddress);
      onWalletUpdated(wallet);
      onSetAsPrimaryProfitWallet(wallet.address);
      setSuccessMsg(`Successfully linked personal address ${wallet.address.slice(0, 8)}...!`);
      setManualAddress('');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid wallet address.');
    }
  };

  const handleDisconnect = () => {
    onWalletUpdated(null);
    setSuccessMsg('Disconnected wallet.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleCopyWcUri = () => {
    if (!wcSession?.uri) return;
    navigator.clipboard.writeText(wcSession.uri);
    setCopiedWcUri(true);
    setTimeout(() => setCopiedWcUri(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Connect Web3 Wallet
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  Web Extension & Phone
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connect via desktop browser extension (MetaMask / Rabby) or scan with your phone wallet
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

        {/* Navigation Tabs (Extension vs Phone vs Manual) */}
        {!connectedWallet && (
          <div className="px-5 pt-4 pb-1 border-b border-slate-800/80 bg-slate-900/50">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('extension')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'extension'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>🖥️ Web Extension</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'mobile'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📱 Phone & QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'manual'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>🔑 Manual Address</span>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 flex items-center gap-2 animate-fade-in shadow-md">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center gap-2 animate-fade-in shadow-md">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Currently Connected Wallet State */}
          {connectedWallet ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/50 ring-1 ring-emerald-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-black text-white text-xs">
                    {connectedWallet.walletName || 'Connected Personal Wallet'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                    {connectedWallet.chainName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/40">
                    {connectedWallet.providerType}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-bold"
                >
                  <LogOut className="w-3 h-3" />
                  Disconnect
                </button>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 truncate">
                  <div className="font-mono text-emerald-300 font-bold text-xs truncate">
                    {connectedWallet.address}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Balance: <strong className="text-white">{connectedWallet.balanceETH} ETH</strong>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(connectedWallet.address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white flex items-center gap-1 text-[11px] transition ml-2 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Direct Payout Toggle */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Direct Payout to this Wallet:</span>
                  <span className="text-[10px] text-slate-400">
                    Automatically route all 2/3 MEV bot profits directly into this address
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDirectPayout(!directPayoutEnabled)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                    directPayoutEnabled
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {directPayoutEnabled ? '✅ ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Mobile Phone Launcher for connected wallet */}
              {onOpenMobileWalletModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMobileWalletModal('metamask');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Open This Wallet in Phone App (MetaMask / SafePal / BlueWallet / Rabby)</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: WEB BROWSER EXTENSIONS */}
              {activeTab === 'extension' && (
                <div className="space-y-3.5">
                  {/* Quick Connect Default Injected Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-950 to-blue-950/60 border border-cyan-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-xs flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        Instant Browser Web3 Provider Connect
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono font-semibold">
                        {isEthereumAvailable() ? '🟢 Browser Provider Active' : '⚪ Searching Extensions'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Connect to your active browser extension to sign real mainnet transactions and receive profits directly into your personal address.
                    </p>
                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={handleConnectDefaultInjected}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-950/30 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Requesting Connection in Browser...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Connect Injected Browser Wallet Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Browser Extension Grid */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Supported Browser Extensions</span>
                      <span className="text-[10px] text-slate-400 font-normal">Click to connect or install</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SUPPORTED_BROWSER_EXTENSIONS.filter((e) => e.id !== 'injected').map((ext) => {
                        const detected = ext.isDetected();
                        const isConnectingThis = connectingExtId === ext.id;

                        return (
                          <div
                            key={ext.id}
                            className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                              detected
                                ? 'bg-slate-950/80 border-cyan-500/60 ring-1 ring-cyan-500/20'
                                : 'bg-slate-950/50 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{ext.icon}</span>
                                <div>
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span>{ext.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 line-clamp-1">{ext.tagline}</div>
                                </div>
                              </div>

                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                  detected
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                                }`}
                              >
                                {detected ? 'DETECTED' : 'NOT DETECTED'}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              {detected ? (
                                <button
                                  type="button"
                                  disabled={isConnectingThis}
                                  onClick={() => handleConnectExtension(ext)}
                                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {isConnectingThis ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Connecting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Connect {ext.shortName}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              ) : (
                                <a
                                  href={ext.storeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[11px] transition flex items-center justify-center gap-1 text-center"
                                >
                                  <Download className="w-3 h-3 text-cyan-400" />
                                  <span>Install Extension</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHONE & WALLETCONNECT QR CODE */}
              {activeTab === 'mobile' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-purple-950/40 border border-indigo-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-indigo-400" />
                        <span className="font-black text-white text-xs">
                          WalletConnect Standard QR Code (Scan with Phone)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                        v2.0 Universal Relay
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Open your phone wallet app (MetaMask, Trust Wallet, SafePal, Rainbow, or Rabby) and tap <strong>Scan QR Code</strong> to link this browser session:
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      {wcQrCodeUrl ? (
                        <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                          <img
                            src={wcQrCodeUrl}
                            alt="WalletConnect QR Code"
                            className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-44 h-44 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                          Generating QR...
                        </div>
                      )}

                      <div className="space-y-2.5 text-left w-full sm:w-auto flex-1">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Instant Phone Pairing</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          1. Open your phone camera or wallet app.<br />
                          2. Scan the QR code.<br />
                          3. Approve the connection request.
                        </p>

                        <button
                          type="button"
                          onClick={handleCopyWcUri}
                          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedWcUri ? 'Copied WalletConnect URI!' : 'Copy Pairing Code'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Launch Mobile App Links */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Or Open Directly in Your Phone Wallet App
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'metamask', name: 'MetaMask', icon: '🦊', desc: 'Mobile dApp' },
                        { id: 'safepal', name: 'SafePal', icon: '🛡️', desc: 'Mobile App' },
                        { id: 'bluewallet', name: 'BlueWallet', icon: '⚡', desc: 'Lightning BTC' },
                        { id: 'rabby', name: 'Rabby', icon: '🐰', desc: 'Rabbit Web3' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onOpenMobileWalletModal) {
                              onOpenMobileWalletModal(w.id as any);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-400 text-left transition flex flex-col justify-between group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{w.icon}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 transition" />
                          </div>
                          <div className="mt-1">
                            <div className="font-black text-white text-xs">{w.name}</div>
                            <div className="text-[9px] text-indigo-300 font-medium">{w.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MANUAL HARDWARE / COLD STORAGE */}
              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Ledger, Trezor & Air-Gapped Cold Wallets</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If your primary funds or profit destination is on a hardware wallet or exchange, you can link the public EVM address below. Profits will be automatically deposited directly into that address.
                    </p>
                  </div>

                  <form onSubmit={handleLinkManual} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-300 block">
                      Enter EVM Public Address (0x...)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="0x71C... or your hardware wallet address"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={!manualAddress.trim()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-black text-xs transition"
                      >
                        Link Address
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <span className="text-[11px] text-slate-500 font-mono">
            {connectedWallet ? '● Wallet Linked & Live' : '○ Extension & Mobile Connector Ready'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
