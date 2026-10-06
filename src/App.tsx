import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_NETWORKS } from './services/networks';
import { DEFAULT_BOTS } from './services/botRegistry';
import {
  ArbitrageOpportunity,
  BlockchainNetwork,
  LiveBlockInfo,
  MEVBotConfig,
  OpportunityLifecycleItem,
  ProfitHoldingWallet,
  WalletState,
} from './types';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { LiveScannerView } from './components/LiveScannerView';
import { BotMatrixView } from './components/BotMatrixView';
import { SimulationPipelineView } from './components/SimulationPipelineView';
import { DualWalletView } from './components/DualWalletView';
import { LightningTransferView } from './components/LightningTransferView';
import { ContractStudioView } from './components/ContractStudioView';
import { RPCNetworkView } from './components/RPCNetworkView';
import { BitcoinPoolsBorrowView } from './components/BitcoinPoolsBorrowView';
import { ERC4337PaymasterView } from './components/ERC4337PaymasterView';
import { FaucetBridgeView } from './components/FaucetBridgeView';
import { PWAInstallModal } from './components/PWAInstallModal';
import { BalanceWalletsModal } from './components/BalanceWalletsModal';
import { LightningTransferModal } from './components/LightningTransferModal';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { MobileWalletModal } from './components/MobileWalletModal';
import {
  ConnectedWeb3Wallet,
  getSavedConnectedWallet,
  saveConnectedWallet,
} from './services/web3Wallet';
import {
  fetchLiveBlockInfo,
  generateRealTimeOpportunities,
  simulateMEVExecution,
} from './services/blockchain';
import {
  DEFAULT_PROFIT_WALLETS,
  DEFAULT_PAYOUT_HISTORY,
  DEFAULT_LIFECYCLE_ITEMS,
} from './services/profitPayout';
import { getOrInitPlatformWallets } from './services/platformWallets';
import { fetchTransactionsFromCloud } from './services/firebase';

export default function App() {
  const [networks] = useState<BlockchainNetwork[]>(DEFAULT_NETWORKS);
  const [activeNetwork, setActiveNetwork] = useState<BlockchainNetwork>(DEFAULT_NETWORKS[0]);
  const [activeTab, setActiveTab] = useState<TabId>('scanner');
  const [bots, setBots] = useState<MEVBotConfig[]>(DEFAULT_BOTS);

  const [walletState, setWalletState] = useState<WalletState>(() => {
    const pw = getOrInitPlatformWallets();
    return {
      executor: {
        address: pw.executor.address,
        privateKey: pw.executor.privateKey,
        mnemonic: pw.executor.mnemonic,
        derivationPath: pw.executor.derivationPath,
        isEncrypted: true,
        nativeBalance: pw.executor.balanceETH,
        nativeBalanceUSD: pw.executor.balanceUSD,
        gasReserved: '0.00 ETH',
        isActive: true,
        nonce: 0,
        txSuccessCount: 0,
      },
      profit: {
        address: pw.profitVault.address,
        totalAccumulatedUSD: pw.profitVault.balanceUSD,
        autoSweepThresholdUSD: 50,
        lastSweepTimestamp: pw.profitVault.createdAt,
        lastSweepTxHash: '',
        routingSplitPct: {
          coldStorage: 70,
          reinvestGas: 20,
          operatorFee: 10,
        },
        holdingWallets: [
          {
            id: pw.profitVault.id,
            name: pw.profitVault.name,
            address: pw.profitVault.address,
            privateKey: pw.profitVault.privateKey,
            mnemonic: pw.profitVault.mnemonic,
            derivationPath: pw.profitVault.derivationPath,
            isColdStorage: true,
            createdAt: pw.profitVault.createdAt,
            balanceUSD: pw.profitVault.balanceUSD,
            tokenBalances: pw.profitVault.tokenBalances,
          },
          ...pw.additionalWallets,
        ],
        activeWalletId: pw.profitVault.id,
        payoutHistory: DEFAULT_PAYOUT_HISTORY,
      },
    };
  });

  const [blockInfo, setBlockInfo] = useState<LiveBlockInfo>({
    number: 19842180,
    timestamp: Math.floor(Date.now() / 1000),
    gasBaseFeeGwei: 18.5,
    priorityFeeGwei: 1.5,
    gasLimit: 30000000,
    miner: '0xFlashbotsBuilder',
    txCount: 174,
  });

  const [rpcLatency, setRpcLatency] = useState<number>(32);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [lifecycleItems, setLifecycleItems] =
    useState<OpportunityLifecycleItem[]>(DEFAULT_LIFECYCLE_ITEMS);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeExecutionLog, setActiveExecutionLog] = useState<string[]>([]);

  // PWA Install Event Management
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isGlobalBalanceModalOpen, setIsGlobalBalanceModalOpen] = useState<boolean>(false);
  const [isGlobalLightningModalOpen, setIsGlobalLightningModalOpen] = useState<boolean>(false);

  // Mobile Wallet App Launcher State (MetaMask, SafePal, BlueWallet, Rabby)
  const [isMobileWalletModalOpen, setIsMobileWalletModalOpen] = useState<boolean>(false);
  const [mobileWalletDefaultId, setMobileWalletDefaultId] = useState<
    'metamask' | 'safepal' | 'bluewallet' | 'rabby'
  >('metamask');

  const handleOpenMobileWallet = (
    walletId?: 'metamask' | 'safepal' | 'bluewallet' | 'rabby'
  ) => {
    if (walletId) {
      setMobileWalletDefaultId(walletId);
    }
    setIsMobileWalletModalOpen(true);
  };

  // Web3 Linked / Connected Personal Wallet Management
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWeb3Wallet | null>(() =>
    getSavedConnectedWallet()
  );
  const [isConnectWalletOpen, setIsConnectWalletOpen] = useState<boolean>(false);
  const [directPayoutEnabled, setDirectPayoutEnabled] = useState<boolean>(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleTriggerInstall = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallPromptEvent(null);
      }
    }
  };

  // Refresh live block & opportunities
  const loadBlockchainData = useCallback(async () => {
    const start = Date.now();
    const info = await fetchLiveBlockInfo(activeNetwork);
    setRpcLatency(Date.now() - start);
    setBlockInfo(info);
    const opps = generateRealTimeOpportunities(activeNetwork, info.gasBaseFeeGwei);
    setOpportunities(opps);
  }, [activeNetwork]);

  useEffect(() => {
    loadBlockchainData();
    const interval = setInterval(loadBlockchainData, 12000);
    return () => clearInterval(interval);
  }, [loadBlockchainData]);

  // Bot configuration toggles
  const handleToggleBot = (id: string) => {
    setBots((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  const handleUpdateBotConfig = (id: string, minProfit: number, maxGas: number) => {
    setBots((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, minProfitThresholdUSD: minProfit, maxGasGwei: maxGas } : b
      )
    );
  };

  // Real-time execution runner
  const handleExecuteArbitrage = async (opportunity: ArbitrageOpportunity) => {
    setIsExecuting(true);
    setActiveExecutionLog([
      `[INIT] Triggering atomic execution for ${opportunity.tokenPair} (${opportunity.poolA.name} -> ${opportunity.poolB.name})`,
      `[WALLET] Executor Nonce: #${walletState.executor.nonce} locked`,
      `[SIMULATING] Running local EVM dry-run via eth_call...`,
    ]);

    const result = await simulateMEVExecution(opportunity, blockInfo.gasBaseFeeGwei);

    setTimeout(() => {
      setActiveExecutionLog(result.executionTrace);
      if (result.success) {
        // Update Bot & Wallet Metrics
        setBots((prev) =>
          prev.map((b) =>
            b.id === 'arbitrage'
              ? {
                  ...b,
                  totalExecuted: b.totalExecuted + 1,
                  profitCapturedUSD: b.profitCapturedUSD + result.netProfitUSD,
                }
              : b
          )
        );

        setWalletState((prev) => {
          const addedUSD = result.netProfitUSD;
          const updatedTotal = prev.profit.totalAccumulatedUSD + addedUSD;
          const currentHoldingWallets = prev.profit.holdingWallets || DEFAULT_PROFIT_WALLETS;
          const activeId = prev.profit.activeWalletId || currentHoldingWallets[0]?.id;

          const updatedWallets = currentHoldingWallets.map((w) => {
            if (w.id === activeId) {
              const newBalUSD = w.balanceUSD + addedUSD;
              const updatedTokens = (w.tokenBalances || []).map((tb) => {
                if (tb.symbol === 'USDC') {
                  const add = addedUSD * 0.5;
                  return { ...tb, amount: tb.amount + add, amountUSD: tb.amountUSD + add };
                }
                if (tb.symbol === 'ETH' || tb.symbol === 'WETH') {
                  const add = addedUSD * 0.35;
                  return { ...tb, amount: tb.amount + add / 3450, amountUSD: tb.amountUSD + add };
                }
                if (tb.symbol === 'USDT') {
                  const add = addedUSD * 0.15;
                  return { ...tb, amount: tb.amount + add, amountUSD: tb.amountUSD + add };
                }
                return tb;
              });
              return { ...w, balanceUSD: newBalUSD, tokenBalances: updatedTokens };
            }
            return w;
          });

          return {
            ...prev,
            executor: {
              ...prev.executor,
              nonce: prev.executor.nonce + 1,
              txSuccessCount: prev.executor.txSuccessCount + 1,
            },
            profit: {
              ...prev.profit,
              totalAccumulatedUSD: updatedTotal,
              holdingWallets: updatedWallets,
            },
          };
        });

        setOpportunities((prev) =>
          prev.map((o) => (o.id === opportunity.id ? { ...o, status: 'EXECUTED' } : o))
        );
      }
      setIsExecuting(false);
    }, 1000);
  };

  const handleDeployOpportunity = (item: OpportunityLifecycleItem) => {
    // Add to lifecycle tracker
    setLifecycleItems((prev) => [item, ...prev]);

    // Update opportunity status to DEPLOYED
    setOpportunities((prev) =>
      prev.map((o) => (o.id === item.opportunityId ? { ...o, status: 'DEPLOYED' } : o))
    );

    // Update Bot statistics
    setBots((prev) =>
      prev.map((b) =>
        b.id === 'arbitrage'
          ? {
              ...b,
              totalExecuted: b.totalExecuted + 1,
              profitCapturedUSD: b.profitCapturedUSD + item.netProfitUSD,
            }
          : b
      )
    );

    // Deposit profit directly into active profit holder wallet
    setWalletState((prev) => {
      const addedUSD = item.netProfitUSD;
      const updatedTotal = prev.profit.totalAccumulatedUSD + addedUSD;
      const currentHoldingWallets = prev.profit.holdingWallets || DEFAULT_PROFIT_WALLETS;
      const activeId = prev.profit.activeWalletId || currentHoldingWallets[0]?.id;

      const updatedWallets = currentHoldingWallets.map((w) => {
        if (w.id === activeId) {
          return {
            ...w,
            balanceUSD: item.profitHolderBalanceUSD,
            tokenBalances: item.profitHolderAvailableCoins,
          };
        }
        return w;
      });

      return {
        ...prev,
        executor: {
          ...prev.executor,
          nonce: prev.executor.nonce + 1,
          txSuccessCount: prev.executor.txSuccessCount + 1,
        },
        profit: {
          ...prev.profit,
          totalAccumulatedUSD: updatedTotal,
          holdingWallets: updatedWallets,
        },
      };
    });

    // Append logs to execution console
    setActiveExecutionLog((prev) => [
      `[DEPLOY SUCCESS] Confirmed on ${item.networkName} in Block #${item.blockNumber}`,
      `[DEPOSIT] Deposited +$${item.netProfitUSD.toFixed(2)} USD into ${item.profitHolderWalletName} (New Balance: $${item.profitHolderBalanceUSD.toFixed(2)})`,
      ...item.logs,
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 md:pb-8">
      {/* Top Header */}
      <Header
        networks={networks}
        activeNetwork={activeNetwork}
        onSelectNetwork={setActiveNetwork}
        blockInfo={blockInfo}
        walletState={walletState}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isInstallable={!!installPromptEvent}
        rpcLatency={rpcLatency}
        onOpenBalanceModal={() => setIsGlobalBalanceModalOpen(true)}
        onOpenLightningModal={() => setIsGlobalLightningModalOpen(true)}
        connectedWallet={connectedWallet}
        onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
        onOpenMobileWalletModal={handleOpenMobileWallet}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-5">
        {/* Navigation Bar */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* View Routing */}
        {activeTab === 'scanner' && (
          <LiveScannerView
            network={activeNetwork}
            blockInfo={blockInfo}
            bots={bots}
            opportunities={opportunities}
            walletState={walletState}
            lifecycleItems={lifecycleItems}
            onDeployOpportunity={handleDeployOpportunity}
            onRefreshOpportunities={loadBlockchainData}
            isExecuting={isExecuting}
            activeExecutionLog={activeExecutionLog}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
            onOpenLightningModal={() => setIsGlobalLightningModalOpen(true)}
            onOpenMobileWalletModal={handleOpenMobileWallet}
          />
        )}

        {activeTab === 'btc-pools' && (
          <BitcoinPoolsBorrowView
            walletState={walletState}
            onUpdateWalletState={setWalletState}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
          />
        )}

        {activeTab === 'paymaster' && (
          <ERC4337PaymasterView
            walletState={walletState}
            onUpdateWalletState={setWalletState}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
          />
        )}

        {activeTab === 'faucet-bridge' && (
          <FaucetBridgeView
            walletState={walletState}
            onUpdateWalletState={setWalletState}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
            onOpenContracts={() => setActiveTab('contracts')}
            onOpenPaymaster={() => setActiveTab('paymaster')}
          />
        )}

        {activeTab === 'bots' && (
          <BotMatrixView
            bots={bots}
            onToggleBot={handleToggleBot}
            onUpdateConfig={handleUpdateBotConfig}
            network={activeNetwork}
            blockInfo={blockInfo}
          />
        )}

        {activeTab === 'pipeline' && (
          <SimulationPipelineView
            network={activeNetwork}
            blockInfo={blockInfo}
            walletState={walletState}
            onDeployOpportunity={handleDeployOpportunity}
          />
        )}

        {activeTab === 'wallets' && (
          <DualWalletView
            walletState={walletState}
            onUpdateWalletState={setWalletState}
            network={activeNetwork}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
            onOpenMobileWalletModal={handleOpenMobileWallet}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'lightning' && (
          <LightningTransferView
            network={activeNetwork}
            blockInfo={blockInfo}
            walletState={walletState}
            onUpdateWalletState={setWalletState}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
            onOpenMobileWalletModal={handleOpenMobileWallet}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractStudioView
            network={activeNetwork}
            connectedWallet={connectedWallet}
            onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
          />
        )}

        {activeTab === 'rpc' && (
          <RPCNetworkView network={activeNetwork} blockInfo={blockInfo} />
        )}
      </main>

      {/* Android APK & PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={!!installPromptEvent}
        onInstallClick={handleTriggerInstall}
      />

      {/* Global Balance Cold & Hot Wallets Modal */}
      <BalanceWalletsModal
        isOpen={isGlobalBalanceModalOpen}
        onClose={() => setIsGlobalBalanceModalOpen(false)}
        walletState={walletState}
        network={activeNetwork}
        onRebalanceSuccess={(updatedState, newTx) => {
          setWalletState(updatedState);
          setActiveExecutionLog((prev) => [
            `[REBALANCE CONFIRMED] Settled on ${newTx.targetNetworkName} (Tx: ${newTx.txHash.slice(0, 10)}...)`,
            `[BALANCE SUCCESS] Rebalanced $${newTx.amountUSD.toFixed(2)} USD (${newTx.amountCoin.toFixed(4)} ${newTx.targetCoinSymbol})`,
            ...prev,
          ]);
        }}
      />

      {/* Web3 Connect Personal Wallet Modal */}
      <ConnectWalletModal
        isOpen={isConnectWalletOpen}
        onClose={() => setIsConnectWalletOpen(false)}
        connectedWallet={connectedWallet}
        onWalletUpdated={(wallet) => {
          setConnectedWallet(wallet);
          saveConnectedWallet(wallet);
        }}
        directPayoutEnabled={directPayoutEnabled}
        onToggleDirectPayout={setDirectPayoutEnabled}
        onOpenMobileWalletModal={handleOpenMobileWallet}
        onSetAsPrimaryProfitWallet={(addr) => {
          setWalletState((prev) => {
            const currentWallets = prev.profit.holdingWallets || DEFAULT_PROFIT_WALLETS;
            const existing = currentWallets.find(
              (w) => w.address.toLowerCase() === addr.toLowerCase()
            );
            let updatedWallets = currentWallets;
            let activeId = prev.profit.activeWalletId;
            if (existing) {
              activeId = existing.id;
            } else {
              const newWallet: ProfitHoldingWallet = {
                id: `vault-personal-${Date.now()}`,
                name: 'Personal Web3 Linked Wallet',
                address: addr,
                isColdStorage: false,
                createdAt: Date.now(),
                balanceUSD: 0,
                tokenBalances: [
                  { symbol: 'USDC', amount: 0, amountUSD: 0 },
                  { symbol: 'ETH', amount: 0, amountUSD: 0 },
                ],
              };
              updatedWallets = [newWallet, ...currentWallets];
              activeId = newWallet.id;
            }
            return {
              ...prev,
              profit: {
                ...prev.profit,
                address: addr,
                activeWalletId: activeId,
                holdingWallets: updatedWallets,
              },
            };
          });
        }}
      />
      {/* Global Lightning Payout Modal */}
      <LightningTransferModal
        isOpen={isGlobalLightningModalOpen}
        onClose={() => setIsGlobalLightningModalOpen(false)}
        walletState={walletState}
        connectedWallet={connectedWallet}
        onOpenConnectWallet={() => setIsConnectWalletOpen(true)}
        onOpenMobileWalletModal={handleOpenMobileWallet}
        onSuccess={(newTx, updatedState) => {
          if (updatedState) {
            setWalletState(updatedState);
          }
          setActiveExecutionLog((prev) => [
            `[LIGHTNING TRANSFER CONFIRMED] Settled on ${newTx.targetNetworkName} (Tx: ${newTx.txHash.slice(0, 10)}...)`,
            `[WALLET ARRIVAL] +$${newTx.amountUSD.toFixed(2)} USD successfully delivered to ${newTx.recipientAddress.slice(0, 8)}...`,
            ...prev,
          ]);
        }}
      />

      {/* Mobile Wallet Launcher & Phone Sync Modal */}
      <MobileWalletModal
        isOpen={isMobileWalletModalOpen}
        onClose={() => setIsMobileWalletModalOpen(false)}
        defaultWalletId={mobileWalletDefaultId}
        targetAddress={connectedWallet?.address || walletState.executor.address}
        onOpenRecoveryVault={() => {
          setActiveTab('wallets');
          setTimeout(() => {
            const el = document.getElementById('wallet-recovery-vault-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 350);
        }}
      />
    </div>
  );
}
