import api, { handleApiResponse } from './api';
import { BufferPost, SocialPlatform, ApiResponse, Post } from '@/types';

const BUFFER_ENDPOINT = '/buffer';

export interface ScheduleBufferPostRequest {
  postId: string;
  platform: SocialPlatform;
  scheduledAt: string;
  text?: string; // Optional override for the text
  media?: string[]; // Optional media URLs
}

export interface BufferStatusResponse {
  active: boolean;
  connected: boolean;
  profiles?: {
    id: string;
    platform: SocialPlatform;
    name: string;
    avatar?: string;
  }[];
}

export const bufferService = {
  // Connect Buffer account
  connectBuffer: async (): Promise<{ url: string }> => {
    return handleApiResponse<{ url: string }>(api.get(`${BUFFER_ENDPOINT}/connect`));
  },

  // Disconnect Buffer account
  disconnectBuffer: async (): Promise<void> => {
    return handleApiResponse<void>(api.post(`${BUFFER_ENDPOINT}/disconnect`));
  },

  // Check Buffer connection status
  checkStatus: async (): Promise<BufferStatusResponse> => {
    return handleApiResponse<BufferStatusResponse>(api.get(`${BUFFER_ENDPOINT}/status`));
  },

  // Get available social media profiles
  getProfiles: async (): Promise<BufferStatusResponse['profiles']> => {
    return handleApiResponse<BufferStatusResponse['profiles']>(
      api.get(`${BUFFER_ENDPOINT}/profiles`)
    );
  },

  // Schedule a post to Buffer
  schedulePost: async (request: ScheduleBufferPostRequest): Promise<BufferPost> => {
    return handleApiResponse<BufferPost>(api.post(`${BUFFER_ENDPOINT}/schedule`, request));
  },

  // Publish a post immediately to Buffer
  publishPost: async (request: Omit<ScheduleBufferPostRequest, 'scheduledAt'>): Promise<BufferPost> => {
    return handleApiResponse<BufferPost>(api.post(`${BUFFER_ENDPOINT}/publish`, request));
  },

  // Get scheduled posts from Buffer
  getScheduledPosts: async (): Promise<BufferPost[]> => {
    return handleApiResponse<BufferPost[]>(api.get(`${BUFFER_ENDPOINT}/scheduled`));
  },

  // Get post history from Buffer
  getPostHistory: async (limit: number = 10): Promise<BufferPost[]> => {
    return handleApiResponse<BufferPost[]>(api.get(`${BUFFER_ENDPOINT}/history?limit=${limit}`));
  },

  // Delete a scheduled post from Buffer
  deleteScheduledPost: async (bufferPostId: string): Promise<void> => {
    return handleApiResponse<void>(api.delete(`${BUFFER_ENDPOINT}/scheduled/${bufferPostId}`));
  },

  // Publish a WHISE post to Buffer
  publishWhisePost: async (postId: string, platforms: SocialPlatform[]): Promise<BufferPost[]> => {
    return handleApiResponse<BufferPost[]>(
      api.post(`${BUFFER_ENDPOINT}/publish-whise`, { postId, platforms })
    );
  },

  // Get Buffer analytics
  getAnalytics: async (days: number = 30): Promise<{
    totalPosts: number;
    engagement: number;
    reach: number;
    byPlatform: Record<SocialPlatform, { posts: number; engagement: number }>;
  }> => {
    return handleApiResponse<{
      totalPosts: number;
      engagement: number;
      reach: number;
      byPlatform: Record<SocialPlatform, { posts: number; engagement: number }>;
    }>(api.get(`${BUFFER_ENDPOINT}/analytics?days=${days}`));
  },
};
