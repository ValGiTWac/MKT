import axios from 'axios';
import Integration from '../models/Integration';
import { createError } from '../middleware/errorHandler';

const BUFFER_API_KEY = process.env.BUFFER_API_KEY;
const BUFFER_CLIENT_ID = process.env.BUFFER_CLIENT_ID;
const BUFFER_CLIENT_SECRET = process.env.BUFFER_CLIENT_SECRET;
const BUFFER_REDIRECT_URI = process.env.BUFFER_REDIRECT_URI || 'https://whise-mkt.netlify.app/api/buffer/callback';

interface BufferProfile {
  id: string;
  platform: string;
  name: string;
  avatar?: string;
}

interface BufferPost {
  id: string;
  text: string;
  media?: string[];
  platform: string;
  scheduledAt: string;
  status: 'queued' | 'published' | 'failed';
  postId?: string;
  createdAt: string;
}

export const bufferService = {
  // Check if Buffer integration is active
  checkStatus: async (userId: string) => {
    try {
      const integration = await Integration.findOne({ type: 'buffer', userId });
      return {
        active: !!BUFFER_API_KEY,
        connected: !!integration,
      };
    } catch (error) {
      console.error('Buffer status check error:', error);
      return { active: !!BUFFER_API_KEY, connected: false };
    }
  },

  // Get Buffer OAuth URL for connection
  getOAuthUrl: async () => {
    if (!BUFFER_CLIENT_ID) {
      throw createError('Buffer integration is not configured', 500);
    }

    const params = new URLSearchParams({
      client_id: BUFFER_CLIENT_ID,
      redirect_uri: BUFFER_REDIRECT_URI,
      response_type: 'code',
      scope: 'publish,read,manage',
      state: Math.random().toString(36).substring(2),
    });

    return `https://buffer.com/oauth2/authorize?${params.toString()}`;
  },

  // Exchange code for access token
  exchangeCodeForToken: async (code: string, userId: string) => {
    if (!BUFFER_CLIENT_ID || !BUFFER_CLIENT_SECRET) {
      throw createError('Buffer integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        'https://api.buffer.com/oauth2/token',
        new URLSearchParams({
          client_id: BUFFER_CLIENT_ID,
          client_secret: BUFFER_CLIENT_SECRET,
          redirect_uri: BUFFER_REDIRECT_URI,
          grant_type: 'authorization_code',
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Save integration
      await Integration.findOneAndUpdate(
        { type: 'buffer', userId },
        {
          type: 'buffer',
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          userId,
          metadata: {},
        },
        { upsert: true, new: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Buffer token exchange error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to exchange code for token',
          error.response?.status || 500
        );
      }
      throw createError('Failed to exchange code for token', 500);
    }
  },

  // Disconnect Buffer
  disconnect: async (userId: string) => {
    await Integration.findOneAndDelete({ type: 'buffer', userId });
    return { success: true };
  },

  // Get Buffer profiles
  getProfiles: async (userId: string): Promise<BufferProfile[]> => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration) {
      throw createError('Buffer is not connected', 400);
    }

    try {
      const response = await axios.get('https://api.buffer.com/profiles', {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.map((profile: unknown) => {
        const p = profile as { id: string; service: string; service_id: string; avatar: string; formatted_service: string };
        return {
          id: p.id,
          platform: p.service,
          name: p.formatted_service || p.service,
          avatar: p.avatar,
        };
      });
    } catch (error) {
      console.error('Buffer get profiles error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await bufferService.refreshToken(userId);
          return bufferService.getProfiles(userId);
        }
        throw createError(
          error.response?.data?.message || 'Failed to get profiles',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get profiles', 500);
    }
  },

  // Refresh access token
  refreshToken: async (userId: string) => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration || !integration.refreshToken) {
      throw createError('No refresh token available', 400);
    }

    if (!BUFFER_CLIENT_ID || !BUFFER_CLIENT_SECRET) {
      throw createError('Buffer integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        'https://api.buffer.com/oauth2/token',
        new URLSearchParams({
          client_id: BUFFER_CLIENT_ID,
          client_secret: BUFFER_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: integration.refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Update integration
      await Integration.findByIdAndUpdate(integration._id, {
        accessToken: access_token,
        refreshToken: refresh_token || integration.refreshToken,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      });

      return { success: true };
    } catch (error) {
      console.error('Buffer refresh token error:', error);
      if (axios.isAxiosError(error)) {
        throw createError(
          error.response?.data?.message || 'Failed to refresh token',
          error.response?.status || 500
        );
      }
      throw createError('Failed to refresh token', 500);
    }
  },

  // Schedule a post to Buffer
  schedulePost: async (
    userId: string,
    profileId: string,
    text: string,
    media?: string[],
    scheduledAt?: string
  ): Promise<BufferPost> => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration) {
      throw createError('Buffer is not connected', 400);
    }

    try {
      const payload: Record<string, unknown> = {
        profile_ids: [profileId],
        text,
      };

      if (media && media.length > 0) {
        payload.media = media.map((url) => ({ type: 'image', url }));
      }

      if (scheduledAt) {
        payload.scheduled_at = new Date(scheduledAt).toISOString();
      }

      const response = await axios.post('https://api.buffer.com/publish', payload, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        id: response.data.id,
        text,
        media,
        platform: 'buffer',
        scheduledAt: scheduledAt || new Date().toISOString(),
        status: 'queued',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Buffer schedule post error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await bufferService.refreshToken(userId);
          return bufferService.schedulePost(userId, profileId, text, media, scheduledAt);
        }
        throw createError(
          error.response?.data?.message || 'Failed to schedule post',
          error.response?.status || 500
        );
      }
      throw createError('Failed to schedule post', 500);
    }
  },

  // Publish a post immediately to Buffer
  publishPost: async (
    userId: string,
    profileId: string,
    text: string,
    media?: string[]
  ): Promise<BufferPost> => {
    return bufferService.schedulePost(userId, profileId, text, media, new Date().toISOString());
  },

  // Get scheduled posts from Buffer
  getScheduledPosts: async (userId: string): Promise<BufferPost[]> => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration) {
      throw createError('Buffer is not connected', 400);
    }

    try {
      const response = await axios.get('https://api.buffer.com/publish?status=scheduled', {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.map((post: unknown) => {
        const p = post as {
          id: string;
          text: string;
          media: { type: string; url: string }[];
          profile_id: string;
          scheduled_at: string;
          status: string;
          created_at: string;
        };
        return {
          id: p.id,
          text: p.text,
          media: p.media?.map((m) => m.url),
          platform: 'buffer',
          scheduledAt: p.scheduled_at,
          status: p.status as 'queued' | 'published' | 'failed',
          createdAt: p.created_at,
        };
      });
    } catch (error) {
      console.error('Buffer get scheduled posts error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await bufferService.refreshToken(userId);
          return bufferService.getScheduledPosts(userId);
        }
        throw createError(
          error.response?.data?.message || 'Failed to get scheduled posts',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get scheduled posts', 500);
    }
  },

  // Get post history from Buffer
  getPostHistory: async (userId: string, limit: number = 10): Promise<BufferPost[]> => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration) {
      throw createError('Buffer is not connected', 400);
    }

    try {
      const response = await axios.get(
        `https://api.buffer.com/publish?status=published&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.map((post: unknown) => {
        const p = post as {
          id: string;
          text: string;
          media: { type: string; url: string }[];
          profile_id: string;
          published_at: string;
          status: string;
          created_at: string;
        };
        return {
          id: p.id,
          text: p.text,
          media: p.media?.map((m) => m.url),
          platform: 'buffer',
          scheduledAt: p.published_at,
          status: p.status as 'queued' | 'published' | 'failed',
          createdAt: p.created_at,
        };
      });
    } catch (error) {
      console.error('Buffer get post history error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await bufferService.refreshToken(userId);
          return bufferService.getPostHistory(userId, limit);
        }
        throw createError(
          error.response?.data?.message || 'Failed to get post history',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get post history', 500);
    }
  },

  // Delete a scheduled post from Buffer
  deleteScheduledPost: async (userId: string, postId: string): Promise<void> => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration) {
      throw createError('Buffer is not connected', 400);
    }

    try {
      await axios.delete(`https://api.buffer.com/publish/${postId}`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Buffer delete scheduled post error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await bufferService.refreshToken(userId);
          return bufferService.deleteScheduledPost(userId, postId);
        }
        throw createError(
          error.response?.data?.message || 'Failed to delete scheduled post',
          error.response?.status || 500
        );
      }
      throw createError('Failed to delete scheduled post', 500);
    }
  },

  // Publish a WHISE post to Buffer
  publishWhisePost: async (userId: string, postId: string, platforms: string[]): Promise<BufferPost[]> => {
    // This would be implemented to fetch the WHISE post and publish to selected platforms
    // For now, return a mock response
    return platforms.map((platform) => ({
      id: `buffer-${Date.now()}-${platform}`,
      text: `Post from WHISE MKT - ${platform}`,
      platform,
      scheduledAt: new Date().toISOString(),
      status: 'queued',
      createdAt: new Date().toISOString(),
    }));
  },

  // Get Buffer analytics
  getAnalytics: async (userId: string, days: number = 30) => {
    const integration = await Integration.findOne({ type: 'buffer', userId });
    
    if (!integration) {
      throw createError('Buffer is not connected', 400);
    }

    try {
      const response = await axios.get(
        `https://api.buffer.com/analytics?since=${days}days`,
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        totalPosts: response.data.total_posts || 0,
        engagement: response.data.total_engagement || 0,
        reach: response.data.total_reach || 0,
        byPlatform: response.data.by_platform || {},
      };
    } catch (error) {
      console.error('Buffer get analytics error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await bufferService.refreshToken(userId);
          return bufferService.getAnalytics(userId, days);
        }
        throw createError(
          error.response?.data?.message || 'Failed to get analytics',
          error.response?.status || 500
        );
      }
      throw createError('Failed to get analytics', 500);
    }
  },
};
