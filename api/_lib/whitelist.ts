/** Allowlist catalogue.
 *
 *  Deliberately server-side: costs must never come from the client, or a
 *  150-ball spot could be claimed for 1. The frontend renders whatever
 *  /api/whitelist returns.
 */
export interface WlProject {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  spotsTotal: number;
  /** Spots already taken before this system went live. */
  spotsSeeded: number;
  accent: string;
  closesAt: string;
}

export const WL_PROJECTS: WlProject[] = [
  {
    id: "colour-machine-s1",
    name: "Colour Machine: Season 1",
    blurb: "First capsule drop from the machine itself. Holders only.",
    cost: 90,
    spotsTotal: 500,
    spotsSeeded: 360,
    accent: "#d4ff00",
    closesAt: "2026-08-26T00:00:00Z",
  },
  {
    id: "inkfields",
    name: "Inkfields",
    blurb: "Companion collection from the studio behind the BLNK animation.",
    cost: 45,
    spotsTotal: 1000,
    spotsSeeded: 680,
    accent: "#ff2e93",
    closesAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "greyscale-genesis",
    name: "Greyscale Genesis",
    blurb: "Pre-colour artefacts from before the boy found the machine.",
    cost: 150,
    spotsTotal: 200,
    spotsSeeded: 182,
    accent: "#7b2ff7",
    closesAt: "2026-08-23T00:00:00Z",
  },
];

export function findProject(id: unknown): WlProject | undefined {
  return typeof id === "string" ? WL_PROJECTS.find((p) => p.id === id) : undefined;
}

export function closesIn(closesAt: string, now = new Date()): string {
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (ms <= 0) return "closed";
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}d`;
  return `${Math.max(1, Math.floor(ms / 3_600_000))}h`;
}
