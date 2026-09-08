export function getRiskLevel(score: number): 'low' | 'mid' | 'high' {
  if (score >= 66) return 'high';
  if (score >= 36) return 'mid';
  return 'low';
}

export function getRiskColor(score: number): string {
  if (score >= 66) return '#ef4444';
  if (score >= 36) return '#eab308';
  return '#22c55e';
}

export function getRiskLabel(score: number): string {
  if (score >= 66) return 'High Risk';
  if (score >= 36) return 'Medium Risk';
  return 'Low Risk';
}

export function getRiskBadgeClasses(score: number): string {
  if (score >= 66) {
    return 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]';
  }
  if (score >= 36) {
    return 'bg-[#eab308]/15 border-[#eab308]/40 text-[#eab308]';
  }
  return 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]';
}

export function getHeatmapTileClasses(score: number): string {
  if (score >= 66) {
    return 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]';
  }
  if (score >= 36) {
    return 'bg-[#eab308]/10 border-[#eab308]/30 text-[#eab308]';
  }
  return 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]';
}
