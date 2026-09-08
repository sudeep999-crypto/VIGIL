import type { SummaryResponse, AlertItem, Project } from '../api/client';
import fallbackProjectsJson from './fallbackProjects.json';

export const FALLBACK_SUMMARY: SummaryResponse = {
  total_projects: 1981,
  total_high_risk: 518,
  ministries: [
    { ministry: 'Railways', project_count: 180, avg_risk: 37.9, high_risk_count: 66 },
    { ministry: 'Petroleum & Natural Gas', project_count: 173, avg_risk: 33.6, high_risk_count: 55 },
    { ministry: 'Telecommunications', project_count: 96, avg_risk: 31.8, high_risk_count: 29 },
    { ministry: 'Housing & Urban Affairs', project_count: 167, avg_risk: 31.2, high_risk_count: 45 },
    { ministry: 'Steel', project_count: 85, avg_risk: 29.2, high_risk_count: 23 },
    { ministry: 'Civil Aviation', project_count: 100, avg_risk: 28.1, high_risk_count: 27 },
    { ministry: 'Road Transport & Highways', project_count: 254, avg_risk: 27.8, high_risk_count: 64 },
    { ministry: 'Jal Shakti', project_count: 195, avg_risk: 27.4, high_risk_count: 48 },
    { ministry: 'Coal', project_count: 103, avg_risk: 27.0, high_risk_count: 25 },
    { ministry: 'Power', project_count: 177, avg_risk: 26.6, high_risk_count: 44 },
    { ministry: 'Agriculture', project_count: 87, avg_risk: 26.4, high_risk_count: 22 },
    { ministry: 'Shipping', project_count: 82, avg_risk: 24.2, high_risk_count: 19 },
    { ministry: 'Rural Development', project_count: 96, avg_risk: 24.2, high_risk_count: 22 },
    { ministry: 'Mines', project_count: 88, avg_risk: 21.1, high_risk_count: 15 },
    { ministry: 'New & Renewable Energy', project_count: 98, avg_risk: 18.3, high_risk_count: 14 },
  ],
};

export const FALLBACK_ALERTS: AlertItem[] = [
  {
    project_id: 'PRJ-01058',
    project_name: 'Airport terminals project 1058',
    ministry: 'Civil Aviation',
    sector: 'Airport terminals',
    risk_score: 100.0,
    risk_brief:
      'Airport terminals project 1058 is at 100% risk. This is primarily driven by progress falling well behind schedule expectations, slow physical completion, and high schedule pressure. Immediate review is recommended.',
  },
  {
    project_id: 'PRJ-00002',
    project_name: 'Rural water supply project 2',
    ministry: 'Jal Shakti',
    sector: 'Rural water supply',
    risk_score: 99.6,
    risk_brief:
      'Rural water supply project 2 is at 99.6% risk. This is primarily driven by progress falling well behind schedule expectations, slow physical completion, and its classification under Rural water supply. Immediate review is recommended.',
  },
  {
    project_id: 'PRJ-00003',
    project_name: 'Metro rail project 3',
    ministry: 'Railways',
    sector: 'Metro rail',
    risk_score: 99.9,
    risk_brief:
      'Metro rail project 3 is at 99.9% risk. This is primarily driven by progress falling well behind schedule expectations, slow physical completion, and high schedule pressure. Immediate review is recommended.',
  },
];

export const FALLBACK_PROJECTS: Project[] = fallbackProjectsJson as Project[];
