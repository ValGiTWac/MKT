import api, { handleApiResponse } from './api';
import { Post, PaginatedResponse, ApiResponse, SocialPlatform } from '@/types';

const POST_ENDPOINT = '/posts';

export interface CreatePostData {
  title: string;
  content: string;
  platforms: SocialPlatform[];
  scheduledAt?: string;
  tags?: string[];
  images?: string[];
}

export interface UpdatePostData extends Partial<CreatePostData> {
  status?: string;
}

export const postService = {
  // Get all posts with pagination
  getAllPosts: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Post>> => {
    return handleApiResponse<PaginatedResponse<Post>>(
      api.get(`${POST_ENDPOINT}?page=${page}&limit=${limit}`)
    );
  },

  // Get single post
  getPostById: async (id: string): Promise<Post> => {
    return handleApiResponse<Post>(api.get(`${POST_ENDPOINT}/${id}`));
  },

  // Create new post
  createPost: async (data: CreatePostData): Promise<Post> => {
    return handleApiResponse<Post>(api.post(POST_ENDPOINT, data));
  },

  // Update post
  updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
    return handleApiResponse<Post>(api.put(`${POST_ENDPOINT}/${id}`, data));
  },

  // Delete post
  deletePost: async (id: string): Promise<void> => {
    return handleApiResponse<void>(api.delete(`${POST_ENDPOINT}/${id}`));
  },

  // Get posts by status
  getPostsByStatus: async (status: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Post>> => {
    return handleApiResponse<PaginatedResponse<Post>>(
      api.get(`${POST_ENDPOINT}?status=${status}&page=${page}&limit=${limit}`)
    );
  },

  // Get posts by author
  getPostsByAuthor: async (authorId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Post>> => {
    return handleApiResponse<PaginatedResponse<Post>>(
      api.get(`${POST_ENDPOINT}?authorId=${authorId}&page=${page}&limit=${limit}`)
    );
  },

  // Search posts
  searchPosts: async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Post>> => {
    return handleApiResponse<PaginatedResponse<Post>>(
      api.get(`${POST_ENDPOINT}?search=${query}&page=${page}&limit=${limit}`)
    );
  },

  // Approve post (manager/admin only)
  approvePost: async (id: string): Promise<Post> => {
    return handleApiResponse<Post>(api.put(`${POST_ENDPOINT}/${id}/approve`));
  },

  // Reject post (manager/admin only)
  rejectPost: async (id: string, reason?: string): Promise<Post> => {
    return handleApiResponse<Post>(api.put(`${POST_ENDPOINT}/${id}/reject`, { reason }));
  },

  // Schedule post
  schedulePost: async (id: string, scheduledAt: string): Promise<Post> => {
    return handleApiResponse<Post>(api.put(`${POST_ENDPOINT}/${id}/schedule`, { scheduledAt }));
  },

  // Publish post immediately
  publishPost: async (id: string): Promise<Post> => {
    return handleApiResponse<Post>(api.put(`${POST_ENDPOINT}/${id}/publish`));
  },
};
