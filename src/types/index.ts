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
  uniqueProjects: number;
  uniqueUsers: number;
  agenticTasks: number;
  totalPrompts: number;
  totalCost: number;
  infraRuntimeMinutes: number;
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

/**
 * Filter selection accepted by `POST /insights`. There is no pagination, so
 * `page`/`pageSize` are intentionally absent.
 */
export interface AdoptionInsightsRequest {
  projectIds?: string[];
  users?: string[];
  startDate?: string;
  endDate?: string;
  granularity?: AdoptionGranularity;
}

/**
 * Overall summary KPIs for the current filter selection. These are aggregate
 * totals only — there are no series-derived fields (peakPeriod / averages /
 * totalPeriods) since the endpoint no longer emits a time series.
 */
export interface AdoptionCards {
  uniqueUsers: number;
  uniqueProjects: number;
  totalPrompts: number;
  totalCost: number;
  agenticTasks: number;
  infraRuntimeMinutes: number;
  userSessionMinutes: number;
}

/**
 * Grouped table row from `POST /insights`. Rows are grouped by
 * `(email, projectId, granularity-bucket)`, summing cost and prompts. The
 * client draws the chart from these rows, so no separate series is sent.
 */
export interface AdoptionTableRow {
  projectId: string;
  projectName: string;
  email: string;
  name: string | null;
  domain: string | null;
  user: string | null;
  cost: number;
  usageCount: number;
  date: string | null;
}

/**
 * Response of `POST /insights` — the summary cards plus the full, capped,
 * granularity-grouped table in one payload.
 */
export interface AdoptionInsightsResponse {
  status_code: number;
  cards: AdoptionCards;
  rows: AdoptionTableRow[];
  totalRows: number;
  detail: string;
}

/** Payload of a `400 TABLE_TOO_LARGE` error from `/insights`. */
export interface AdoptionTableTooLargeDetail {
  code: 'TABLE_TOO_LARGE';
  message: string;
  rowCount: number;
}

// ===== Token Allocation =====

export interface TokenAllocationProject {
  _id: string;
  projectID: string;
  projectName: string;
  isCodeGenie: boolean;
  allocatedCost: number | null;
}

export interface TokenAllocationResponse {
  status_code: number;
  projects: TokenAllocationProject[];
  totalProjects: number;
  detail: string;
}

/**
 * Request body for `PATCH /adoptionDashboard/token-allocation/{project_id}`.
 * Both fields are optional, but at least one must be provided.
 */
export interface UpdateTokenAllocationRequest {
  isCodeGenie?: boolean;
  allocatedCost?: number;
}

export interface UpdateTokenAllocationResponse {
  status_code: number;
  project?: TokenAllocationProject;
  detail: string;
}
