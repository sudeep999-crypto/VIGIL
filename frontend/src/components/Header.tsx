import React from 'react';

interface HeaderProps {
  activeView: 'dashboard' | 'detail';
  onNavigate: (view: 'dashboard') => void;
  selectedProjectId?: string | null;
  isUsingFallback?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  selectedProjectId,
  isUsingFallback = false,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-[#2a2a2a]">
      <div className="h-14 sm:h-16 max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-baseline gap-3 sm:gap-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none"
          >
            <span className="text-lg font-bold tracking-widest text-[#e8e8e8] uppercase">
              VIGIL
            </span>
          </button>
          <span className="hidden md:inline-block text-xs text-[#888888] font-normal tracking-tight border-l border-[#2a2a2a] pl-4">
            Infrastructure Delay-Risk Monitoring
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`py-1 transition-colors border-b-2 font-medium ${
                activeView === 'dashboard'
                  ? 'text-[#e8e8e8] border-[#3b82f6]'
                  : 'text-[#888888] hover:text-[#e8e8e8] border-transparent'
              }`}
            >
              Dashboard
            </button>
            {selectedProjectId && (
              <span
                className={`py-1 border-b-2 font-medium flex items-center gap-1.5 ${
                  activeView === 'detail'
                    ? 'text-[#e8e8e8] border-[#3b82f6]'
                    : 'text-[#888888] border-transparent'
                }`}
              >
                Project Detail
                <span className="font-mono text-xs text-[#888888]">({selectedProjectId})</span>
              </span>
            )}
          </nav>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#2a2a2a] text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isUsingFallback ? 'bg-[#eab308] animate-pulse' : 'bg-[#22c55e]'
              }`}
            ></span>
            <span className={isUsingFallback ? 'text-[#eab308] font-mono' : 'text-[#888888]'}>
              {isUsingFallback ? 'Cached Offline Snapshot' : 'Live API Connected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
