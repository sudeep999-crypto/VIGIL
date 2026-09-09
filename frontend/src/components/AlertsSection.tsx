import React from 'react';
import type { AlertItem } from '../api/client';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { getRiskBadgeClasses, getRiskTier } from '../utils/formatters';

interface AlertsSectionProps {
  alerts: AlertItem[];
  onSelectProject: (projectId: string) => void;
  loading?: boolean;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts,
  onSelectProject,
  loading = false,
}) => {
  if (loading || alerts.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ef4444]">
          Top Delay-Risk Alerts
        </span>
        <span className="text-[11px] text-[#888888]">
          — Prioritized for immediate executive review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.slice(0, 3).map((item) => (
          <div
            key={item.project_id}
            onClick={() => onSelectProject(item.project_id)}
            className="p-3 bg-[#131313] border border-[#ef4444]/30 rounded-[2px] hover:border-[#3b82f6] transition-colors cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#e8e8e8] group-hover:text-[#3b82f6]">
                  {item.project_id}
                </span>
                <span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded-[2px] border ${getRiskBadgeClasses(item.risk_score)}`}>
                  {getRiskTier(item.risk_score)} · {item.risk_score.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs font-medium text-[#e8e8e8] mt-1.5 line-clamp-1">
                {item.project_name}
              </p>
              <p className="text-[11px] text-[#888888] line-clamp-2 mt-1">
                {item.risk_brief}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a] text-[10px] text-[#888888]">
              <span>{item.ministry}</span>
              <span className="inline-flex items-center gap-0.5 text-[#3b82f6] font-medium group-hover:underline">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
