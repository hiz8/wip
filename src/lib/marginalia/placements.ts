export interface MarginaliaMeasurement {
  id: string;
  top: number;
  height: number;
}

export interface MarginaliaPlacement {
  id: string;
  top: number;
}

export interface ComputeMarginaliaOptions {
  gap?: number;
}

const DEFAULT_GAP = 8;

// Resolve overlapping marginalia by pushing later items down so each occupies
// at least `gap` pixels below the previous one. Anchor positions come from
// DOMRect measurements relative to the content container.
export function computeMarginaliaPlacements(
  measurements: readonly MarginaliaMeasurement[],
  options: ComputeMarginaliaOptions = {},
): MarginaliaPlacement[] {
  const gap = options.gap ?? DEFAULT_GAP;
  if (measurements.length === 0) return [];

  const sorted = measurements.toSorted((a, b) => a.top - b.top);
  const placements: MarginaliaPlacement[] = [];
  let cursor = Number.NEGATIVE_INFINITY;

  for (const item of sorted) {
    const top = item.top < cursor + gap ? cursor + gap : item.top;
    placements.push({ id: item.id, top });
    cursor = top + Math.max(0, item.height);
  }

  return placements;
}
