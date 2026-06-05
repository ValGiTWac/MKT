import api, { handleApiResponse } from './api';
import {
  MistralGenerationRequest,
  MistralGenerationResponse,
  MistralTranslationRequest,
  MistralTranslationResponse,
  ApiResponse,
  BufferPost,
  BufferProfile,
  AsanaTask,
  AsanaProject,
} from '@/types';

const MISTRAL_ENDPOINT = '/mistral';

export interface ContentOptimizationRequest {
  content: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
  maxLength?: number;
}

export interface ContentOptimizationResponse {
  optimizedContent: string;
  suggestions: string[];
  metadata: {
    originalLength: number;
    optimizedLength: number;
    readabilityImprovement: number;
  };
}

export interface GrammarCorrectionRequest {
  text: string;
  language?: string;
}

export interface GrammarCorrectionResponse {
  correctedText: string;
  corrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
}

// Buffer via Mistral Vibe MCP
export interface BufferPublishRequest {
  post: BufferPost;
  profileId?: string;
  scheduleAt?: string; // ISO date string for scheduling
}

export interface BufferPublishResponse {
  success: boolean;
  postId: string;
  scheduledAt?: string;
  publishedAt?: string;
  message?: string;
}

export interface BufferProfilesResponse {
  profiles: BufferProfile[];
}

// Asana via Mistral Vibe MCP
export interface AsanaCreateTaskRequest {
  task: AsanaTask;
  projectId?: string;
}

export interface AsanaCreateTaskResponse {
  success: boolean;
  taskId: string;
  task: AsanaTask;
}

export interface AsanaProjectsResponse {
  projects: AsanaProject[];
}

export const mistralService = {
  // ==================== Mistral Core Features ====================

  // Generate content using Mistral Vibe
  generateContent: async (request: MistralGenerationRequest): Promise<MistralGenerationResponse> => {
    return handleApiResponse<MistralGenerationResponse>(
      api.post(`${MISTRAL_ENDPOINT}/generate`, request)
    );
  },

  // Translate content
  translateContent: async (request: MistralTranslationRequest): Promise<MistralTranslationResponse> => {
    return handleApiResponse<MistralTranslationResponse>(
      api.post(`${MISTRAL_ENDPOINT}/translate`, request)
    );
  },

  // Optimize content for social media
  optimizeContent: async (request: ContentOptimizationRequest): Promise<ContentOptimizationResponse> => {
    return handleApiResponse<ContentOptimizationResponse>(
      api.post(`${MISTRAL_ENDPOINT}/optimize`, request)
    );
  },

  // Correct grammar and spelling
  correctGrammar: async (request: GrammarCorrectionRequest): Promise<GrammarCorrectionResponse> => {
    return handleApiResponse<GrammarCorrectionResponse>(
      api.post(`${MISTRAL_ENDPOINT}/correct`, request)
    );
  },

  // Generate post ideas
  generatePostIdeas: async (topic: string, count: number = 5): Promise<string[]> => {
    return handleApiResponse<string[]>(
      api.post(`${MISTRAL_ENDPOINT}/ideas`, { topic, count })
    );
  },

  // Generate hashtags
  generateHashtags: async (content: string, count: number = 5): Promise<string[]> => {
    return handleApiResponse<string[]>(
      api.post(`${MISTRAL_ENDPOINT}/hashtags`, { content, count })
    );
  },

  // Analyze content sentiment
  analyzeSentiment: async (text: string): Promise<{ sentiment: string; score: number; confidence: number }> => {
    return handleApiResponse<{ sentiment: string; score: number; confidence: number }>(
      api.post(`${MISTRAL_ENDPOINT}/sentiment`, { text })
    );
  },

  // Check if Mistral integration is active
  checkIntegration: async (): Promise<{ active: boolean; model?: string }> => {
    return handleApiResponse<{ active: boolean; model?: string }>(
      api.get(`${MISTRAL_ENDPOINT}/status`)
    );
  },

  // ==================== Buffer Integration via Mistral Vibe MCP ====================

  // Get all Buffer profiles connected via Mistral Vibe
  getBufferProfiles: async (): Promise<BufferProfilesResponse> => {
    return handleApiResponse<BufferProfilesResponse>(
      api.get(`${MISTRAL_ENDPOINT}/buffer/profiles`)
    );
  },

  // Publish a post to Buffer via Mistral Vibe
  publishToBuffer: async (request: BufferPublishRequest): Promise<BufferPublishResponse> => {
    return handleApiResponse<BufferPublishResponse>(
      api.post(`${MISTRAL_ENDPOINT}/buffer/publish`, request)
    );
  },

  // Schedule a post to Buffer via Mistral Vibe
  scheduleBufferPost: async (request: BufferPublishRequest): Promise<BufferPublishResponse> => {
    return handleApiResponse<BufferPublishResponse>(
      api.post(`${MISTRAL_ENDPOINT}/buffer/schedule`, request)
    );
  },

  // ==================== Asana Integration via Mistral Vibe MCP ====================

  // Get all Asana projects connected via Mistral Vibe
  getAsanaProjects: async (): Promise<AsanaProjectsResponse> => {
    return handleApiResponse<AsanaProjectsResponse>(
      api.get(`${MISTRAL_ENDPOINT}/asana/projects`)
    );
  },

  // Create a task in Asana via Mistral Vibe
  createAsanaTask: async (request: AsanaCreateTaskRequest): Promise<AsanaCreateTaskResponse> => {
    return handleApiResponse<AsanaCreateTaskResponse>(
      api.post(`${MISTRAL_ENDPOINT}/asana/task`, request)
    );
  },

  // Create a task from a post in Asana via Mistral Vibe
  createAsanaTaskFromPost: async (postId: string, projectId?: string): Promise<AsanaCreateTaskResponse> => {
    return handleApiResponse<AsanaCreateTaskResponse>(
      api.post(`${MISTRAL_ENDPOINT}/asana/task-from-post`, { postId, projectId })
    );
  },
};
