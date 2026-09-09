import React, { useState, useMemo } from 'react';
import type { Project } from '../api/client';
import { getRiskBadgeClasses, getRiskTier } from '../utils/formatters';

interface ProjectTableProps {
  projects: Project[];
  selectedMinistry: string | null;
  onSelectMinistry: (ministry: string | null) => void;
  onSelectProject: (projectId: string) => void;
  loading?: boolean;
}

const PAGE_SIZE = 15;

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  selectedMinistry,
  onSelectMinistry,
  onSelectProject,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [minRiskFilter, setMinRiskFilter] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique ministry list from projects
  const ministries = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.ministry));
    return Array.from(set).sort();
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.project_id.toLowerCase().includes(q) ||
        p.project_name.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q);
      const matchesMinistry = !selectedMinistry || p.ministry === selectedMinistry;
      const matchesRisk = p.risk_score >= minRiskFilter;
      return matchesSearch && matchesMinistry && matchesRisk;
    });
  }, [projects, searchQuery, selectedMinistry, minRiskFilter]);

  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  const handleMinistryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onSelectMinistry(val === 'ALL' ? null : val);
    setCurrentPage(1);
  };

  return (
    <section className="pt-8 pb-16 border-t border-[#2a2a2a]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
            Project Risk Register
          </span>
          <p className="text-xs text-[#888888] mt-0.5">
            Showing {filteredProjects.length} of {projects.length} evaluated infrastructure projects
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by ID, name, sector..."
              className="w-full h-8 px-3 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-[2px] text-xs text-[#e8e8e8] placeholder:text-[#888888] focus:outline-none focus:border-[#3b82f6] transition-all shadow-sm"
            />
          </div>

          {/* Ministry Selector */}
          <div className="w-full sm:w-48">
            <select
              value={selectedMinistry || 'ALL'}
              onChange={handleMinistryChange}
              className="w-full h-8 px-2 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-[2px] text-xs text-[#e8e8e8] focus:outline-none focus:border-[#3b82f6] transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL" className="bg-[#131313] text-[#e8e8e8]">All Ministries</option>
              {ministries.map((m) => (
                <option key={m} value={m} className="bg-[#131313] text-[#e8e8e8]">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* High Risk Filter Toggle */}
          <div className="flex items-center gap-1 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-[2px] p-0.5 shadow-sm">
            <button
              onClick={() => {
                setMinRiskFilter(0);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] rounded-[1px] transition-colors ${
                minRiskFilter === 0
                  ? 'bg-[#1a1a1a] text-[#e8e8e8] font-medium'
                  : 'text-[#888888] hover:text-[#e8e8e8]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setMinRiskFilter(66);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] rounded-[1px] transition-colors ${
                minRiskFilter >= 66
                  ? 'bg-[#ef4444]/20 text-[#ef4444] font-medium border border-[#ef4444]/30'
                  : 'text-[#888888] hover:text-[#ef4444]'
              }`}
            >
              High Risk (≥66%)
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto border border-[#2a2a2a] rounded-[2px] bg-[#131313]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider w-28">
                Project ID
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider">
                Project &amp; Sector
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider hidden md:table-cell">
                Ministry
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider text-right">
                Budget (Cr)
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider text-right hidden sm:table-cell">
                Progress
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider text-right w-28">
                Risk Score
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase text-[#888888] tracking-wider text-right hidden lg:table-cell w-28">
                Classification
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a] text-xs text-[#e8e8e8]">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="h-10">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 bg-[#1a1a1a] rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#888888]">
                  No projects matching current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedProjects.map((p) => {
                const badgeClass = getRiskBadgeClasses(p.risk_score);
                const classification = getRiskTier(p.risk_score);

                return (
                  <tr
                    key={p.project_id}
                    onClick={() => onSelectProject(p.project_id)}
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#e8e8e8] font-medium group-hover:text-[#3b82f6]">
                      {p.project_id}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-[#e8e8e8] group-hover:text-[#ffffff] leading-tight">
                        {p.project_name}
                      </div>
                      <div className="text-[11px] text-[#888888] mt-0.5">
                        {p.sector}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[#888888] hidden md:table-cell">
                      {p.ministry}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-[#e8e8e8]">
                      ₹{p.budget_allocated_cr.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-[#888888] hidden sm:table-cell">
                      {p.percent_complete.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-[2px] font-mono text-xs tabular-nums border ${badgeClass}`}
                      >
                        {p.risk_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-[11px] font-medium text-[#888888] hidden lg:table-cell">
                      {classification}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && filteredProjects.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 text-xs text-[#888888]">
          <span>
            Page <span className="font-mono text-[#e8e8e8]">{currentPage}</span> of{' '}
            <span className="font-mono text-[#e8e8e8]">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-[#131313] border border-[#2a2a2a] rounded-[2px] text-[#e8e8e8] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#3b82f6] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-[#131313] border border-[#2a2a2a] rounded-[2px] text-[#e8e8e8] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#3b82f6] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
