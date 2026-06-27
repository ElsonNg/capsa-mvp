import { HugeiconsIcon } from "@hugeicons/react";
import { getSpaceIcon } from "@/lib/spaces/icons";

/** Renders a space's icon from its stored key with consistent sizing. */
export function SpaceIcon({
  iconKey,
  size = 20,
  className,
}: {
  iconKey?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={getSpaceIcon(iconKey)}
      size={size}
      strokeWidth={1.8}
      className={className}
    />
  );
}
