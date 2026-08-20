/** BLNK brand tokens, taken from blnkinc.xyz's own stylesheet — not approximated.
 *  The site's premise ("the world stays grey until you fill it") is why the greys
 *  are the structure and the colours are reserved for what's alive. */
export const PALETTE = {
  // Structure
  bg: "#0a0a0c", // --background
  ink: "#0e0e0e", // --ink / --grey-0
  panel: "#1a1a1a",
  panelHi: "#232323",
  border: "#2a2a2a",
  borderHi: "#383838",

  // Type
  text: "#e5e7eb", // --foreground
  paper: "#f7f6f3", // --paper
  grey1: "#4a4d52",
  grey2: "#9aa0a6",
  grey3: "#d6d9dc",

  // Colour
  lime: "#d4ff00",
  limeAlt: "#ccff00",
  green: "#4ade80",
  greenDeep: "#166534",
  violet: "#7b2ff7",
  magenta: "#ff2e93",
  orange: "#ff6b35",
  gold: "#ffc93c",
  blue: "#4892fe",
  red: "#ff4444",
} as const;

/** The signature lime → green sweep used for primary actions site-wide. */
export const GRADIENT = `linear-gradient(90deg, ${PALETTE.limeAlt}, ${PALETTE.green})`;
export const PANEL_GRADIENT = `linear-gradient(160deg, ${PALETTE.panel} 0%, ${PALETTE.panelHi} 100%)`;

/** The capsule colours the Colour Machine dispenses. */
export const SWATCH_COLORS = [
  PALETTE.magenta,
  PALETTE.green,
  PALETTE.violet,
  PALETTE.gold,
  PALETTE.blue,
  PALETTE.orange,
  PALETTE.lime,
] as const;

/** Deterministic capsule colour for any token id — same token, same colour.
 *  The avalanche step matters: a plain rolling hash maps evenly-spaced ids
 *  (#1000, #1007, #1014 …) onto the same colour, and a wall of identical
 *  swatches reads as a rendering bug. */
export function colorForToken(tokenId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < tokenId.length; i++) {
    hash ^= tokenId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  return SWATCH_COLORS[(hash >>> 0) % SWATCH_COLORS.length];
}
