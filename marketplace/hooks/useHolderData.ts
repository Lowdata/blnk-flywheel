"use client";
import { useQuery } from "@tanstack/react-query";
import { useAdapter } from "../contracts/provider";
import type { BallBalance, BlnkNft } from "../contracts/types";
import { totalAccrued } from "../lib/balls";

export function useOwnedNfts(address?: `0x${string}`) {
  const adapter = useAdapter();

  return useQuery<BlnkNft[]>({
    queryKey: ["owned-nfts", adapter.kind, address],
    queryFn: () => adapter.getOwnedNfts(address as `0x${string}`),
    enabled: Boolean(address),
  });
}

export function useBalls(address: `0x${string}` | undefined, nfts: BlnkNft[] | undefined) {
  const adapter = useAdapter();

  return useQuery<BallBalance>({
    queryKey: ["balls", adapter.kind, address, nfts?.length],
    queryFn: () => adapter.getBallBalance(address as `0x${string}`, nfts ?? []),
    enabled: Boolean(address && nfts),
    // Accrual is a pure function of wall-clock time, so a cached total goes
    // stale on its own. Re-derive every minute instead of only on mutation.
    refetchInterval: 60_000,
    placeholderData: nfts ? accruedOnly(nfts) : undefined,
  });
}

function accruedOnly(nfts: BlnkNft[]): BallBalance {
  const accrued = totalAccrued(nfts);
  return { accrued, credited: 0, spent: 0, total: accrued };
}

export function useWhitelist(address?: `0x${string}`) {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ["whitelist", adapter.kind, address],
    queryFn: () => adapter.getWhitelist(address),
  });
}
