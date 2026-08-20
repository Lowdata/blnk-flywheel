"use client";

import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useConnectModal, useAccountModal, useChainModal } from "@rainbow-me/rainbowkit";
import { BLNK_MODE, robinhood, CHAIN_NAME } from "../chain/robinhood";
import { devState, devViewWallet } from "../lib/devState";

const DEMO_ADDRESS = "0x8f3a00000000000000000000000000000000c92e" as `0x${string}`;

export interface WalletState {
  address?: `0x${string}`;
  /** True when viewing someone else's holdings read-only — writes are disabled. */
  viewOnly: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  wrongNetwork: boolean;
  chainName: string;
  connect: () => void;
  disconnect: () => void;
  openAccount: () => void;
  switchNetwork: () => void;
  hasInjectedWallet: boolean;
}

/** The only place the UI learns about wallets. Connection is RainbowKit's —
 *  its modal handles discovery, deep links, and the account sheet. */
export function useWallet(): WalletState {
  const account = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  // Read-only inspection of any address, without connecting a wallet.
  if (devViewWallet) {
    return {
      address: devViewWallet,
      viewOnly: true,
      isConnected: true,
      isConnecting: false,
      wrongNetwork: false,
      chainName: CHAIN_NAME,
      connect: () => openConnectModal?.(),
      disconnect: () => window.location.assign(window.location.pathname),
      openAccount: () => {},
      switchNetwork: () => {},
      hasInjectedWallet: true,
    };
  }

  if (BLNK_MODE === "mock") {
    return {
      address: devState === "disconnected" ? undefined : DEMO_ADDRESS,
      viewOnly: false,
      isConnected: devState !== "disconnected",
      isConnecting: false,
      wrongNetwork: devState === "wrongnet",
      chainName: CHAIN_NAME,
      connect: () => window.location.assign(window.location.pathname),
      disconnect: () => window.location.assign(`${window.location.pathname}?state=disconnected`),
      openAccount: () => {},
      switchNetwork: () => window.location.assign(window.location.pathname),
      hasInjectedWallet: true,
    };
  }

  const wrongNetwork =
    devState === "wrongnet" || (account.isConnected && account.chainId !== robinhood.id);

  return {
    address: devState === "disconnected" ? undefined : account.address,
    viewOnly: false,
    isConnected: devState === "disconnected" ? false : account.isConnected,
    isConnecting: account.isConnecting || account.isReconnecting,
    wrongNetwork,
    chainName: CHAIN_NAME,
    connect: () => openConnectModal?.(),
    disconnect: () => disconnect(),
    openAccount: () => openAccountModal?.(),
    // RainbowKit's chain modal when available; otherwise ask wagmi directly.
    switchNetwork: () =>
      openChainModal ? openChainModal() : switchChain({ chainId: robinhood.id }),
    hasInjectedWallet: true,
  };
}

export function shortAddress(address?: string): string {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
