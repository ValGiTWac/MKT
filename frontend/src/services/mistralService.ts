import api, { handleApiResponse } from './api';
import {
  MistralGenerationRequest,
  MistralGenerationResponse,
  MistralTranslationRequest,
  MistralTranslationResponse,
  ApiResponse,
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

export const mistralService = {
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
};
