"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  KeyRound,
  Clapperboard,
  Ticket,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { PALETTE } from "./theme/palette";
import { CHAIN_NAME, OPENSEA_URL } from "./chain/robinhood";
import { useWallet } from "./hooks/useWallet";
import { useBalls, useOwnedNfts, useWhitelist } from "./hooks/useHolderData";
import { useStakeActions } from "./hooks/useStakeActions";
import { BALLS_PER_DAY, isEarning } from "./lib/balls";
import { NftCard } from "./components/NftCard";
import { MarketCard, type MarketItem } from "./components/MarketCard";
import { MarketDetail } from "./components/MarketDetail";
import { ColorBallsPanel } from "./components/ColorBallsPanel";
import { ConnectButton } from "./components/ConnectButton";
import { StateFrame, SkeletonGrid } from "./components/StateFrame";
import { TxToast } from "./components/TxToast";
import { GhostButton, GradientButton, OpenSeaIcon, Pill, Wordmark } from "./components/Primitives";
import { WhitelistMarketplace } from "./components/WhitelistMarketplace";
import type { BlnkNft } from "./contracts/types";

const MARKET_ITEMS: MarketItem[] = [
  {
    name: "Animation Studio",
    icon: Clapperboard,
    tagline: "Every colour, a new episode",
    blurb:
      "The boy's story doesn't end at the reveal. Short-form BLNK built for TikTok and Reels turns the world's colours into a universe people follow, not just collect.",
    accent: PALETTE.magenta,
    detail: [
      "The boy's story doesn't end at the reveal. Short-form BLNK content, built for TikTok and Instagram Reels, turns the world's colours into a universe people watch and follow — not just one they collect.",
      "Each colour pulled from the machine becomes an episode. The collection stops being a grid of images and starts being a cast.",
    ],
    unlocks: [
      "Your NFT's colour can appear as a character in an episode",
      "Holders see drops before they go public",
      "Filled NFTs are prioritised for on-screen appearances",
    ],
  },
  {
    name: "Keychains",
    icon: KeyRound,
    tagline: "Colour you can carry",
    blurb:
      "The character collectibles market is massive, and keychains sit at the centre of it. A BLNK keychain is a piece of colour carried into someone's own grey world.",
    accent: PALETTE.gold,
    detail: [
      "The character collectibles market is enormous, and keychains sit right at the centre of it. A BLNK keychain is a piece of colour someone carries into their own grey-and-white world, every day.",
      "Physical drops are matched to the colour you actually hold, so the object in your pocket is the one on your wallet.",
    ],
    unlocks: [
      "Redeem Colour Balls for a keychain in your NFT's colour",
      "Holder-only runs before general sale",
      "Rare capsule colours become limited physical editions",
    ],
  },
  {
    name: "Holder Raffle",
    icon: Ticket,
    tagline: "Balls become entries",
    blurb:
      "Colour Balls won't just sit in a wallet. Filled NFTs earn entries into holder-only draws for drops, physicals, and the rarest capsules in the machine.",
    accent: PALETTE.violet,
    detail: [
      "Colour Balls aren't meant to sit in a wallet gathering dust. Every ball you collect is weight in holder-only draws — for allowlist spots, physical drops, and the rarest capsules the machine will dispense.",
      "The longer an NFT stays filled, the more entries it earns. Holding is the whole mechanic.",
    ],
    unlocks: [
      "Balls convert into raffle entries at draw time",
      "Filled NFTs earn entries continuously, unfilled ones earn none",
      "Winners are drawn on-chain and published to the explorer",
    ],
  },
];

export default function MarketplacePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wallet = useWallet();

  const nftsQuery = useOwnedNfts(wallet.wrongNetwork ? undefined : wallet.address);
  const nfts = nftsQuery.data;
  const ballsQuery = useBalls(wallet.address, nfts);
  const whitelistQuery = useWhitelist(wallet.address);

  const { tx, busy, stake, unstake, redeem, claimWhitelist, clearTx } = useStakeActions(
    wallet.address
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [openMarketItem, setOpenMarketItem] = useState<MarketItem | null>(null);

  const toggle = useCallback((tokenId: string) => {
    setSelected((prev) =>
      prev.includes(tokenId) ? prev.filter((id) => id !== tokenId) : [...prev, tokenId]
    );
  }, []);

  const fillingCount = useMemo(() => (nfts ?? []).filter(isEarning).length, [nfts]);

  const selectedNfts = useMemo(
    () => (nfts ?? []).filter((n) => selected.includes(n.tokenId)),
    [nfts, selected]
  );
  const selectedFilling = selectedNfts.filter((n) => n.status === "soft").map((n) => n.tokenId);
  const selectedGrey = selectedNfts.filter((n) => n.status !== "soft").map((n) => n.tokenId);

  const runAction = useCallback(async (ids: string[], action: Promise<void>) => {
    setPendingIds(ids);
    try {
      await action;
    } finally {
      setPendingIds([]);
      setSelected([]);
    }
  }, []);

  const handleCardAction = useCallback(
    (nft: BlnkNft) => {
      const ids = [nft.tokenId];
      void runAction(ids, nft.status === "soft" ? unstake(ids) : stake(ids));
    },
    [runAction, stake, unstake]
  );

  const interactive = wallet.isConnected && !wallet.wrongNetwork && !wallet.viewOnly;

  if (!mounted) {
    return (
      <div className="marketplace-root min-h-screen w-full flex items-center justify-center blnk-grid" style={{ backgroundColor: PALETTE.bg }}>
        <div className="blnk-skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
      </div>
    );
  }

  return (
    <div className="marketplace-root min-h-screen lg:h-screen w-full flex flex-col lg:overflow-hidden blnk-grid" style={{ backgroundColor: PALETTE.bg }}>
      {/* Nav bar, mirroring blnkinc.xyz */}
      <header
        className="shrink-0 w-full"
        style={{ backgroundColor: "rgba(26,26,26,0.75)", borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <Link href="/">
              <Wordmark />
            </Link>
            <span className="hidden md:inline text-[11px]" style={{ color: PALETTE.grey1 }}>
              Holder Hub
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.borderHi}` }}
            >
              <Trophy size={12} color={PALETTE.gold} />
              <span className="text-[11px]" style={{ color: PALETTE.grey3 }}>
                Leaderboard
              </span>
              <Pill color={PALETTE.grey2}>Soon</Pill>
            </div>

            <a
              href={OPENSEA_URL}
              target="_blank"
              rel="noreferrer noopener"
              title="View the BLNK collection on OpenSea"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-white/5"
              style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.borderHi}`, color: PALETTE.blue }}
            >
              <OpenSeaIcon size={13} />
              <span className="hidden sm:inline text-[11px]" style={{ color: PALETTE.grey3 }}>
                OpenSea
              </span>
            </a>

            <ConnectButton wallet={wallet} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:min-h-0 max-w-[1600px] w-full mx-auto px-5 py-4">
        {/* Title row */}
        <div className="flex items-end justify-between gap-4 shrink-0 mb-4">
          <div>
            <h1
              className="blnk-display text-2xl font-black leading-none"
              style={{ color: PALETTE.paper }}
            >
              Your colour, so far.
            </h1>
            <p className="text-[12px] mt-1.5" style={{ color: PALETTE.grey2 }}>
              The world stays grey until you fill it
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-5 pb-1">
            <Stat label="Owned" value={nfts?.length ?? "—"} />
            <Stat label="Filling" value={nfts ? fillingCount : "—"} color={PALETTE.lime} />
            <Stat
              label="Balls / day"
              value={nfts ? fillingCount * BALLS_PER_DAY : "—"}
              color={PALETTE.green}
            />
          </div>
        </div>

        {wallet.wrongNetwork && (
          <Banner
            color={PALETTE.gold}
            icon={<AlertTriangle size={13} color={PALETTE.gold} />}
            text={`Wrong network. Switch to ${CHAIN_NAME} to see your BLNK.`}
            action={{ label: "Switch", onClick: wallet.switchNetwork }}
          />
        )}

        {/* Three columns */}
        <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr_0.85fr] gap-4">
          {/* Left: My NFTs */}
          <section className="flex flex-col lg:min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0 gap-2">
              <h2 className="blnk-pixel text-[10px] uppercase tracking-wider" style={{ color: PALETTE.grey2 }}>
                My BLNK NFT Holdings
              </h2>
              {selected.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  {selectedGrey.length > 0 && (
                    <GradientButton
                      disabled={busy}
                      onClick={() => void runAction(selectedGrey, stake(selectedGrey))}
                      className="!py-1 !px-3 !text-[9px]"
                    >
                      Fill {selectedGrey.length}
                    </GradientButton>
                  )}
                  {selectedFilling.length > 0 && (
                    <GhostButton
                      disabled={busy}
                      onClick={() => void runAction(selectedFilling, unstake(selectedFilling))}
                      color={PALETTE.grey2}
                      className="!py-1 !text-[9px]"
                    >
                      Stop {selectedFilling.length}
                    </GhostButton>
                  )}
                  <GhostButton
                    onClick={() => setSelected([])}
                    color={PALETTE.grey1}
                    className="!py-1 !text-[9px]"
                  >
                    Clear
                  </GhostButton>
                </div>
              ) : (
                <span className="text-[11px]" style={{ color: PALETTE.grey1 }}>
                  {nfts ? `${nfts.length} NFTs` : "—"}
                </span>
              )}
            </div>

            <div className="lg:flex-1 lg:min-h-0">
              <NftPane
                wallet={wallet}
                nfts={nfts}
                loading={nftsQuery.isPending && Boolean(wallet.address)}
                error={nftsQuery.error}
                selected={selected}
                onToggle={toggle}
                onAction={handleCardAction}
                pendingIds={pendingIds}
                interactive={interactive}
              />
            </div>
          </section>

          {/* Middle: where BLNK travels */}
          <section className="flex flex-col lg:min-h-0">
            <div className="flex items-start justify-between mb-3 shrink-0 gap-3">
              <div className="min-w-0">
                <h2
                  className="blnk-pixel text-[10px] uppercase tracking-wider"
                  style={{ color: PALETTE.grey2 }}
                >
                  Where BLNK travels
                </h2>
                <p className="text-[10px] mt-1 leading-snug" style={{ color: PALETTE.grey1 }}>
                  Colour was always meant to travel beyond the screen.
                </p>
              </div>
            </div>

            <div className="lg:flex-1 lg:min-h-0 flex flex-col gap-3">
              <WhitelistMarketplace
                balls={ballsQuery.data?.total ?? 0}
                disabled={!interactive}
                projects={whitelistQuery.data ?? []}
                claiming={busy && tx.label?.startsWith("Claiming") === true}
                onClaim={(project) => void claimWhitelist(project.id, project.name, project.cost)}
              />
              <div className="lg:flex-1 lg:min-h-0 grid grid-rows-3 gap-3">
                {MARKET_ITEMS.map((item) => (
                  <MarketCard key={item.name} item={item} onOpen={setOpenMarketItem} />
                ))}
              </div>
            </div>
          </section>

          {/* Right: Colour Machine */}
          <section className="flex flex-col lg:min-h-0">
            <h2
              className="blnk-pixel text-[10px] uppercase tracking-wider mb-3 shrink-0"
              style={{ color: PALETTE.grey2 }}
            >
              Colour Machine
            </h2>
            <div className="lg:flex-1 lg:min-h-0">
              <ColorBallsPanel
                balance={ballsQuery.data}
                nftsEarning={fillingCount}
                onRedeem={() => void redeem(ballsQuery.data?.total ?? 0)}
                redeemDisabled={!interactive || !ballsQuery.data?.total}
                redeeming={busy && tx.label?.startsWith("Redeeming") === true}
                loading={Boolean(wallet.address) && !nfts}
              />
            </div>
          </section>
        </div>
      </main>

      <MarketDetail item={openMarketItem} onClose={() => setOpenMarketItem(null)} />

      <TxToast tx={tx} onDismiss={clearTx} />
    </div>
  );
}

function NftPane({
  wallet,
  nfts,
  loading,
  error,
  selected,
  onToggle,
  onAction,
  pendingIds,
  interactive,
}: {
  wallet: ReturnType<typeof useWallet>;
  nfts?: BlnkNft[];
  loading: boolean;
  error: unknown;
  selected: string[];
  onToggle: (id: string) => void;
  onAction: (nft: BlnkNft) => void;
  pendingIds: string[];
  interactive: boolean;
}) {
  if (!wallet.isConnected) {
    return (
      <StateFrame
        icon="wallet"
        title="Connect to see your NFTs"
        body={
          wallet.hasInjectedWallet
            ? "Connect your wallet to see your BLNK NFT's, start filling them, and collect Colour Balls."
            : "No browser wallet detected. Install one to continue."
        }
        action={wallet.hasInjectedWallet ? { label: "Connect Wallet", onClick: wallet.connect } : undefined}
      />
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <StateFrame
        icon="network"
        title={`Switch to ${CHAIN_NAME}`}
        body="Your wallet is on a different network, so we can't read your BLNK."
        action={{ label: "Switch network", onClick: wallet.switchNetwork }}
      />
    );
  }

  if (loading) return <SkeletonGrid />;

  if (error) {
    return (
      <StateFrame
        icon="error"
        title="Couldn't load your BLNK"
        body={error instanceof Error ? error.message : "Unknown error reading your holdings."}
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    );
  }

  if (!nfts?.length) {
    return (
      <StateFrame
        icon="empty"
        title="No BLNK here yet"
        body="This wallet holds none. Grab a BLNK and it'll show up here, ready to fill."
      />
    );
  }

  return (
    <div className="lg:h-full lg:min-h-0 lg:overflow-y-auto blnk-scroll lg:pr-1.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[minmax(200px,1fr)] lg:min-h-full">
        {nfts.map((nft) => (
          <NftCard
            key={nft.tokenId}
            nft={nft}
            selected={selected.includes(nft.tokenId)}
            disabled={!interactive}
            onToggle={onToggle}
            onAction={onAction}
            pending={pendingIds.includes(nft.tokenId)}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wide" style={{ color: PALETTE.grey1 }}>
        {label}
      </p>
      <p
        className="blnk-display text-xl font-black leading-none mt-0.5"
        style={{ color: color ?? PALETTE.paper }}
      >
        {value}
      </p>
    </div>
  );
}

function Banner({
  color,
  icon,
  text,
  action,
}: {
  color: string;
  icon: ReactNode;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-full px-4 py-2.5 mb-4 shrink-0"
      style={{ backgroundColor: `${color}14`, border: `1px solid ${color}33` }}
    >
      {icon}
      <p className="text-[11px] flex-1" style={{ color }}>
        {text}
      </p>
      {action && (
        <GhostButton onClick={action.onClick} color={color} className="!py-1 !text-[9px]">
          {action.label}
        </GhostButton>
      )}
    </div>
  );
}
