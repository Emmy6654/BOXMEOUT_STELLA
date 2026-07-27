"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isConnected, getPublicKey, setAllowed, getNetwork } from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";

// Freighter v2 API returns objects with optional error fields rather than throwing.
type ConnectedResult = { isConnected: boolean } | { error: string };
type AllowedResult = { isAllowed: boolean } | { error: string };
type PublicKeyResult = { publicKey: string } | { error: string };
type NetworkResult = { network: string; networkPassphrase: string } | { error: string };

const NETWORK_POLL_INTERVAL_MS = 3000;

interface WalletState {
  address: string | null;
  connected: boolean;
  walletNotInstalled: boolean;
  networkPassphrase: string | null;
}

const initialState: WalletState = {
  address: null,
  connected: false,
  walletNotInstalled: false,
  networkPassphrase: null,
};

// Module-level store shared by every useWallet() call site, so the connected
// wallet's address/network stays consistent across the navbar, the
// network-mismatch banner, and the mutation hooks without needing a Context
// provider wired through the whole tree.
let state: WalletState = { ...initialState };
const listeners = new Set<() => void>();

function setState(patch: Partial<WalletState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): WalletState {
  return state;
}

/** Test-only: resets the shared wallet store between test cases. */
export function __resetWalletStoreForTests(): void {
  state = { ...initialState };
}

async function refreshNetwork(): Promise<void> {
  try {
    const netResult: NetworkResult = await getNetwork();
    if ("error" in netResult) return;
    setState({ networkPassphrase: netResult.networkPassphrase });
  } catch {
    // Leave last-known network state in place; Freighter may be transiently unreachable.
  }
}

export interface UseWalletResult {
  address: string | null;
  isConnected: boolean;
  walletNotInstalled: boolean;
  networkPassphrase: string | null;
  isNetworkMismatched: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

export function useWallet(): UseWalletResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const connect = useCallback(async () => {
    try {
      const connResult: ConnectedResult = await isConnected();

      if ("error" in connResult) {
        setState({ walletNotInstalled: true });
        return;
      }

      if (!connResult.isConnected) {
        const allowResult: AllowedResult = await setAllowed();
        if ("error" in allowResult || !allowResult.isAllowed) {
          setState({ walletNotInstalled: true });
          return;
        }
      }

      // Check which network the wallet is on
      const netResult: NetworkResult = await getNetwork();
      if ("error" in netResult) {
        setWalletNotInstalled(true);
        return;
      }

      const detectedNetwork = netResult.network.toUpperCase();
      setNetworkName(detectedNetwork);

      if (detectedNetwork !== EXPECTED_NETWORK.toUpperCase()) {
        setIsWrongNetwork(true);
      } else {
        setIsWrongNetwork(false);
      }

      const pkResult: PublicKeyResult = await getPublicKey();
      if ("error" in pkResult) {
        setState({ walletNotInstalled: true });
        return;
      }

      setState({ address: pkResult.publicKey, connected: true, walletNotInstalled: false });
      await refreshNetwork();
    } catch {
      setState({ walletNotInstalled: true });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, connected: false, networkPassphrase: null });
  }, []);

  const signTransaction = useCallback(async (_xdr: string): Promise<string> => {
    throw new Error("signTransaction not implemented");
  }, []);

  // Wallets can switch network at any time from their own UI; poll while
  // connected so the mismatch banner/guards react without requiring a reconnect.
  useEffect(() => {
    if (!snapshot.connected) return;
    const interval = setInterval(refreshNetwork, NETWORK_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [snapshot.connected]);

  const isNetworkMismatched =
    snapshot.connected && snapshot.networkPassphrase !== null && snapshot.networkPassphrase !== NETWORK_PASSPHRASE;

  return {
    address: snapshot.address,
    isConnected: snapshot.connected,
    walletNotInstalled: snapshot.walletNotInstalled,
    networkPassphrase: snapshot.networkPassphrase,
    isNetworkMismatched,
    connect,
    disconnect,
    signTransaction,
  };
}
