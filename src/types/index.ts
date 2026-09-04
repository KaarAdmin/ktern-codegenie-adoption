export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: boolean;
  token: string;
  refreshToken: string;
  loginCount: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}


export interface User {
  email: string;
  token: string;
  refreshToken: string;
}


// ===== Adoption Dashboard =====

export interface AdoptionSummaryTotals {
  projects: number;
  buildspaces: number;
  users: number;
  agenticTasks: number;
  prompts: number;
  cost: number;
  infraRuntimeMinutes: number;
  userSessionMinutes: number;
  organizations: number;
}

export interface AdoptionFilterUser {
  email: string;
  displayName: string;
}

export interface AdoptionFilterProject {
  projectId: string;
  projectName: string;
  organization: string;
  users: AdoptionFilterUser[];
}

export interface AdoptionFilterTree {
  projects: AdoptionFilterProject[];
}

export interface AdoptionSummaryResponse {
  status_code: number;
  summary: AdoptionSummaryTotals;
  filterTree: AdoptionFilterTree;
  detail: string;
}

export type AdoptionGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface AdoptionInsightsRequest {
  projectIds?: string[];
  users?: string[];
  startDate?: string;
  endDate?: string;
  granularity?: AdoptionGranularity;
  page?: number;
  pageSize?: number;
}

export interface AdoptionCards {
  totalPeriods: number;
  uniqueUsers: number;
  uniqueBuildspaces: number;
  totalPrompts: number;
  totalCost: number;
  agenticTasks: number;
  infraRuntimeMinutes: number;
  userSessionMinutes: number;
  peakPeriod: string | null;
}

export interface AdoptionSeriesBucket {
  bucketStart: string;
  users: number;
  buildspaces: number;
  prompts: number;
  cost: number;
  agenticTasks: number;
  infraRuntimeMinutes: number;
  userSessionMinutes: number;
}

export interface AdoptionTableRow {
  _id?: string;
  projectId: string;
  projectName: string;
  buildSpaceId: string;
  name: string;
  email?: string;
  taskId?: string;
  date: string;
  cost?: number;
  usageCount?: number;
  duration_minutes?: number;
  devzone_total_runtime_minutes?: number;
}

export interface AdoptionTable {
  rows: AdoptionTableRow[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export interface AdoptionInsightsResponse {
  status_code: number;
  cards: AdoptionCards;
  series: AdoptionSeriesBucket[];
  table: AdoptionTable;
  detail: string;
}
