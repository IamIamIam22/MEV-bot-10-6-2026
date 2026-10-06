import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface SavedContract {
  id: string;
  name: string;
  targetNetwork: string;
  address?: string;
  abi: string;
  bytecode: string;
  sourceCode: string;
  strategy: string;
  scrapedProfitUSD: number;
  txHash?: string;
  creatorAddress?: string;
  status: 'DEPLOYED' | 'SCRAPED' | 'READY';
  createdAt: number;
}

export interface SavedTransaction {
  id: string;
  txHash: string;
  networkName: string;
  chainId: number;
  from: string;
  to: string;
  valueETH: string;
  gasUsed: string;
  blockNumber?: number;
  profitUSD?: number;
  status: 'CONFIRMED' | 'FAILED';
  explorerUrl?: string;
  timestamp: number;
}

// Persist executed real transaction to Firestore
export async function persistTransactionToCloud(tx: SavedTransaction): Promise<void> {
  try {
    const txRef = doc(db, 'transactions', tx.id);
    await setDoc(txRef, tx, { merge: true });
  } catch (err) {
    console.warn('Could not persist transaction to Cloud Firestore (offline or fallback):', err);
  }
}

// Persist crafted or scraped contract to Firestore
export async function persistContractToCloud(contract: SavedContract): Promise<void> {
  try {
    const cRef = doc(db, 'contracts', contract.id);
    await setDoc(cRef, contract, { merge: true });
  } catch (err) {
    console.warn('Could not persist contract to Cloud Firestore (offline or fallback):', err);
  }
}

// Fetch all saved contracts from Firestore
export async function fetchContractsFromCloud(): Promise<SavedContract[]> {
  try {
    const q = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const contracts: SavedContract[] = [];
    snapshot.forEach((d) => {
      contracts.push(d.data() as SavedContract);
    });
    return contracts;
  } catch (err) {
    console.warn('Failed to load contracts from Firestore:', err);
    return [];
  }
}

// Fetch all saved transactions from Firestore
export async function fetchTransactionsFromCloud(): Promise<SavedTransaction[]> {
  try {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const txs: SavedTransaction[] = [];
    snapshot.forEach((d) => {
      txs.push(d.data() as SavedTransaction);
    });
    return txs;
  } catch (err) {
    console.warn('Failed to load transactions from Firestore:', err);
    return [];
  }
}
