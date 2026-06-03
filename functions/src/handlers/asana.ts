import express from 'express';
import { z } from 'zod';
import axios from 'axios';
import Post from '../models/Post';
import User from '../models/User';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Asana API configuration
const ASANA_API_URL = 'https://app.asana.com/api/1.0';
const ASANA_API_KEY = process.env.ASANA_API_KEY;
const ASANA_WORKSPACE_ID = process.env.ASANA_WORKSPACE_ID;

// Validation schemas
const syncPostSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID'),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

// Helper function to make Asana API requests
async function asanaRequest(method: string, endpoint: string, data?: any) {
  try {
    const config = {
      method,
      url: `${ASANA_API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${ASANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data,
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Asana API error:', error);
    throw new Error('Asana API request failed');
  }
}

// Check if Asana is configured
router.get('/check', authenticate, (req, res) => {
  const isConfigured = !!(ASANA_API_KEY && ASANA_WORKSPACE_ID);
  
  res.json({
    success: true,
    data: {
      isConfigured,
      hasApiKey: !!ASANA_API_KEY,
      hasWorkspaceId: !!ASANA_WORKSPACE_ID,
    },
  });
});

// Sync post with Asana
router.post('/sync-post', authenticate, authorizeRoles(['admin', 'manager']), validateRequest(syncPostSchema), async (req, res) => {
  try {
    const { postId, projectId, assigneeId, dueDate } = req.body;

    // Check if Asana is configured
    if (!ASANA_API_KEY || !ASANA_WORKSPACE_ID) {
      return res.status(400).json({
        success: false,
        error: 'Asana is not configured. Please set ASANA_API_KEY and ASANA_WORKSPACE_ID environment variables.',
      });
    }

    // Get post
    const post = await Post.findById(postId)
      .populate('author', 'name email asanaUserId');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if post is already synced with Asana
    if (post.asanaTaskId) {
      return res.status(400).json({
        success: false,
        error: 'Post is already synced with Asana',
        data: { asanaTaskId: post.asanaTaskId },
      });
    }

    // Create Asana task
    const taskData = {
      data: {
        name: `Social Media Post: ${post.title}`,
        notes: `Post for ${post.platformDisplay} (${post.platform})\n\n` +
               `Status: ${post.statusDisplay}\n` +
               `Priority: ${post.priority}\n` +
               `Content:\n${post.content}\n\n` +
               `Author: ${post.author.name} (${post.author.email})`,
        workspace: ASANA_WORKSPACE_ID,
        projects: projectId ? [projectId] : [],
        assignee: assigneeId || post.author.asanaUserId || undefined,
        due_on: dueDate || post.scheduledAt?.toISOString().split('T')[0],
        tags: ['social-media', post.platform, post.priority],
      },
    };

    const asanaTask = await asanaRequest('post', '/tasks', taskData);

    // Update post with Asana task ID
    post.asanaTaskId = asanaTask.data.id;
    await post.save();

    res.json({
      success: true,
      data: {
        asanaTaskId: asanaTask.data.id,
        asanaTaskUrl: `https://app.asana.com/0/${ASANA_WORKSPACE_ID}/${asanaTask.data.id}`,
        post,
      },
      message: 'Post synced with Asana successfully',
    });
  } catch (error) {
    console.error('Sync post with Asana error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync post with Asana',
    });
  }
});

// Get Asana projects
router.get('/projects', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Asana is configured
    if (!ASANA_API_KEY || !ASANA_WORKSPACE_ID) {
      return res.status(400).json({
        success: false,
        error: 'Asana is not configured',
      });
    }

    const projects = await asanaRequest('get', `/workspaces/${ASANA_WORKSPACE_ID}/projects`);

    res.json({
      success: true,
      data: projects.data,
    });
  } catch (error) {
    console.error('Get Asana projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Asana projects',
    });
  }
});

// Get Asana users
router.get('/users', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Asana is configured
    if (!ASANA_API_KEY || !ASANA_WORKSPACE_ID) {
      return res.status(400).json({
        success: false,
        error: 'Asana is not configured',
      });
    }

    const users = await asanaRequest('get', `/workspaces/${ASANA_WORKSPACE_ID}/users`);

    res.json({
      success: true,
      data: users.data,
    });
  } catch (error) {
    console.error('Get Asana users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Asana users',
    });
  }
});

// Get Asana tasks for posts
router.get('/tasks', authenticate, async (req, res) => {
  try {
    // Check if Asana is configured
    if (!ASANA_API_KEY || !ASANA_WORKSPACE_ID) {
      return res.status(400).json({
        success: false,
        error: 'Asana is not configured',
      });
    }

    const { postId } = req.query;

    let postsQuery: any = {};
    if (postId) {
      postsQuery._id = postId;
    }

    // Apply role-based filtering
    if (req.userRole !== 'admin') {
      postsQuery.author = req.userId;
    }

    const posts = await Post.find(postsQuery).select('asanaTaskId title platform status');

    const tasks = [];
    for (const post of posts) {
      if (post.asanaTaskId) {
        try {
          const task = await asanaRequest('get', `/tasks/${post.asanaTaskId}`);
          tasks.push({
            postId: post._id,
            postTitle: post.title,
            postPlatform: post.platform,
            postStatus: post.status,
            asanaTask: task.data,
          });
        } catch (error) {
          console.error(`Failed to get Asana task ${post.asanaTaskId}:`, error);
        }
      }
    }

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get Asana tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Asana tasks',
    });
  }
});

// Update Asana task
router.put('/tasks/:taskId', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Asana is configured
    if (!ASANA_API_KEY || !ASANA_WORKSPACE_ID) {
      return res.status(400).json({
        success: false,
        error: 'Asana is not configured',
      });
    }

    const { taskId } = req.params;
    const { name, notes, assignee, due_on, completed } = req.body;

    const taskData: any = {
      data: {},
    };

    if (name !== undefined) taskData.data.name = name;
    if (notes !== undefined) taskData.data.notes = notes;
    if (assignee !== undefined) taskData.data.assignee = assignee;
    if (due_on !== undefined) taskData.data.due_on = due_on;
    if (completed !== undefined) taskData.data.completed = completed;

    const updatedTask = await asanaRequest('put', `/tasks/${taskId}`, taskData);

    res.json({
      success: true,
      data: updatedTask.data,
      message: 'Asana task updated successfully',
    });
  } catch (error) {
    console.error('Update Asana task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Asana task',
    });
  }
});

// Setup Asana webhook
router.post('/webhook', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    // Check if Asana is configured
    if (!ASANA_API_KEY || !ASANA_WORKSPACE_ID) {
      return res.status(400).json({
        success: false,
        error: 'Asana is not configured',
      });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required',
      });
    }

    // In a real implementation, you would create a webhook in Asana
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Asana webhook setup would be configured here',
      data: { url },
    });
  } catch (error) {
    console.error('Setup Asana webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup Asana webhook',
    });
  }
});

// Connect Asana account (OAuth flow would start here)
router.get('/connect', authenticate, authorizeRoles(['admin']), (req, res) => {
  try {
    // In a real implementation, you would redirect to Asana OAuth
    // For now, we'll just return instructions
    res.json({
      success: true,
      message: 'To connect Asana, you need to set up OAuth. Please configure ASANA_API_KEY and ASANA_WORKSPACE_ID environment variables.',
      data: {
        oauthUrl: 'https://app.asana.com/-/oauth_authorize',
        clientId: 'YOUR_CLIENT_ID',
        redirectUri: 'YOUR_REDIRECT_URI',
        scope: 'default',
      },
    });
  } catch (error) {
    console.error('Connect Asana error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect Asana',
    });
  }
});

export default router;
