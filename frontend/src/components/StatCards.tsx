import React from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

interface StatCardsProps {
  totalProjects: number;
  highRiskCount: number;
  avgRiskScore: number;
  loading?: boolean;
}

const StatItem: React.FC<{
  label: string;
  value: number;
  valueColor?: string;
  suffix?: string;
  loading?: boolean;
  delay?: number;
}> = ({ label, value, valueColor = 'text-[#e8e8e8]', suffix = '', loading = false, delay = 0 }) => {
  const animatedValue = useCountUp(value, 900);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col bg-[#131313] border border-[#2a2a2a] px-4 py-3 rounded-[2px] min-w-[140px] sm:min-w-[170px]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888]">
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-1">
        {loading ? (
          <span className="h-7 w-16 bg-[#2a2a2a] animate-pulse rounded-[2px]" />
        ) : (
          <span className={`font-mono text-2xl sm:text-3xl font-medium tabular-nums ${valueColor}`}>
            {animatedValue}
            {suffix}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const StatCards: React.FC<StatCardsProps> = ({
  totalProjects,
  highRiskCount,
  avgRiskScore,
  loading = false,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-[#2a2a2a]"
    >
      <div>
        <h1 className="text-lg sm:text-xl font-medium tracking-tight text-[#e8e8e8]">
          National Portfolio Delay-Risk Oversight
        </h1>
        <p className="text-xs text-[#888888] mt-1">
          Predictive early-warning telemetry across 15 central ministries
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <StatItem
          label="Total Projects"
          value={totalProjects}
          loading={loading}
          delay={0.05}
        />
        <StatItem
          label="High Risk Count"
          value={highRiskCount}
          valueColor="text-[#ef4444]"
          loading={loading}
          delay={0.12}
        />
        <StatItem
          label="Avg Risk Score"
          value={Math.round(avgRiskScore)}
          suffix="%"
          loading={loading}
          delay={0.19}
        />
      </div>
    </motion.section>
  );
};
