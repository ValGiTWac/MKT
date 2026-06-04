import api, { handleApiResponse } from './api';
import { AsanaTask, ApiResponse } from '@/types';

const ASANA_ENDPOINT = '/asana';

export interface CreateAsanaTaskRequest {
  name: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  projectId?: string;
  postId?: string; // Reference to WHISE post
}

export interface AsanaStatusResponse {
  active: boolean;
  connected: boolean;
  workspaceId?: string;
  userId?: string;
}

export interface AsanaProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AsanaUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const asanaService = {
  // Connect Asana account
  connectAsana: async (): Promise<{ url: string }> => {
    return handleApiResponse<{ url: string }>(api.get(`${ASANA_ENDPOINT}/connect`));
  },

  // Disconnect Asana account
  disconnectAsana: async (): Promise<void> => {
    return handleApiResponse<void>(api.post(`${ASANA_ENDPOINT}/disconnect`));
  },

  // Check Asana connection status
  checkStatus: async (): Promise<AsanaStatusResponse> => {
    return handleApiResponse<AsanaStatusResponse>(api.get(`${ASANA_ENDPOINT}/status`));
  },

  // Get Asana projects
  getProjects: async (): Promise<AsanaProject[]> => {
    return handleApiResponse<AsanaProject[]>(api.get(`${ASANA_ENDPOINT}/projects`));
  },

  // Get Asana users
  getUsers: async (): Promise<AsanaUser[]> => {
    return handleApiResponse<AsanaUser[]>(api.get(`${ASANA_ENDPOINT}/users`));
  },

  // Create a new task in Asana
  createTask: async (request: CreateAsanaTaskRequest): Promise<AsanaTask> => {
    return handleApiResponse<AsanaTask>(api.post(`${ASANA_ENDPOINT}/tasks`, request));
  },

  // Get task by ID
  getTaskById: async (taskId: string): Promise<AsanaTask> => {
    return handleApiResponse<AsanaTask>(api.get(`${ASANA_ENDPOINT}/tasks/${taskId}`));
  },

  // Update task
  updateTask: async (taskId: string, data: Partial<CreateAsanaTaskRequest>): Promise<AsanaTask> => {
    return handleApiResponse<AsanaTask>(api.put(`${ASANA_ENDPOINT}/tasks/${taskId}`, data));
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<void> => {
    return handleApiResponse<void>(api.delete(`${ASANA_ENDPOINT}/tasks/${taskId}`));
  },

  // Get tasks by project
  getTasksByProject: async (projectId: string): Promise<AsanaTask[]> => {
    return handleApiResponse<AsanaTask[]>(api.get(`${ASANA_ENDPOINT}/projects/${projectId}/tasks`));
  },

  // Get tasks by post (WHISE integration)
  getTasksByPost: async (postId: string): Promise<AsanaTask[]> => {
    return handleApiResponse<AsanaTask[]>(api.get(`${ASANA_ENDPOINT}/posts/${postId}/tasks`));
  },

  // Create task from WHISE post
  createTaskFromPost: async (postId: string, projectId?: string): Promise<AsanaTask> => {
    return handleApiResponse<AsanaTask>(
      api.post(`${ASANA_ENDPOINT}/posts/${postId}/tasks`, { projectId })
    );
  },

  // Complete task
  completeTask: async (taskId: string): Promise<AsanaTask> => {
    return handleApiResponse<AsanaTask>(api.put(`${ASANA_ENDPOINT}/tasks/${taskId}/complete`));
  },

  // Get Asana analytics
  getAnalytics: async (days: number = 30): Promise<{
    totalTasks: number;
    completedTasks: number;
    byProject: Record<string, { tasks: number; completed: number }>;
  }> => {
    return handleApiResponse<{
      totalTasks: number;
      completedTasks: number;
      byProject: Record<string, { tasks: number; completed: number }>;
    }>(api.get(`${ASANA_ENDPOINT}/analytics?days=${days}`));
  },
};
