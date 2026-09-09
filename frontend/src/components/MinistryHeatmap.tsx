import React from 'react';
import { motion, type Variants } from 'framer-motion';
import type { MinistryRollup } from '../api/client';
import type { RiskTier } from '../utils/formatters';
import { getHeatmapTileClasses } from '../utils/formatters';

interface MinistryHeatmapProps {
  ministries: MinistryRollup[];
  selectedMinistry: string | null;
  onSelectMinistry: (ministry: string | null) => void;
  selectedRiskTier?: RiskTier | null;
  onSelectRiskTier?: (tier: RiskTier | null) => void;
  loading?: boolean;
}

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

export const MinistryHeatmap: React.FC<MinistryHeatmapProps> = ({
  ministries,
  selectedMinistry,
  onSelectMinistry,
  selectedRiskTier = null,
  onSelectRiskTier,
  loading = false,
}) => {
  return (
    <section className="pt-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
            System Heatmap
          </span>
          <span className="text-xs text-[#888888]">— 15 Key Portfolios</span>
          {selectedMinistry && (
            <button
              onClick={() => onSelectMinistry(null)}
              className="ml-2 text-xs text-[#3b82f6] hover:underline cursor-pointer"
            >
              (Clear filter: {selectedMinistry})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
          <button
            type="button"
            onClick={() => onSelectRiskTier?.(selectedRiskTier === 'Low' ? null : 'Low')}
            title="Filter table by Low Risk (0–35%)"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] transition-all cursor-pointer border ${
              selectedRiskTier === 'Low'
                ? 'bg-[#22c55e]/15 border-[#22c55e]/50 text-[#22c55e] font-semibold shadow-[0_0_8px_rgba(34,197,94,0.25)]'
                : 'border-transparent hover:border-[#2a2a2a] hover:text-[#e8e8e8]'
            }`}
          >
            <span className="w-2 h-2 rounded-[1px] bg-[#22c55e]"></span> 0–35 Low
          </button>
          <button
            type="button"
            onClick={() => onSelectRiskTier?.(selectedRiskTier === 'Medium' ? null : 'Medium')}
            title="Filter table by Medium Risk (36–65%)"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] transition-all cursor-pointer border ${
              selectedRiskTier === 'Medium'
                ? 'bg-[#eab308]/15 border-[#eab308]/50 text-[#eab308] font-semibold shadow-[0_0_8px_rgba(234,179,8,0.25)]'
                : 'border-transparent hover:border-[#2a2a2a] hover:text-[#e8e8e8]'
            }`}
          >
            <span className="w-2 h-2 rounded-[1px] bg-[#eab308]"></span> 36–65 Medium
          </button>
          <button
            type="button"
            onClick={() => onSelectRiskTier?.(selectedRiskTier === 'High' ? null : 'High')}
            title="Filter table by High Risk (66–100%)"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] transition-all cursor-pointer border ${
              selectedRiskTier === 'High'
                ? 'bg-[#ef4444]/15 border-[#ef4444]/50 text-[#ef4444] font-semibold shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                : 'border-transparent hover:border-[#2a2a2a] hover:text-[#e8e8e8]'
            }`}
          >
            <span className="w-2 h-2 rounded-[1px] bg-[#ef4444]"></span> 66–100 High
          </button>
          {selectedRiskTier && (
            <button
              type="button"
              onClick={() => onSelectRiskTier?.(null)}
              className="text-[11px] text-[#3b82f6] hover:underline ml-1 cursor-pointer"
            >
              (Clear tier)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="h-36 bg-[#131313] border border-[#2a2a2a] rounded-[2px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {ministries.map((item) => {
            const isSelected = selectedMinistry === item.ministry;
            const tileRiskClass = getHeatmapTileClasses(item.avg_risk);

            return (
              <motion.div
                key={item.ministry}
                variants={tileVariants}
                whileHover={{
                  scale: 1.03,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }}
                onClick={() => onSelectMinistry(isSelected ? null : item.ministry)}
                className={`p-4 rounded-[2px] flex flex-col justify-between h-36 cursor-pointer border transition-colors select-none ${tileRiskClass} ${
                  isSelected
                    ? 'ring-1 ring-[#3b82f6] border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                    : 'hover:border-[#3b82f6] hover:shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                }`}
              >
                <div>
                  <h2 className="text-sm font-medium text-[#e8e8e8] leading-snug line-clamp-2">
                    {item.ministry}
                  </h2>
                  {item.high_risk_count > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-mono uppercase text-[#ef4444]">
                      {item.high_risk_count} high-risk
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-4">
                  <span className="text-xs text-[#888888] font-normal">
                    {item.project_count} projects
                  </span>
                  <span className="font-mono text-2xl font-medium tabular-nums">
                    {item.avg_risk.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
};
