import express from 'express';
import { z } from 'zod';
import axios from 'axios';
import Post from '../models/Post';
import User from '../models/User';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Buffer API configuration
const BUFFER_API_KEY = process.env.BUFFER_API_KEY;
const BUFFER_API_URL = 'https://api.buffer.com/v1';

// Validation schemas
const publishSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID'),
  profileIds: z.array(z.string()).min(1, 'At least one profile ID is required'),
  scheduledAt: z.string().datetime().optional(),
  publishNow: z.boolean().optional().default(false),
});

// Helper function to make Buffer API requests
async function bufferRequest(method: string, endpoint: string, data?: any) {
  try {
    const config = {
      method,
      url: `${BUFFER_API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${BUFFER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data,
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Buffer API error:', error);
    throw new Error('Buffer API request failed');
  }
}

// Check if Buffer is configured
router.get('/check', authenticate, (req, res) => {
  const isConfigured = !!BUFFER_API_KEY;
  
  res.json({
    success: true,
    data: {
      isConfigured,
      hasApiKey: !!BUFFER_API_KEY,
    },
  });
});

// Get Buffer profiles
router.get('/profiles', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured. Please set BUFFER_API_KEY environment variable.',
      });
    }

    const profiles = await bufferRequest('get', '/profiles');

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Get Buffer profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Buffer profiles',
    });
  }
});

// Publish post to Buffer
router.post('/publish', authenticate, authorizeRoles(['admin', 'manager']), validateRequest(publishSchema), async (req, res) => {
  try {
    const { postId, profileIds, scheduledAt, publishNow } = req.body;

    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured. Please set BUFFER_API_KEY environment variable.',
      });
    }

    // Get post
    const post = await Post.findById(postId)
      .populate('author', 'name email bufferProfileId');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if post is already published to Buffer
    if (post.bufferPostId) {
      return res.status(400).json({
        success: false,
        error: 'Post is already published to Buffer',
        data: { bufferPostId: post.bufferPostId },
      });
    }

    // Prepare post content for Buffer
    const bufferPost = {
      text: post.content,
      media: post.media,
    };

    // Publish to each profile
    const bufferPosts = [];
    for (const profileId of profileIds) {
      const publishData = {
        profile_ids: [profileId],
        ...bufferPost,
      };

      if (publishNow) {
        // Publish immediately
        const result = await bufferRequest('post', '/publish', publishData);
        bufferPosts.push(result);
      } else {
        // Schedule for later
        const publishAt = scheduledAt || post.scheduledAt?.toISOString();
        const scheduleData = {
          ...publishData,
          publish_at: publishAt,
        };
        const result = await bufferRequest('post', '/publish', scheduleData);
        bufferPosts.push(result);
      }
    }

    // Update post with Buffer post IDs
    post.bufferPostId = bufferPosts.map(p => p.id).join(',');
    if (publishNow) {
      post.status = 'published';
      post.publishedAt = new Date();
    } else {
      post.status = 'scheduled';
    }
    await post.save();

    res.json({
      success: true,
      data: {
        bufferPosts,
        post,
      },
      message: `Post ${publishNow ? 'published' : 'scheduled'} to Buffer successfully`,
    });
  } catch (error) {
    console.error('Publish to Buffer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish to Buffer',
    });
  }
});

// Schedule post in Buffer
router.post('/schedule', authenticate, authorizeRoles(['admin', 'manager']), validateRequest(publishSchema), async (req, res) => {
  try {
    // Set publishNow to false for scheduling
    const result = await publishSchema.parse({ ...req.body, publishNow: false });
    
    // Call publish endpoint with publishNow: false
    const publishRes = await router.handle({
      ...req,
      body: { ...req.body, publishNow: false },
    } as any, res, () => {});

    // Since we can't easily call the route, we'll duplicate the logic
    const { postId, profileIds, scheduledAt } = req.body;

    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
      });
    }

    // Get post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Prepare post content for Buffer
    const bufferPost = {
      text: post.content,
      media: post.media,
    };

    // Schedule for each profile
    const bufferPosts = [];
    for (const profileId of profileIds) {
      const scheduleData = {
        profile_ids: [profileId],
        ...bufferPost,
        publish_at: scheduledAt || post.scheduledAt?.toISOString(),
      };
      const result = await bufferRequest('post', '/publish', scheduleData);
      bufferPosts.push(result);
    }

    // Update post with Buffer post IDs
    post.bufferPostId = bufferPosts.map(p => p.id).join(',');
    post.status = 'scheduled';
    await post.save();

    res.json({
      success: true,
      data: {
        bufferPosts,
        post,
      },
      message: 'Post scheduled in Buffer successfully',
    });
  } catch (error) {
    console.error('Schedule in Buffer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule in Buffer',
    });
  }
});

// Get Buffer posts
router.get('/posts', authenticate, async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
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

    const posts = await Post.find(postsQuery).select('bufferPostId title platform status');

    const bufferPosts = [];
    for (const post of posts) {
      if (post.bufferPostId) {
        const postIds = post.bufferPostId.split(',');
        for (const postId of postIds) {
          try {
            const bufferPost = await bufferRequest('get', `/updates/${postId}`);
            bufferPosts.push({
              postId: post._id,
              postTitle: post.title,
              postPlatform: post.platform,
              postStatus: post.status,
              bufferPost,
            });
          } catch (error) {
            console.error(`Failed to get Buffer post ${postId}:`, error);
          }
        }
      }
    }

    res.json({
      success: true,
      data: bufferPosts,
    });
  } catch (error) {
    console.error('Get Buffer posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Buffer posts',
    });
  }
});

// Get Buffer analytics
router.get('/analytics', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
      });
    }

    const { profileId, startDate, endDate } = req.query;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required',
      });
    }

    // Get analytics from Buffer
    const analytics = await bufferRequest('get', `/analytics`, {
      profile_id: profileId,
      start_date: startDate,
      end_date: endDate,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get Buffer analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Buffer analytics',
    });
  }
});

// Update Buffer post
router.put('/posts/:postId', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
      });
    }

    const { postId } = req.params;
    const { text, media, profile_ids, publish_at } = req.body;

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (media !== undefined) updateData.media = media;
    if (profile_ids !== undefined) updateData.profile_ids = profile_ids;
    if (publish_at !== undefined) updateData.publish_at = publish_at;

    const updatedPost = await bufferRequest('put', `/updates/${postId}`, updateData);

    res.json({
      success: true,
      data: updatedPost,
      message: 'Buffer post updated successfully',
    });
  } catch (error) {
    console.error('Update Buffer post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Buffer post',
    });
  }
});

// Delete Buffer post
router.delete('/posts/:postId', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
      });
    }

    const { postId } = req.params;

    await bufferRequest('delete', `/updates/${postId}`);

    // Remove Buffer post ID from our post
    const post = await Post.findOne({ bufferPostId: { $regex: postId } });
    if (post) {
      post.bufferPostId = post.bufferPostId.split(',').filter(id => id !== postId).join(',');
      if (!post.bufferPostId) {
        post.bufferPostId = undefined;
        post.status = 'approved';
      }
      await post.save();
    }

    res.json({
      success: true,
      message: 'Buffer post deleted successfully',
    });
  } catch (error) {
    console.error('Delete Buffer post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Buffer post',
    });
  }
});

// Setup Buffer webhook
router.post('/webhook', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
      });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required',
      });
    }

    // In a real implementation, you would create a webhook in Buffer
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Buffer webhook setup would be configured here',
      data: { url },
    });
  } catch (error) {
    console.error('Setup Buffer webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup Buffer webhook',
    });
  }
});

// Connect Buffer account (OAuth flow would start here)
router.get('/connect', authenticate, authorizeRoles(['admin']), (req, res) => {
  try {
    // In a real implementation, you would redirect to Buffer OAuth
    // For now, we'll just return instructions
    res.json({
      success: true,
      message: 'To connect Buffer, you need to set up OAuth. Please configure BUFFER_API_KEY environment variable.',
      data: {
        oauthUrl: 'https://buffer.com/oauth2/authorize',
        clientId: 'YOUR_CLIENT_ID',
        redirectUri: 'YOUR_REDIRECT_URI',
        scope: 'publish,read,update,delete',
      },
    });
  } catch (error) {
    console.error('Connect Buffer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect Buffer',
    });
  }
});

// Get publishing queue
router.get('/queue', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Check if Buffer is configured
    if (!BUFFER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Buffer is not configured',
      });
    }

    const queue = await bufferRequest('get', '/pending');

    res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error('Get Buffer queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Buffer queue',
    });
  }
});

export default router;
