/**
 * VIGIL API Client
 * Strictly typed against FastAPI backend routes in backend/main.py.
 */

export interface RiskReason {
  feature: string;
  impact: number;
}

export interface Project {
  project_id: string;
  project_name: string;
  ministry: string;
  sector: string;
  budget_allocated_cr: number;
  percent_complete: number;
  months_elapsed: number;
  planned_duration_months: number;
  risk_score: number;
  risk_brief: string;
  risk_reasons: RiskReason[];
}

export interface MinistryRollup {
  ministry: string;
  project_count: number;
  avg_risk: number;
  high_risk_count: number;
}

export interface SummaryResponse {
  total_projects: number;
  total_high_risk: number;
  ministries: MinistryRollup[];
}

export interface ProjectsResponse {
  count: number;
  projects: Project[];
}

export interface AlertItem {
  project_id: string;
  project_name: string;
  ministry: string;
  sector: string;
  risk_score: number;
  risk_brief: string;
}

export interface AlertsResponse {
  count: number;
  alerts: AlertItem[];
}

export interface ChatResponse {
  answer: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * 30-second timeout window.
 * This generous timeout ensures that backend containers waking up from cold starts
 * (e.g. Render, Railway, Hugging Face, or uvicorn boot) are granted ample time to
 * respond without prematurely triggering false fallback data.
 */
export const COLD_START_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Connection timed out after ${COLD_START_TIMEOUT_MS / 1000}s (genuine failure)`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchSummary(): Promise<SummaryResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/summary`);
  return handleResponse<SummaryResponse>(res);
}

export async function fetchProjects(params?: {
  ministry?: string;
  min_risk?: number;
}): Promise<ProjectsResponse> {
  const query = new URLSearchParams();
  if (params?.ministry && params.ministry !== 'ALL') {
    query.set('ministry', params.ministry);
  }
  if (params?.min_risk !== undefined && params.min_risk > 0) {
    query.set('min_risk', params.min_risk.toString());
  }

  const qs = query.toString();
  const url = `${API_BASE}/projects${qs ? `?${qs}` : ''}`;
  const res = await fetchWithTimeout(url);
  return handleResponse<ProjectsResponse>(res);
}

export async function fetchProject(projectId: string): Promise<Project> {
  const res = await fetchWithTimeout(`${API_BASE}/projects/${encodeURIComponent(projectId)}`);
  return handleResponse<Project>(res);
}

export async function fetchAlerts(limit: number = 10): Promise<AlertsResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/alerts?limit=${limit}`);
  return handleResponse<AlertsResponse>(res);
}

export async function sendChat(question: string): Promise<ChatResponse> {
  const res = await fetchWithTimeout(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
  return handleResponse<ChatResponse>(res);
}
