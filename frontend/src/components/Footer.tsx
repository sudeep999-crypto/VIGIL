import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-[#2a2a2a] mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#888888]">
        <div>
          <span>VIGIL Predictive Early-Warning System</span>
          <span className="mx-2 text-[#2a2a2a]">•</span>
          <span>PAIMANA Infrastructure Oversight</span>
        </div>
        <div className="font-mono text-[11px] text-[#888888]">
          XGBoost + SHAP Inference Core · SIH 2026
        </div>
      </div>
    </footer>
  );
};
