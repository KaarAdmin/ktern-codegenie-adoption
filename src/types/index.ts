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


export interface OrganizationLevelInsightsResponse {
  status_code: number;
  count: number;
  organizations: OrganizationModel[];
}

export interface OrganizationModel {
  organization: string;
  active: boolean;
  app_deployed_count: number;
  app_generated_count: number;
  country: string;
  createdOn: string;
  eventsLast4Weeks: number;
  industry: string;
  lastCodeGenieEventOn: string | null;
  sbu: string;
  totalActiveProject: number;
  totalActiveUser: number;
  totalCost: number;
  totalEvents: number;
  totalProject: number;
  totalUsers: number;
  totalUsersAccepted: number;
  totalUsersInvited: number;
  globalTotalActiveUser: number;
  globalTotalUsers: number;
  globalTotalUsersAccepted: number;
  globalTotalUsersInvited: number;
}


export interface ProjectModel {
  projectId: string;
  projectName: string;
  createdOn: string;
  country: string;
  sbu: string;
  industry: string;
  active: boolean;
  organizations: string[];
  totalUsers: number;
  totalUsersInvited: number;
  totalUsersAccepted: number;
  totalActiveUser: number;
  lastCodeGenieEventOn: string | null;
  app_deployed_count: number;
  app_generated_count: number;
  totalEvents: number;
  totalCost: number;
  eventsLast4Weeks: number;
  globalTotalActiveUser: number;
  globalTotalUsers: number;
  globalTotalUsersAccepted: number;
  globalTotalUsersInvited: number;
}

export interface ProjectLevelInsightsResponse {
  status_code: number;
  count: number;
  projects: ProjectModel[];
}


export interface UserModel {
  email: string;
  projectId: string;
  organization: string;
  app_deployed_count: number;
  app_generated_count: number;
  eventsLast4Weeks: number;
  fullName: string;
  lastCodeGenieEventOn: string | null;
  projectName: string;
  status: string;
  totalCost: number;
  totalEvents: number;
  domain:string;
}

export interface UserLevelInsightsResponse {
  status_code: number;
  count: number;
  users: UserModel[];
}