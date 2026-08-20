"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdapter } from "../contracts/provider";
import { NotDeployedError, type TxState } from "../contracts/types";

/** Wraps the adapter's writes in a lifecycle the UI can render:
 *  signing (wallet prompt) -> pending (server call) -> success | error.
 *
 *  Soft-staking is a database write authorised by a signature, so there is no
 *  transaction and nothing to link to an explorer. */
export function useStakeActions(owner?: `0x${string}`) {
  const adapter = useAdapter();
  const queryClient = useQueryClient();
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const clearTx = useCallback(() => setTx({ status: "idle" }), []);

  const run = useCallback(
    async (label: string, action: (owner: `0x${string}`) => Promise<void>) => {
      if (!owner) return;
      setTx({ status: "signing", label });
      try {
        await action(owner);
        setTx({ status: "pending", label });
        await queryClient.invalidateQueries({ queryKey: ["owned-nfts"] });
        await queryClient.invalidateQueries({ queryKey: ["balls"] });
        setTx({ status: "success", label });
      } catch (error) {
        const message =
          error instanceof NotDeployedError
            ? error.message
            : error instanceof Error
              ? shortenError(error.message)
              : "Request failed";
        setTx({ status: "error", label, error: message });
      }
    },
    [owner, queryClient]
  );

  const stake = useCallback(
    (tokenIds: string[]) =>
      run(`Soft-staking ${tokenIds.length} BLNK`, (o) => adapter.stake(o, tokenIds)),
    [adapter, run]
  );

  const unstake = useCallback(
    (tokenIds: string[]) =>
      run(`Unstaking ${tokenIds.length} BLNK`, (o) => adapter.unstake(o, tokenIds)),
    [adapter, run]
  );

  const redeem = useCallback(
    (balls: number) => run(`Redeeming ${balls} balls`, (o) => adapter.redeem(o, balls)),
    [adapter, run]
  );

  const claimWhitelist = useCallback(
    (projectId: string, name: string, cost: number) =>
      run(`Claiming ${name}`, async (o) => {
        await adapter.claimWhitelist(o, projectId, cost);
        await queryClient.invalidateQueries({ queryKey: ["whitelist"] });
      }),
    [adapter, queryClient, run]
  );

  const busy = tx.status === "signing" || tx.status === "pending";

  return { tx, busy, stake, unstake, redeem, claimWhitelist, clearTx };
}

/** Wallet errors arrive as multi-paragraph dumps; the toast has one line. */
function shortenError(message: string): string {
  if (/user rejected|denied|rejected the request/i.test(message)) return "Signature rejected";
  return message.split("\n")[0].slice(0, 120);
}
