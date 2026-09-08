import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { Project } from '../api/client';
import { getRiskColor, getRiskLabel } from '../utils/formatters';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const riskColor = getRiskColor(project.risk_score);
  const riskLabel = getRiskLabel(project.risk_score);

  // SVG Gauge calculations
  const radius = 86;
  const circumference = 2 * Math.PI * radius; // ~540.35
  const clampedScore = Math.min(Math.max(project.risk_score, 0), 100);
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  // Find max absolute impact to scale horizontal bars proportionally
  const maxImpact = Math.max(
    ...project.risk_reasons.map((r) => Math.abs(r.impact)),
    1.0
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="max-w-[880px] mx-auto py-6 sm:py-8"
    >
      {/* Liquid Glass Panel Backdrop */}
      <div className="rounded-[4px] border border-white/10 bg-neutral-900/60 backdrop-blur-md p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
        {/* 1. Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#e8e8e8] transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#2a2a2a] pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#e8e8e8]">
                <span className="font-mono text-[#888888] mr-2">{project.project_id}</span>
                {project.project_name}
              </h1>
              <p className="text-xs text-[#888888] mt-1">
                {project.ministry} · {project.sector}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Single Risk Gauge (0-100) — Solid High-Contrast Container */}
        <section className="flex flex-col items-center justify-center my-6">
          <div className="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center">
            <svg
              aria-label={`Risk gauge score ${project.risk_score} out of 100`}
              className="w-full h-full -rotate-90"
              viewBox="0 0 200 200"
            >
              {/* Background track */}
              <circle
                cx="100"
                cy="100"
                fill="none"
                r={radius}
                stroke="#201f1f"
                strokeWidth="8"
              />
              {/* Dynamic animated progress arc */}
              <motion.circle
                cx="100"
                cy="100"
                fill="none"
                r={radius}
                stroke={riskColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-4xl sm:text-5xl font-medium text-[#e8e8e8] tracking-tight tabular-nums">
                {project.risk_score.toFixed(1)}%
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-widest mt-2"
                style={{ color: riskColor }}
              >
                {riskLabel}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Plain-Language Risk Explanation (risk_brief) — Solid High-Contrast Card */}
        <section className="max-w-[700px] mx-auto my-6 p-4 rounded-[2px] bg-[#131313] border border-[#2a2a2a] text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#888888] mb-1.5">
            Model Diagnostic Summary
          </span>
          <p className="text-sm text-[#e8e8e8] leading-relaxed">
            {project.risk_brief}
          </p>
        </section>

        {/* 4. Horizontal Bar Chart (Top Contributing SHAP Factors) — Solid High-Contrast Container */}
        <section className="w-full max-w-[700px] mx-auto my-6 p-5 rounded-[2px] bg-[#131313] border border-[#2a2a2a] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
              SHAP Delay-Risk Drivers
            </span>
            <span className="text-[11px] font-mono text-[#888888]">
              Top 3 Factor Decomposition
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {project.risk_reasons.map((reason, index) => {
              const isPositive = reason.impact >= 0;
              const barColor = isPositive ? '#ef4444' : '#22c55e';
              const impactPercentage = Math.min((Math.abs(reason.impact) / maxImpact) * 100, 100);

              return (
                <div key={index} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[#e8e8e8] font-medium">
                      {reason.feature}
                    </span>
                    <span
                      className="font-mono text-xs tabular-nums font-semibold"
                      style={{ color: barColor }}
                    >
                      {isPositive ? `+${reason.impact.toFixed(4)}` : reason.impact.toFixed(4)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#201f1f] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${impactPercentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.15, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Bottom Telemetry Stats Row — Solid High-Contrast Container */}
        <section className="w-full max-w-[700px] mx-auto mt-6 p-4 rounded-[2px] bg-[#131313] border border-[#2a2a2a] grid grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888] mb-1">
              Budget Allocated
            </span>
            <span className="font-mono text-sm sm:text-base font-medium text-[#e8e8e8] tabular-nums">
              ₹{project.budget_allocated_cr.toFixed(2)} Cr
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888] mb-1">
              Physical Progress
            </span>
            <span className="font-mono text-sm sm:text-base font-medium text-[#e8e8e8] tabular-nums">
              {project.percent_complete.toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888] mb-1">
              Timeline Elapsed
            </span>
            <span className="font-mono text-sm sm:text-base font-medium text-[#e8e8e8] tabular-nums">
              {project.months_elapsed} / {project.planned_duration_months} mos
            </span>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
