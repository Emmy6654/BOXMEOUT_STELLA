"use client";

import { useState, useCallback } from "react";
import { isConnected, getPublicKey, setAllowed, getNetwork } from "@stellar/freighter-api";

// Freighter v2 API returns objects with optional error fields rather than throwing.
type ConnectedResult = { isConnected: boolean } | { error: string };
type AllowedResult = { isAllowed: boolean } | { error: string };
type PublicKeyResult = { publicKey: string } | { error: string };
type NetworkResult = { network: string; networkPassphrase: string } | { error: string };

// The network this app targets — change to "PUBLIC" for mainnet.
const EXPECTED_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET";

export interface UseWalletResult {
  address: string | null;
  isConnected: boolean;
  walletNotInstalled: boolean;
  /** True when the wallet is connected but on the wrong Stellar network */
  isWrongNetwork: boolean;
  /** Human-readable name of the network the wallet is currently on */
  networkName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

export function useWallet(): UseWalletResult {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [walletNotInstalled, setWalletNotInstalled] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [networkName, setNetworkName] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      const connResult: ConnectedResult = await isConnected();

      if ("error" in connResult) {
        setWalletNotInstalled(true);
        return;
      }

      if (!connResult.isConnected) {
        const allowResult: AllowedResult = await setAllowed();
        if ("error" in allowResult || !allowResult.isAllowed) {
          setWalletNotInstalled(true);
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
        setWalletNotInstalled(true);
        return;
      }

      setAddress(pkResult.publicKey);
      setConnected(true);
      setWalletNotInstalled(false);
    } catch {
      setWalletNotInstalled(true);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setIsWrongNetwork(false);
    setNetworkName(null);
  }, []);

  const signTransaction = useCallback(async (_xdr: string): Promise<string> => {
    throw new Error("signTransaction not implemented");
  }, []);

  return {
    address,
    isConnected: connected,
    walletNotInstalled,
    isWrongNetwork,
    networkName,
    connect,
    disconnect,
    signTransaction,
  };
}
