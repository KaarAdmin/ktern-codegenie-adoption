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

export interface BuildSpace {
  id: string;
  projectId: string;
  status: string;
  name: string;
  description: string;
  repositoryName: string;
  repositoryUrl: string;
  githubLogin: string;
  createdBy: string;
  owner: string;
  members: Record<string, string>;
  createdOn: string;
  totalCost: number;
  totalItemCount: number;
}

export interface UserExpense {
  projectId: string;
  name: string;
  user: string;
  totalCost: number;
  totalItemCount: number;
}

export interface BuildSpaceInsightsResponse {
  status_code: number;
  count: number;
  build_space: BuildSpace[];
  user_expense: UserExpense[];
}

export interface DashboardMetrics {
  totalProjects: number;
  newProjectsThisMonth: number;
  totalDevelopers: number;
  generatedArtifacts: number;
  totalCost: number;
  averageEngagement: number;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
  cost?: number;
  engagement?: number;
}

export interface FilterOptions {
  project_id?: string;
  status?: string;
  created_on_gt?: string;
  created_on_lt?: string;
  created_on_eq?: string;
  owner?: string;
  created_by?: string;
}

export interface User {
  email: string;
  token: string;
  refreshToken: string;
}
