export type RiskTier = 'Low' | 'Medium' | 'High';

/**
 * Shared three-tier risk classification:
 * - 0–35: Low (green #22c55e)
 * - 36–65: Medium (yellow #eab308)
 * - 66–100: High (red #ef4444)
 */
export function getRiskTier(score: number): RiskTier {
  if (score >= 66) return 'High';
  if (score >= 36) return 'Medium';
  return 'Low';
}

export function getRiskLevel(score: number): 'low' | 'mid' | 'high' {
  const tier = getRiskTier(score);
  if (tier === 'High') return 'high';
  if (tier === 'Medium') return 'mid';
  return 'low';
}

export function getRiskColor(score: number): string {
  const tier = getRiskTier(score);
  if (tier === 'High') return '#ef4444';
  if (tier === 'Medium') return '#eab308';
  return '#22c55e';
}

export function getRiskLabel(score: number): string {
  const tier = getRiskTier(score);
  return `${tier} Risk`;
}

export function getRiskBadgeClasses(score: number): string {
  const tier = getRiskTier(score);
  if (tier === 'High') {
    return 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]';
  }
  if (tier === 'Medium') {
    return 'bg-[#eab308]/15 border-[#eab308]/40 text-[#eab308]';
  }
  return 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]';
}

export function getHeatmapTileClasses(score: number): string {
  const tier = getRiskTier(score);
  if (tier === 'High') {
    return 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]';
  }
  if (tier === 'Medium') {
    return 'bg-[#eab308]/10 border-[#eab308]/30 text-[#eab308]';
  }
  return 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]';
}

