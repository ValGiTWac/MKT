import axios from 'axios';
import Integration from '../models/Integration';
import { createError } from '../middleware/errorHandler';

const ASANA_CLIENT_ID = process.env.ASANA_CLIENT_ID;
const ASANA_CLIENT_SECRET = process.env.ASANA_CLIENT_SECRET;
const ASANA_REDIRECT_URI = process.env.ASANA_REDIRECT_URI || 'https://whise-mkt.netlify.app/api/asana/callback';

interface AsanaProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface AsanaUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AsanaTask {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export const asanaService = {
  // Check if Asana integration is active
  checkStatus: async (userId: string) => {
    try {
      const integration = await Integration.findOne({ type: 'asana', userId });
      return {
        active: !!ASANA_CLIENT_ID,
        connected: !!integration,
        workspaceId: integration?.metadata?.workspaceId as string | undefined,
        userId: integration?.metadata?.userId as string | undefined,
      };
    } catch (error) {
      console.error('Asana status check error:', error);
      return { active: !!ASANA_CLIENT_ID, connected: false };
    }
  },

  // Get Asana OAuth URL for connection
  getOAuthUrl: async () => {
    if (!ASANA_CLIENT_ID) {
      throw createError('Asana integration is not configured', 500);
    }

    const params = new URLSearchParams({
      client_id: ASANA_CLIENT_ID,
      redirect_uri: ASANA_REDIRECT_URI,
      response_type: 'code',
      scope: 'default',
      state: Math.random().toString(36).substring(2),
    });

    return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
  },

  // Exchange code for access token
  exchangeCodeForToken: async (code: string, userId: string) => {
    if (!ASANA_CLIENT_ID || !ASANA_CLIENT_SECRET) {
      throw createError('Asana integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        'https://app.asana.com/-/oauth_token',
        new URLSearchParams({
          client_id: ASANA_CLIENT_ID,
          client_secret: ASANA_CLIENT_SECRET,
          redirect_uri: ASANA_REDIRECT_URI,
          grant_type: 'authorization_code',
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in, data } = response.data;

      // Save integration
      await Integration.findOneAndUpdate(
        { type: 'asana', userId },
        {
          type: 'asana',
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          userId,
          metadata: {
            workspaceId: data?.workspace_id,
            userId: data?.user_id,
          },
        },
        { upsert: true, new: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Asana token exchange error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to exchange code for token',
          error.response?.status || 500
        );
      }
      throw createError('Failed to exchange code for token', 500);
    }
  },

  // Disconnect Asana
  disconnect: async (userId: string) => {
    await Integration.findOneAndDelete({ type: 'asana', userId });
    return { success: true };
  },

  // Get Asana API client
  getApiClient: async (userId: string) => {
    const integration = await Integration.findOne({ type: 'asana', userId });
    
    if (!integration) {
      throw createError('Asana is not connected', 400);
    }

    return {
      accessToken: integration.accessToken,
      workspaceId: integration.metadata?.workspaceId as string,
    };
  },

  // Get Asana projects
  getProjects: async (userId: string): Promise<AsanaProject[]> => {
    const { accessToken, workspaceId } = await asanaService.getApiClient(userId);

    try {
      const response = await axios.get(
        `https://app.asana.com/api/1.0/workspaces/${workspaceId}/projects`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data.map((project: unknown) => {
        const p = project as {
          gid: string;
          name: string;
          notes: string;
          created_at: string;
          modified_at: string;
        };
        return {
          id: p.gid,
          name: p.name,
          description: p.notes,
          createdAt: p.created_at,
          updatedAt: p.modified_at,
        };
      });
    } catch (error) {
      console.error('Asana get projects error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token might be expired, but Asana tokens are long-lived
          throw createError('Asana token expired', 401);
        }
        throw createError(
          error.response?.data?.message || 'Failed to get projects',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get projects', 500);
    }
  },

  // Get Asana users
  getUsers: async (userId: string): Promise<AsanaUser[]> => {
    const { accessToken, workspaceId } = await asanaService.getApiClient(userId);

    try {
      const response = await axios.get(
        `https://app.asana.com/api/1.0/workspaces/${workspaceId}/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data.map((user: unknown) => {
        const u = user as {
          gid: string;
          name: string;
          email: string;
          photo: { image_128x128: string };
        };
        return {
          id: u.gid,
          name: u.name,
          email: u.email,
          avatar: u.photo?.image_128x128,
        };
      });
    } catch (error) {
      console.error('Asana get users error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to get users',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get users', 500);
    }
  },

  // Create a new task in Asana
  createTask: async (
    userId: string,
    taskData: {
      name: string;
      description?: string;
      assignee?: string;
      dueDate?: string;
      projectId?: string;
      postId?: string;
    }
  ): Promise<AsanaTask> => {
    const { accessToken, workspaceId } = await asanaService.getApiClient(userId);

    try {
      const payload: Record<string, unknown> = {
        data: {
          name: taskData.name,
          workspace: workspaceId,
        },
      };

      if (taskData.description) {
        payload.data.notes = taskData.description;
      }

      if (taskData.assignee) {
        payload.data.assignee = taskData.assignee;
      }

      if (taskData.dueDate) {
        payload.data.due_on = taskData.dueDate;
      }

      if (taskData.projectId) {
        payload.data.projects = [taskData.projectId];
      }

      // Add custom field for WHISE post reference
      if (taskData.postId) {
        payload.data.custom_fields = {
          '123456789': taskData.postId, // This would be a custom field ID in Asana
        };
      }

      const response = await axios.post(
        'https://app.asana.com/api/1.0/tasks',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const task = response.data.data as {
        gid: string;
        name: string;
        notes: string;
        assignee: { gid: string };
        due_on: string;
        completed: boolean;
        projects: { gid: string }[];
        created_at: string;
        modified_at: string;
      };

      return {
        id: task.gid,
        name: task.name,
        description: task.notes,
        assignee: task.assignee?.gid,
        dueDate: task.due_on,
        status: task.completed ? 'done' : 'todo',
        projectId: task.projects?.[0]?.gid,
        createdAt: task.created_at,
        updatedAt: task.modified_at,
      };
    } catch (error) {
      console.error('Asana create task error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to create task',
          error.response?.status || 500
        );
      }
      throw createError('Failed to create task', 500);
    }
  },

  // Get task by ID
  getTaskById: async (userId: string, taskId: string): Promise<AsanaTask> => {
    const { accessToken } = await asanaService.getApiClient(userId);

    try {
      const response = await axios.get(
        `https://app.asana.com/api/1.0/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const task = response.data.data as {
        gid: string;
        name: string;
        notes: string;
        assignee: { gid: string };
        due_on: string;
        completed: boolean;
        projects: { gid: string }[];
        created_at: string;
        modified_at: string;
      };

      return {
        id: task.gid,
        name: task.name,
        description: task.notes,
        assignee: task.assignee?.gid,
        dueDate: task.due_on,
        status: task.completed ? 'done' : 'todo',
        projectId: task.projects?.[0]?.gid,
        createdAt: task.created_at,
        updatedAt: task.modified_at,
      };
    } catch (error) {
      console.error('Asana get task error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to get task',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get task', 500);
    }
  },

  // Update task
  updateTask: async (
    userId: string,
    taskId: string,
    updateData: Partial<{
      name: string;
      description: string;
      assignee: string;
      dueDate: string;
      projectId: string;
    }>
  ): Promise<AsanaTask> => {
    const { accessToken } = await asanaService.getApiClient(userId);

    try {
      const payload: Record<string, unknown> = {
        data: {},
      };

      if (updateData.name) {
        payload.data.name = updateData.name;
      }

      if (updateData.description) {
        payload.data.notes = updateData.description;
      }

      if (updateData.assignee) {
        payload.data.assignee = updateData.assignee;
      }

      if (updateData.dueDate) {
        payload.data.due_on = updateData.dueDate;
      }

      if (updateData.projectId) {
        payload.data.projects = [updateData.projectId];
      }

      const response = await axios.put(
        `https://app.asana.com/api/1.0/tasks/${taskId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const task = response.data.data as {
        gid: string;
        name: string;
        notes: string;
        assignee: { gid: string };
        due_on: string;
        completed: boolean;
        projects: { gid: string }[];
        created_at: string;
        modified_at: string;
      };

      return {
        id: task.gid,
        name: task.name,
        description: task.notes,
        assignee: task.assignee?.gid,
        dueDate: task.due_on,
        status: task.completed ? 'done' : 'todo',
        projectId: task.projects?.[0]?.gid,
        createdAt: task.created_at,
        updatedAt: task.modified_at,
      };
    } catch (error) {
      console.error('Asana update task error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to update task',
          error.response?.status || 500
        );
      }
      throw createError('Failed to update task', 500);
    }
  },

  // Delete task
  deleteTask: async (userId: string, taskId: string): Promise<void> => {
    const { accessToken } = await asanaService.getApiClient(userId);

    try {
      await axios.delete(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Asana delete task error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to delete task',
          error.response?.status || 500
        );
      }
      throw createError('Failed to delete task', 500);
    }
  },

  // Get tasks by project
  getTasksByProject: async (userId: string, projectId: string): Promise<AsanaTask[]> => {
    const { accessToken } = await asanaService.getApiClient(userId);

    try {
      const response = await axios.get(
        `https://app.asana.com/api/1.0/projects/${projectId}/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data.map((task: unknown) => {
        const t = task as {
          gid: string;
          name: string;
          notes: string;
          assignee: { gid: string };
          due_on: string;
          completed: boolean;
          projects: { gid: string }[];
          created_at: string;
          modified_at: string;
        };
        return {
          id: t.gid,
          name: t.name,
          description: t.notes,
          assignee: t.assignee?.gid,
          dueDate: t.due_on,
          status: t.completed ? 'done' : 'todo',
          projectId: t.projects?.[0]?.gid,
          createdAt: t.created_at,
          updatedAt: t.modified_at,
        };
      });
    } catch (error) {
      console.error('Asana get tasks by project error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to get tasks by project',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get tasks by project', 500);
    }
  },

  // Create task from WHISE post
  createTaskFromPost: async (
    userId: string,
    postId: string,
    projectId?: string
  ): Promise<AsanaTask> => {
    // This would fetch the post and create a task with its details
    return asanaService.createTask(userId, {
      name: `Review WHISE Post: ${postId}`,
      description: `Task created from WHISE MKT post: ${postId}\n\nPlease review and approve the post.`,
      projectId,
      postId,
    });
  },

  // Complete task
  completeTask: async (userId: string, taskId: string): Promise<AsanaTask> => {
    const { accessToken } = await asanaService.getApiClient(userId);

    try {
      const response = await axios.put(
        `https://app.asana.com/api/1.0/tasks/${taskId}`,
        {
          data: {
            completed: true,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const task = response.data.data as {
        gid: string;
        name: string;
        notes: string;
        assignee: { gid: string };
        due_on: string;
        completed: boolean;
        projects: { gid: string }[];
        created_at: string;
        modified_at: string;
      };

      return {
        id: task.gid,
        name: task.name,
        description: task.notes,
        assignee: task.assignee?.gid,
        dueDate: task.due_on,
        status: 'done',
        projectId: task.projects?.[0]?.gid,
        createdAt: task.created_at,
        updatedAt: task.modified_at,
      };
    } catch (error) {
      console.error('Asana complete task error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to complete task',
          error.response?.status || 500
        );
      }
      throw createError('Failed to complete task', 500);
    }
  },

  // Get Asana analytics
  getAnalytics: async (userId: string, days: number = 30) => {
    const { accessToken, workspaceId } = await asanaService.getApiClient(userId);

    try {
      // Get all tasks in workspace
      const tasksResponse = await axios.get(
        `https://app.asana.com/api/1.0/workspaces/${workspaceId}/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            opt_fields: 'completed,created_at',
          },
        }
      );

      const tasks = tasksResponse.data.data as {
        gid: string;
        completed: boolean;
        created_at: string;
        projects: { gid: string }[];
      }[];

      // Get projects
      const projects = await asanaService.getProjects(userId);

      // Calculate analytics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.completed).length;

      // Group by project
      const byProject: Record<string, { tasks: number; completed: number }> = {};
      projects.forEach((project) => {
        byProject[project.id] = { tasks: 0, completed: 0 };
      });

      tasks.forEach((task) => {
        const projectId = task.projects?.[0]?.gid;
        if (projectId && byProject[projectId]) {
          byProject[projectId].tasks++;
          if (task.completed) {
            byProject[projectId].completed++;
          }
        }
      });

      return {
        totalTasks,
        completedTasks,
        byProject,
      };
    } catch (error) {
      console.error('Asana get analytics error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to get analytics',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get analytics', 500);
    }
  },
};
