import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { AlertsSection } from './components/AlertsSection';
import { MinistryHeatmap } from './components/MinistryHeatmap';
import { ProjectTable } from './components/ProjectTable';
import { ProjectDetail } from './components/ProjectDetail';
import { ChatBar } from './components/ChatBar';
import { Footer } from './components/Footer';
import {
  fetchSummary,
  fetchProjects,
  fetchAlerts,
  fetchProject,
} from './api/client';
import type {
  Project,
  MinistryRollup,
  AlertItem,
} from './api/client';
import type { RiskTier } from './utils/formatters';
import {
  FALLBACK_SUMMARY,
  FALLBACK_ALERTS,
  FALLBACK_PROJECTS,
} from './data/fallbackData';

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filter state
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [selectedRiskTier, setSelectedRiskTier] = useState<RiskTier | null>(null);

  // Connection and fallback tracking
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Data states
  const [summaryData, setSummaryData] = useState<{
    totalProjects: number;
    highRiskCount: number;
    avgRiskScore: number;
    ministries: MinistryRollup[];
  }>({
    totalProjects: FALLBACK_SUMMARY.total_projects,
    highRiskCount: FALLBACK_SUMMARY.total_high_risk,
    avgRiskScore: 28.5,
    ministries: FALLBACK_SUMMARY.ministries,
  });

  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [alerts, setAlerts] = useState<AlertItem[]>(FALLBACK_ALERTS);
  const [loading, setLoading] = useState<boolean>(true);

  // Load data function — allows retrying connection directly from the fallback banner
  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, projRes, alertRes] = await Promise.all([
        fetchSummary(),
        fetchProjects(),
        fetchAlerts(5),
      ]);

      // Calculate average risk across all ministries
      const avgScore =
        sumRes.ministries.length > 0
          ? sumRes.ministries.reduce((acc, m) => acc + m.avg_risk, 0) /
            sumRes.ministries.length
          : 0;

      setSummaryData({
        totalProjects: sumRes.total_projects,
        highRiskCount: sumRes.total_high_risk,
        avgRiskScore: avgScore,
        ministries: sumRes.ministries,
      });

      setProjects(projRes.projects);
      setAlerts(alertRes.alerts);
      setIsUsingFallback(false);
    } catch {
      // Fallback triggers ONLY on genuine failure or after 30s cold-start timeout
      const avgScore =
        FALLBACK_SUMMARY.ministries.reduce((acc, m) => acc + m.avg_risk, 0) /
        FALLBACK_SUMMARY.ministries.length;

      setSummaryData({
        totalProjects: FALLBACK_SUMMARY.total_projects,
        highRiskCount: FALLBACK_SUMMARY.total_high_risk,
        avgRiskScore: avgScore,
        ministries: FALLBACK_SUMMARY.ministries,
      });
      setProjects(FALLBACK_PROJECTS);
      setAlerts(FALLBACK_ALERTS);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRiskTier = (tier: RiskTier | null) => {
    setSelectedRiskTier(tier);
    if (tier) {
      const el = document.getElementById('project-risk-register');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Handle selecting a project
  const handleSelectProject = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveView('detail');

    // First check in loaded memory
    const existing = projects.find((p) => p.project_id === projectId);
    if (existing && existing.risk_reasons && existing.risk_reasons.length > 0) {
      setSelectedProject(existing);
    }

    // Also attempt to fetch fresh from API
    try {
      const fresh = await fetchProject(projectId);
      setSelectedProject(fresh);
    } catch {
      if (existing) {
        setSelectedProject(existing);
      }
    }
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#e8e8e8]">
      {/* Header */}
      <Header
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'dashboard') handleBackToDashboard();
        }}
        selectedProjectId={selectedProjectId}
        isUsingFallback={isUsingFallback}
      />

      {/* Main Content Shell with bottom padding for fixed liquid glass chat bar */}
      <main className="flex-1 w-full pt-14 sm:pt-16 pb-28 sm:pb-32">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
          {/* Visible Unmissable Fallback Data Banner */}
          {isUsingFallback && !loading && (
            <div
              role="alert"
              className="mb-6 mt-4 p-4 rounded-[4px] border border-[#eab308]/40 bg-[#161202] text-[#e8e8e8] shadow-[0_4px_24px_rgba(234,179,8,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded bg-[#eab308]/15 text-[#facc15] mt-0.5 sm:mt-0 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[#facc15] tracking-wide">
                      Showing cached data — live connection unavailable
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/30">
                      Offline Snapshot
                    </span>
                  </div>
                  <p className="text-xs text-[#a3a3a3] mt-1 leading-relaxed">
                    Live backend connection could not be established after the timeout window. Displaying verified precomputed baseline (1,981 projects).
                  </p>
                </div>
              </div>
              <button
                onClick={() => loadData()}
                disabled={loading}
                className="self-start sm:self-center px-3.5 py-1.5 rounded-[2px] bg-[#eab308] hover:bg-[#ca8a04] text-[#0a0a0a] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          )}
          {activeView === 'dashboard' ? (
            <>
              {/* Stat Cards */}
              <StatCards
                totalProjects={summaryData.totalProjects}
                highRiskCount={summaryData.highRiskCount}
                avgRiskScore={summaryData.avgRiskScore}
                loading={loading}
              />

              {/* Top Alerts Ticker */}
              <AlertsSection
                alerts={alerts}
                onSelectProject={handleSelectProject}
                loading={loading}
              />

              {/* Ministry Heatmap Matrix (15 Portfolios) */}
              <MinistryHeatmap
                ministries={summaryData.ministries}
                selectedMinistry={selectedMinistry}
                onSelectMinistry={setSelectedMinistry}
                selectedRiskTier={selectedRiskTier}
                onSelectRiskTier={handleSelectRiskTier}
                loading={loading}
              />

              {/* Project Table Register */}
              <ProjectTable
                projects={projects}
                selectedMinistry={selectedMinistry}
                onSelectMinistry={setSelectedMinistry}
                selectedRiskTier={selectedRiskTier}
                onSelectRiskTier={setSelectedRiskTier}
                onSelectProject={handleSelectProject}
                loading={loading}
              />
            </>
          ) : selectedProject ? (
            /* Project Detail View */
            <ProjectDetail
              project={selectedProject}
              onBack={handleBackToDashboard}
            />
          ) : (
            <div className="py-24 text-center">
              <p className="text-xs text-[#888888]">Loading project forensics...</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Liquid Glass Chat Bar fixed at bottom viewport center */}
      <ChatBar />
    </div>
  );
}
