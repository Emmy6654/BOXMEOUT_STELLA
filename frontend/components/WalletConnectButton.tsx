"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../hooks/useWallet";

const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

export interface WalletConnectButtonProps {
  onConnected: (address: string) => void;
}

export function WalletConnectButton({ onConnected }: WalletConnectButtonProps): JSX.Element {
  const { address, isConnected, walletNotInstalled, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (address) {
      onConnected(address);
    }
  }, [address, onConnected]);

  async function handleConnect() {
    setIsConnecting(true);
    try {
      await connect();
    } finally {
      setIsConnecting(false);
    }
  }

  if (walletNotInstalled) {
    return (
      <a
        href={FREIGHTER_INSTALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
      >
        Install Freighter
      </a>
    );
  }

  if (isConnected && address) {
    const truncated = `${address.slice(0, 5)}...${address.slice(-4)}`;
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 text-white text-sm font-medium hover:bg-gray-700"
        >
          {truncated}
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-1 w-36 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10">
            <button
              onClick={() => { disconnect(); setShowDropdown(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isConnecting) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium opacity-75 cursor-not-allowed"
      >
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Connecting...
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
    >
      Connect Wallet
    </button>
  );
}
