import api, { handleApiError } from './api';
import { AsanaTask, AsanaSyncRequest, ApiResponse, PaginatedResponse } from '@/types';

const ASANA_ENDPOINTS = {
  SYNC_POST: '/asana/sync-post',
  GET_TASKS: '/asana/tasks',
  GET_TASK: '/asana/tasks/:id',
  UPDATE_TASK: '/asana/tasks/:id',
  CREATE_PROJECT: '/asana/projects',
  GET_PROJECTS: '/asana/projects',
  GET_USERS: '/asana/users',
  WEBHOOK: '/asana/webhook',
};

export const asanaService = {
  // Sync post with Asana
  async syncPost(data: AsanaSyncRequest): Promise<AsanaTask> {
    try {
      const response = await api.post<ApiResponse<AsanaTask>>(
        ASANA_ENDPOINTS.SYNC_POST,
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all Asana tasks
  async getTasks(postId?: string): Promise<PaginatedResponse<AsanaTask>> {
    try {
      const params: Record<string, unknown> = {};
      if (postId) {
        params.postId = postId;
      }

      const response = await api.get<PaginatedResponse<AsanaTask>>(
        ASANA_ENDPOINTS.GET_TASKS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single task
  async getTask(id: string): Promise<AsanaTask> {
    try {
      const response = await api.get<ApiResponse<AsanaTask>>(
        ASANA_ENDPOINTS.GET_TASK.replace(':id', id)
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update task
  async updateTask(id: string, data: Partial<AsanaTask>): Promise<AsanaTask> {
    try {
      const response = await api.put<ApiResponse<AsanaTask>>(
        ASANA_ENDPOINTS.UPDATE_TASK.replace(':id', id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create Asana project
  async createProject(name: string, description?: string): Promise<{
    id: string;
    name: string;
    description?: string;
  }> {
    try {
      const response = await api.post<ApiResponse<{
        id: string;
        name: string;
        description?: string;
      }>>(
        ASANA_ENDPOINTS.CREATE_PROJECT,
        { name, description }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all Asana projects
  async getProjects(): Promise<{
    id: string;
    name: string;
    description?: string;
  }[]> {
    try {
      const response = await api.get<ApiResponse<{
        id: string;
        name: string;
        description?: string;
      }[]>>(
        ASANA_ENDPOINTS.GET_PROJECTS
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get Asana users
  async getUsers(): Promise<{
    id: string;
    name: string;
    email: string;
  }[]> {
    try {
      const response = await api.get<ApiResponse<{
        id: string;
        name: string;
        email: string;
      }[]>>(
        ASANA_ENDPOINTS.GET_USERS
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Setup Asana webhook
  async setupWebhook(url: string): Promise<{ id: string; url: string }> {
    try {
      const response = await api.post<ApiResponse<{ id: string; url: string }>>(
        ASANA_ENDPOINTS.WEBHOOK,
        { url }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Check if Asana is connected
  async isConnected(): Promise<boolean> {
    try {
      await api.get(ASANA_ENDPOINTS.GET_PROJECTS);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Connect Asana account
  async connect(): Promise<{ success: boolean; message: string }> {
    try {
      // This would typically redirect to Asana OAuth
      // For now, we'll just return a success message
      return {
        success: true,
        message: 'Asana connection initiated. Please complete the OAuth flow.',
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default asanaService;
