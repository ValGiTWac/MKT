import api, { handleApiError } from './api';
import {
  MistralVibeRequest,
  MistralVibeResponse,
  MistralGenerationRequest,
  ApiResponse,
  Translation,
} from '@/types';

const MISTRAL_ENDPOINTS = {
  GENERATE: '/mistral/generate',
  TRANSLATE: '/mistral/translate',
  CORRECT: '/mistral/correct',
  OPTIMIZE: '/mistral/optimize',
  ANALYZE: '/mistral/analyze',
  SUGGEST_HASHTAGS: '/mistral/suggest-hashtags',
  SUGGEST_TITLE: '/mistral/suggest-title',
};

// Direct Mistral Vibe API client (for frontend-only operations)
const mistralApi = {
  async generate(request: MistralVibeRequest): Promise<MistralVibeResponse> {
    try {
      const response = await fetch('https://api.mistral.ai/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_MISTRAL_VIBE_API_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export const mistralService = {
  // Generate content using Mistral Vibe
  async generate(request: MistralGenerationRequest): Promise<string> {
    try {
      const response = await api.post<ApiResponse<{ content: string }>>(
        MISTRAL_ENDPOINTS.GENERATE,
        request
      );
      return response.data.data.content;
    } catch (error) {
      // Fallback to direct API if backend fails
      try {
        const prompt = this.buildPrompt(request);
        const mistralResponse = await mistralApi.generate({
          prompt,
          model: 'mistral-tiny',
          temperature: 0.7,
          maxTokens: 500,
        });
        return mistralResponse.choices[0].text;
      } catch (fallbackError) {
        throw new Error(handleApiError(fallbackError));
      }
    }
  },

  // Translate content
  async translate(
    content: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Translation> {
    try {
      const response = await api.post<ApiResponse<Translation>>(
        MISTRAL_ENDPOINTS.TRANSLATE,
        {
          content,
          targetLanguage,
          sourceLanguage,
        }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Correct grammar and spelling
  async correct(content: string, language: string = 'fr'): Promise<string> {
    try {
      const response = await api.post<ApiResponse<{ correctedContent: string }>>(
        MISTRAL_ENDPOINTS.CORRECT,
        {
          content,
          language,
        }
      );
      return response.data.data.correctedContent;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Optimize content for social media
  async optimize(
    content: string,
    platform: string,
    options?: {
      tone?: string;
      length?: string;
      targetAudience?: string;
    }
  ): Promise<string> {
    try {
      const response = await api.post<ApiResponse<{ optimizedContent: string }>>(
        MISTRAL_ENDPOINTS.OPTIMIZE,
        {
          content,
          platform,
          options,
        }
      );
      return response.data.data.optimizedContent;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Analyze content
  async analyze(content: string): Promise<{
    sentiment: string;
    readability: number;
    engagementScore: number;
    suggestions: string[];
  }> {
    try {
      const response = await api.post<ApiResponse<{
        sentiment: string;
        readability: number;
        engagementScore: number;
        suggestions: string[];
      }>>(
        MISTRAL_ENDPOINTS.ANALYZE,
        { content }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Suggest hashtags
  async suggestHashtags(content: string, count: number = 5): Promise<string[]> {
    try {
      const response = await api.post<ApiResponse<{ hashtags: string[] }>>(
        MISTRAL_ENDPOINTS.SUGGEST_HASHTAGS,
        {
          content,
          count,
        }
      );
      return response.data.data.hashtags;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Suggest title
  async suggestTitle(content: string): Promise<string[]> {
    try {
      const response = await api.post<ApiResponse<{ titles: string[] }>>(
        MISTRAL_ENDPOINTS.SUGGEST_TITLE,
        { content }
      );
      return response.data.data.titles;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Generate post from scratch
  async generatePost(options: {
    topic: string;
    platform: string;
    tone?: string;
    length?: string;
    targetAudience?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
  }): Promise<{
    title: string;
    content: string;
    hashtags: string[];
    suggestions: string[];
  }> {
    try {
      const response = await api.post<ApiResponse<{
        title: string;
        content: string;
        hashtags: string[];
        suggestions: string[];
      }>>(
        `${MISTRAL_ENDPOINTS.GENERATE}/post`,
        options
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Build prompt based on generation request
  private buildPrompt(request: MistralGenerationRequest): string {
    const { type, content, options = {} } = request;
    const { tone = 'professional', length = 'medium', style, targetAudience } = options;

    switch (type) {
      case 'post':
        return `Crée un post pour les réseaux sociaux basé sur ce contenu : ${content}
        Ton: ${tone}
        Longueur: ${length}
        ${style ? `Style: ${style}` : ''}
        ${targetAudience ? `Public cible: ${targetAudience}` : ''}
        Formate le résultat comme un post engageant.`;

      case 'translation':
        return `Traduis ce texte en français: ${content}
        Conserve le ton et le sens original.`;

      case 'correction':
        return `Corrige les fautes d'orthographe et de grammaire dans ce texte: ${content}
        Améliore également la clarté et la fluidité.`;

      case 'optimization':
        return `Optimise ce texte pour les réseaux sociaux: ${content}
        Ton: ${tone}
        Longueur: ${length}
        ${targetAudience ? `Public cible: ${targetAudience}` : ''}
        Rends-le plus engageant possible.`;

      default:
        return content;
    }
  },

  // Check if Mistral Vibe is configured
  isConfigured(): boolean {
    return !!import.meta.env.VITE_MISTRAL_VIBE_API_KEY;
  },
};

export default mistralService;
