import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle, Shield, Copy, X, Terminal, ExternalLink } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  onInstallClick: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  onInstallClick,
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'apk_source' | 'manifest'>('instant');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const capacitorConfig = `{
  "appId": "io.mevstudio.botengine",
  "appName": "MEV Bot Studio",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "url": "${typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-lhyd52scf6srrmto7qxlfv-113848550377.us-east1.run.app'}",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}`;

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="io.mevstudio.botengine">

    <!-- Blockchain RPC and Flashbots Relay connectivity -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="MEV Studio"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Install Android APK / Mobile App
              </h2>
              <p className="text-xs text-slate-400">
                Run MEV Bots, live RPC scanners & dual-wallet executor directly on your Android phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('instant')}
            className={`pb-2.5 text-xs font-semibold transition border-b-2 ${
              activeTab === 'instant'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Click Android WebAPK (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('apk_source')}
            className={`pb-2.5 text-xs font-semibold transition border-b-2 ${
              activeTab === 'apk_source'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Native APK Build (Capacitor / Android Studio)
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`pb-2.5 text-xs font-semibold transition border-b-2 ${
              activeTab === 'manifest'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manifest & Network Config
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-sm">
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-100 flex items-start gap-3">
                <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-cyan-300">Official Android WebAPK Packaging</p>
                  <p className="text-cyan-200/80">
                    Chrome on Android automatically compiles PWAs into genuine installed APK packages
                    with home screen icons, background worker access, and hardware crypto acceleration.
                  </p>
                </div>
              </div>

              {isInstallable ? (
                <div className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex flex-col items-center text-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-base text-white">Browser Ready to Install</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Tap the button below to prompt Android to install MEV Studio to your phone.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onInstallClick();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
                  >
                    <Download className="w-4 h-4" />
                    Install App on Android Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-400">
                    How to install on your Android device right now:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">1</span>
                      <span className="font-medium text-white text-xs">Open on Phone Chrome</span>
                      <span className="text-[11px] text-slate-400">Access this app URL in Google Chrome on your Android smartphone.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">2</span>
                      <span className="font-medium text-white text-xs">Tap Browser Menu</span>
                      <span className="text-[11px] text-slate-400">Tap the three dots (⋮) in the top right corner of Chrome.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">3</span>
                      <span className="font-medium text-white text-xs">Tap &ldquo;Install App&rdquo;</span>
                      <span className="text-[11px] text-slate-400">Select &ldquo;Install app&rdquo; or &ldquo;Add to Home Screen&rdquo; to generate the APK.</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Current App URL: <span className="text-slate-200 font-mono text-[11px]">{typeof window !== 'undefined' ? window.location.origin : ''}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.origin : '', 'url')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied === 'url' ? 'Copied URL!' : 'Copy Mobile Link'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'apk_source' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                To package a standalone unsigned/signed <code>.apk</code> file for direct sideloading or Google Play distribution, run this 2-step Capacitor flow:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Terminal Build Commands
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init "MEV Studio" "io.mevstudio.botengine"\nnpx cap add android\nnpx cap build android',
                        'commands'
                      )
                    }
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copied === 'commands' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="text-cyan-300 leading-relaxed overflow-x-auto text-[11px]">
{`# 1. Install Capacitor Native Runtime
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize project and add Android platform
npx cap init "MEV Studio" "io.mevstudio.botengine"
npx cap add android

# 3. Build signed APK via Gradle
npm run build
npx cap sync
npx cap build android`}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">capacitor.config.json</span>
                  <button
                    onClick={() => copyToClipboard(capacitorConfig, 'capconfig')}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copied === 'capconfig' ? 'Copied!' : 'Copy Config'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {capacitorConfig}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">AndroidManifest.xml (Blockchain & Background Services)</span>
                <button
                  onClick={() => copyToClipboard(androidManifest, 'manifest')}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copied === 'manifest' ? 'Copied!' : 'Copy XML'}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64">
                {androidManifest}
              </pre>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">Offline & Web Worker Capabilities</p>
                <p>
                  Service Worker handles local caching of ABI contracts and offline key derivation.
                  Real blockchain transactions are pushed directly through active JSON-RPC and Flashbots relay sockets.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Standalone Mode Active • Zero Native Telemetry
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
