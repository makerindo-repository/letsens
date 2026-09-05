import { apiClient } from './client';

export interface LetsensAiAnalyzePayload {
  prompt?: string;
  customPrompt?: string;
  toiletData?: any;
  contextData?: any;
  damages?: any[];
  mode?: string;
}

export interface LetsensAiAnalyzeResponse {
  result: string;
  summary: string;
  model: string;
  actionableRecommendations: string[];
  predictiveInsights: string[];
}

export const letsensAiApi = {
  analyze: (payload: LetsensAiAnalyzePayload) => {
    return apiClient.post<LetsensAiAnalyzeResponse>('/letsens-ai/analyze', payload);
  },
};
