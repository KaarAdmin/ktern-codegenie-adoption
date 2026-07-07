// AI Agents Analytics types — separated from CodeGenie types so they can evolve independently.
// Initially mirrors the CodeGenie UserExtendedModel; will diverge as KPIs change and MongoDB integration lands.

export interface AIAgentExtendedModel {
    sessionId: string,
    agentId: string,
    agentName: string,
    purpose: string,
    environment: string,
    inputTokens: number,
    outputTokens: number,
    totalTokens: number,
    status: string,
    date: string,
    email: string,
    user: string,
    domain: string,
    projectId: string,
    projectName: string,
    cost: number
}

export interface AIAgentExtendedInsightsResponse {
  status_code: number;
  count: number;
  users_extended: AIAgentExtendedModel[];
}
