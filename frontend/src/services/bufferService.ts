import api, { handleApiError } from './api';
import {
  BufferProfile,
  BufferPost,
  BufferPublishRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const BUFFER_ENDPOINTS = {
  PUBLISH: '/buffer/publish',
  SCHEDULE: '/buffer/schedule',
  GET_PROFILES: '/buffer/profiles',
  GET_POSTS: '/buffer/posts',
  GET_POST: '/buffer/posts/:id',
  UPDATE_POST: '/buffer/posts/:id',
  DELETE_POST: '/buffer/posts/:id',
  WEBHOOK: '/buffer/webhook',
  ANALYTICS: '/buffer/analytics',
};

export const bufferService = {
  // Publish post to Buffer
  async publish(data: BufferPublishRequest): Promise<BufferPost> {
    try {
      const response = await api.post<ApiResponse<BufferPost>>(
        BUFFER_ENDPOINTS.PUBLISH,
        data
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Schedule post in Buffer
  async schedule(data: BufferPublishRequest): Promise<BufferPost> {
    try {
      const response = await api.post<ApiResponse<BufferPost>>(
        BUFFER_ENDPOINTS.SCHEDULE,
        data
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all Buffer profiles
  async getProfiles(): Promise<BufferProfile[]> {
    try {
      const response = await api.get<ApiResponse<BufferProfile[]>>(
        BUFFER_ENDPOINTS.GET_PROFILES
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all Buffer posts
  async getPosts(postId?: string): Promise<PaginatedResponse<BufferPost>> {
    try {
      const params: Record<string, unknown> = {};
      if (postId) {
        params.postId = postId;
      }

      const response = await api.get<PaginatedResponse<BufferPost>>(
        BUFFER_ENDPOINTS.GET_POSTS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single Buffer post
  async getPost(id: string): Promise<BufferPost> {
    try {
      const response = await api.get<ApiResponse<BufferPost>>(
        BUFFER_ENDPOINTS.GET_POST.replace(':id', id)
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update Buffer post
  async updatePost(id: string, data: Partial<BufferPost>): Promise<BufferPost> {
    try {
      const response = await api.put<ApiResponse<BufferPost>>(
        BUFFER_ENDPOINTS.UPDATE_POST.replace(':id', id),
        data
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Delete Buffer post
  async deletePost(id: string): Promise<void> {
    try {
      await api.delete(BUFFER_ENDPOINTS.DELETE_POST.replace(':id', id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Setup Buffer webhook
  async setupWebhook(url: string): Promise<{ id: string; url: string }> {
    try {
      const response = await api.post<ApiResponse<{ id: string; url: string }>>(
        BUFFER_ENDPOINTS.WEBHOOK,
        { url }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get Buffer analytics
  async getAnalytics(
    profileId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    impressions: number;
    engagements: number;
    clicks: number;
    followersGained: number;
    postsPublished: number;
  }> {
    try {
      const params: Record<string, string> = { profileId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get<ApiResponse<{
        impressions: number;
        engagements: number;
        clicks: number;
        followersGained: number;
        postsPublished: number;
      }>>(
        BUFFER_ENDPOINTS.ANALYTICS,
        { params }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Check if Buffer is connected
  async isConnected(): Promise<boolean> {
    try {
      await api.get(BUFFER_ENDPOINTS.GET_PROFILES);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Connect Buffer account
  async connect(): Promise<{ success: boolean; message: string }> {
    try {
      // This would typically redirect to Buffer OAuth
      return {
        success: true,
        message: 'Buffer connection initiated. Please complete the OAuth flow.',
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Publish post immediately
  async publishNow(postId: string, profileIds: string[]): Promise<BufferPost> {
    try {
      const response = await api.post<ApiResponse<BufferPost>>(
        BUFFER_ENDPOINTS.PUBLISH,
        {
          postId,
          profileIds,
          publishNow: true,
        }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get publishing queue
  async getQueue(): Promise<BufferPost[]> {
    try {
      const response = await api.get<ApiResponse<BufferPost[]>>(
        `${BUFFER_ENDPOINTS.GET_POSTS}/queue`
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default bufferService;
