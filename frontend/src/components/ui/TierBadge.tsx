import { Tier, TIER_COLORS } from '@/types';

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`badge ${TIER_COLORS[tier]}`}>
      {tier}
    </span>
  );
}
