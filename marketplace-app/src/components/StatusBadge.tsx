import { Droplet, Minus } from "lucide-react";
import { PALETTE } from "../theme/palette";
import { Pill } from "./Primitives";
import type { StakeStatus } from "../contracts/types";

const MAP = {
  soft: { label: "Filling", color: PALETTE.lime, Icon: Droplet },
  unstaked: { label: "Grey", color: PALETTE.grey1, Icon: Minus },
} as const;

export function StatusBadge({ status }: { status: StakeStatus }) {
  const { label, color, Icon } = MAP[status];
  return (
    <Pill color={color}>
      <Icon size={9} />
      {label}
    </Pill>
  );
}
