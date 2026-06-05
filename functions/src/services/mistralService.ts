import axios from 'axios';
import { createError } from '../middleware/errorHandler';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1';

// Mistral Vibe MCP Configuration
const MISTRAL_VIBE_MCP_URL = process.env.MISTRAL_VIBE_MCP_URL || 'http://localhost:3000/mcp';

interface MistralGenerationRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

interface MistralGenerationResponse {
  id: string;
  choices: {
    text: string;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MistralTranslationRequest {
  text: string;
  target_language: string;
  source_language?: string;
}

interface MistralTranslationResponse {
  translated_text: string;
  detected_language?: string;
}

// Buffer types for MCP integration
interface BufferPost {
  text: string;
  mediaUrls?: string[];
  platform?: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok';
}

interface BufferProfile {
  id: string;
  platform: string;
  platformUsername: string;
  avatar: string;
}

interface BufferPublishRequest {
  post: BufferPost;
  profileId?: string;
  scheduleAt?: string;
}

interface BufferPublishResponse {
  success: boolean;
  postId: string;
  scheduledAt?: string;
  publishedAt?: string;
  message?: string;
}

// Asana types for MCP integration
interface AsanaTask {
  title: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
}

interface AsanaProject {
  id: string;
  name: string;
  description?: string;
}

interface AsanaCreateTaskRequest {
  task: AsanaTask;
  projectId?: string;
}

interface AsanaCreateTaskResponse {
  success: boolean;
  taskId: string;
  task: AsanaTask;
}

export const mistralService = {
  // Check if Mistral integration is active
  checkIntegration: async () => {
    if (!MISTRAL_API_KEY) {
      return { active: false, model: null };
    }
    
    try {
      // Test the API key with a simple request
      const response = await axios.get(`${MISTRAL_API_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      return {
        active: true,
        model: response.data.data?.[0]?.id || 'mistral-tiny',
      };
    } catch (error) {
      console.error('Mistral API test failed:', error);
      return { active: false, model: null };
    }
  },

  // Generate content using Mistral Vibe
  generateContent: async (request: MistralGenerationRequest): Promise<MistralGenerationResponse> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: request.model || 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          max_tokens: request.max_tokens || 500,
          temperature: request.temperature || 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        choices: [
          {
            text: response.data.choices?.[0]?.message?.content || '',
            finish_reason: response.data.choices?.[0]?.finish_reason || 'stop',
          },
        ],
        usage: response.data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error) {
      console.error('Mistral generation error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to generate content',
          error.response?.status || 500
        );
      }
      throw createError('Failed to generate content', 500);
    }
  },

  // Translate content
  translateContent: async (request: MistralTranslationRequest): Promise<MistralTranslationResponse> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const prompt = `Translate the following text to ${request.target_language}:

${request.text}

Translation:`;

      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const translatedText = response.data.choices?.[0]?.message?.content || '';
      
      return {
        translated_text: translatedText.replace(/^\n*/, '').replace(/\n*$/, ''),
        detected_language: request.source_language,
      };
    } catch (error) {
      console.error('Mistral translation error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to translate content',
          error.response?.status || 500
        );
      }
      throw createError('Failed to translate content', 500);
    }
  },

  // Optimize content for social media
  optimizeContent: async (content: string, targetAudience?: string, tone?: string) => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const prompt = `Optimize the following content for social media. 
      ${targetAudience ? `Target audience: ${targetAudience}.` : ''}
      ${tone ? `Tone: ${tone}.` : ''}
      
      Content to optimize:
      ${content}
      
      Provide an optimized version with suggestions for improvement.`;

      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices?.[0]?.message?.content || '';
      
      // Parse the response (simple parsing for demo)
      const lines = result.split('\n').filter((line: string) => line.trim());
      const optimizedContent = lines[0] || content;
      const suggestions = lines.slice(1) || [];

      return {
        optimizedContent,
        suggestions,
        metadata: {
          originalLength: content.length,
          optimizedLength: optimizedContent.length,
          readabilityImprovement: Math.max(0, content.length - optimizedContent.length) / content.length * 100,
        },
      };
    } catch (error) {
      console.error('Mistral optimization error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to optimize content',
          error.response?.status || 500
        );
      }
      throw createError('Failed to optimize content', 500);
    }
  },

  // Correct grammar and spelling
  correctGrammar: async (text: string, language: string = 'fr') => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const prompt = `Correct the grammar and spelling in the following ${language} text:

${text}

Corrected text:`;

      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const correctedText = response.data.choices?.[0]?.message?.content || text;
      
      return {
        correctedText: correctedText.replace(/^\n*/, '').replace(/\n*$/, ''),
        corrections: [], // Would need more sophisticated parsing
      };
    } catch (error) {
      console.error('Mistral grammar correction error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to correct grammar',
          error.response?.status || 500
        );
      }
      throw createError('Failed to correct grammar', 500);
    }
  },

  // Generate post ideas
  generatePostIdeas: async (topic: string, count: number = 5) => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const prompt = `Generate ${count} creative post ideas about: ${topic}

Return each idea on a new line, numbered.`;

      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.8,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices?.[0]?.message?.content || '';
      const lines = result.split('\n').filter((line: string) => line.trim());
      
      // Extract ideas (remove numbering)
      const ideas = lines.map((line: string) => line.replace(/^\d+\./, '').trim());
      
      return ideas.slice(0, count);
    } catch (error) {
      console.error('Mistral ideas generation error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to generate ideas',
          error.response?.status || 500
        );
      }
      throw createError('Failed to generate ideas', 500);
    }
  },

  // Generate hashtags
  generateHashtags: async (content: string, count: number = 5) => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const prompt = `Generate ${count} relevant hashtags for the following content:

${content}

Return only the hashtags, one per line, without any other text.`;

      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices?.[0]?.message?.content || '';
      const lines = result.split('\n').filter((line: string) => line.trim());
      
      // Extract hashtags
      const hashtags = lines
        .map((line: string) => line.trim())
        .filter((line: string) => line.startsWith('#'))
        .slice(0, count);
      
      return hashtags;
    } catch (error) {
      console.error('Mistral hashtags generation error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to generate hashtags',
          error.response?.status || 500
        );
      }
      throw createError('Failed to generate hashtags', 500);
    }
  },

  // Analyze content sentiment
  analyzeSentiment: async (text: string) => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const prompt = `Analyze the sentiment of the following text and return:
      - sentiment: positive, negative, or neutral
      - score: -1 to 1 (negative to positive)
      - confidence: 0 to 1

      Text: ${text}

      Return only in JSON format: { "sentiment": "", "score": 0, "confidence": 0 }`;

      const response = await axios.post(
        `${MISTRAL_API_URL}/chat/completions`,
        {
          model: 'mistral-tiny',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices?.[0]?.message?.content || '';
      
      // Parse JSON from response
      try {
        const jsonMatch = result.match(/\{[^}]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback
      }

      // Default fallback
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.5,
      };
    } catch (error) {
      console.error('Mistral sentiment analysis error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to analyze sentiment',
          error.response?.status || 500
        );
      }
      throw createError('Failed to analyze sentiment', 500);
    }
  },

  // ==================== Buffer Integration via Mistral Vibe MCP ====================

  /**
   * Get all Buffer profiles connected via Mistral Vibe MCP
   * Mistral Vibe acts as the proxy to Buffer via MCP
   */
  getBufferProfiles: async (): Promise<{ profiles: BufferProfile[] }> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      // Call Mistral Vibe MCP endpoint for Buffer profiles
      const response = await axios.get(`${MISTRAL_VIBE_MCP_URL}/buffer/profiles`, {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        profiles: response.data.profiles || [],
      };
    } catch (error) {
      console.error('Mistral Vibe Buffer profiles error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to get Buffer profiles',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get Buffer profiles', 500);
    }
  },

  /**
   * Publish a post to Buffer via Mistral Vibe MCP
   * Mistral Vibe handles the OAuth and API calls to Buffer
   */
  publishToBuffer: async (request: BufferPublishRequest): Promise<BufferPublishResponse> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        `${MISTRAL_VIBE_MCP_URL}/buffer/publish`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        postId: response.data.id || response.data.postId,
        publishedAt: response.data.publishedAt,
        message: 'Post published successfully via Mistral Vibe MCP',
      };
    } catch (error) {
      console.error('Mistral Vibe Buffer publish error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to publish to Buffer',
          error.response?.status || 500
        );
      }
      throw createError('Failed to publish to Buffer', 500);
    }
  },

  /**
   * Schedule a post to Buffer via Mistral Vibe MCP
   */
  scheduleBufferPost: async (request: BufferPublishRequest): Promise<BufferPublishResponse> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        `${MISTRAL_VIBE_MCP_URL}/buffer/schedule`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        postId: response.data.id || response.data.postId,
        scheduledAt: request.scheduleAt,
        message: 'Post scheduled successfully via Mistral Vibe MCP',
      };
    } catch (error) {
      console.error('Mistral Vibe Buffer schedule error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to schedule Buffer post',
          error.response?.status || 500
        );
      }
      throw createError('Failed to schedule Buffer post', 500);
    }
  },

  // ==================== Asana Integration via Mistral Vibe MCP ====================

  /**
   * Get all Asana projects connected via Mistral Vibe MCP
   * Mistral Vibe acts as the proxy to Asana via MCP
   */
  getAsanaProjects: async (): Promise<{ projects: AsanaProject[] }> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      // Call Mistral Vibe MCP endpoint for Asana projects
      const response = await axios.get(`${MISTRAL_VIBE_MCP_URL}/asana/projects`, {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        projects: response.data.projects || [],
      };
    } catch (error) {
      console.error('Mistral Vibe Asana projects error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to get Asana projects',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get Asana projects', 500);
    }
  },

  /**
   * Create a task in Asana via Mistral Vibe MCP
   * Mistral Vibe handles the OAuth and API calls to Asana
   */
  createAsanaTask: async (request: AsanaCreateTaskRequest): Promise<AsanaCreateTaskResponse> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        `${MISTRAL_VIBE_MCP_URL}/asana/task`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        taskId: response.data.id || response.data.taskId,
        task: response.data.task || request.task,
      };
    } catch (error) {
      console.error('Mistral Vibe Asana task creation error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to create Asana task',
          error.response?.status || 500
        );
      }
      throw createError('Failed to create Asana task', 500);
    }
  },

  /**
   * Create a task from a post in Asana via Mistral Vibe MCP
   * This automatically extracts post data and creates a task
   */
  createAsanaTaskFromPost: async (postId: string, projectId?: string): Promise<AsanaCreateTaskResponse> => {
    if (!MISTRAL_API_KEY) {
      throw createError('Mistral Vibe integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        `${MISTRAL_VIBE_MCP_URL}/asana/task-from-post`,
        { postId, projectId },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        taskId: response.data.id || response.data.taskId,
        task: response.data.task,
      };
    } catch (error) {
      console.error('Mistral Vibe Asana task from post error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to create Asana task from post',
          error.response?.status || 500
        );
      }
      throw createError('Failed to create Asana task from post', 500);
    }
  },
};
