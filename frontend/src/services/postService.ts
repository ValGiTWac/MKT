import api, { handleApiError } from './api';
import {
  Post,
  PostCreateInput,
  PostUpdateInput,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from '@/types';

const POST_ENDPOINTS = {
  GET_ALL: '/posts',
  GET_BY_ID: '/posts/:id',
  CREATE: '/posts',
  UPDATE: '/posts/:id',
  DELETE: '/posts/:id',
  SEARCH: '/posts/search',
  STATS: '/posts/stats',
  EXPORT: '/posts/export',
  BULK_DELETE: '/posts/bulk-delete',
};

export const postService = {
  // Get all posts with pagination and filters
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Post>> {
    try {
      const response = await api.get<PaginatedResponse<Post>>(
        POST_ENDPOINTS.GET_ALL,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single post by ID
  async getById(id: string): Promise<Post> {
    try {
      const response = await api.get<ApiResponse<Post>>(
        POST_ENDPOINTS.GET_BY_ID.replace(':id', id)
      );
      if (!response.data.data) {
        throw new Error('Post not found');
      }
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create new post
  async create(data: PostCreateInput): Promise<Post> {
    try {
      const response = await api.post<ApiResponse<Post>>(
        POST_ENDPOINTS.CREATE,
        data
      );
      if (!response.data.data) {
        throw new Error('Failed to create post');
      }
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update post
  async update(id: string, data: PostUpdateInput): Promise<Post> {
    try {
      const response = await api.put<ApiResponse<Post>>(
        POST_ENDPOINTS.UPDATE.replace(':id', id),
        data
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Delete post
  async delete(id: string): Promise<void> {
    try {
      await api.delete(POST_ENDPOINTS.DELETE.replace(':id', id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Bulk delete posts
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await api.post(POST_ENDPOINTS.BULK_DELETE, { ids });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Search posts
  async search(query: string, params?: QueryParams): Promise<PaginatedResponse<Post>> {
    try {
      const response = await api.get<PaginatedResponse<Post>>(
        POST_ENDPOINTS.SEARCH,
        { 
          params: { 
            q: query,
            ...params 
          } 
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get post statistics
  async getStats(): Promise<Record<string, unknown>> {
    try {
      const response = await api.get<ApiResponse<Record<string, unknown>>>(
        POST_ENDPOINTS.STATS
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Export posts
  async export(format: 'csv' | 'json' | 'xlsx'): Promise<Blob> {
    try {
      const response = await api.get(POST_ENDPOINTS.EXPORT, {
        params: { format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update post status
  async updateStatus(id: string, status: string): Promise<Post> {
    try {
      const response = await api.patch<ApiResponse<Post>>(
        `${POST_ENDPOINTS.UPDATE.replace(':id', id)}/status`,
        { status }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Duplicate post
  async duplicate(id: string): Promise<Post> {
    try {
      const response = await api.post<ApiResponse<Post>>(
        `${POST_ENDPOINTS.CREATE}/duplicate`,
        { postId: id }
      );
      if (!response.data.data) { throw new Error("Data not found"); } return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default postService;
