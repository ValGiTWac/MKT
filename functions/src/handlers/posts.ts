import express from 'express';
import { z } from 'zod';
import Post from '../models/Post';
import User from '../models/User';
import Translation from '../models/Translation';
import Validation from '../models/Validation';
import { authenticate, authorize, authorizeRoles, checkOwnership } from '../middleware/auth';
import { validateRequest, paginationSchema } from '../middleware/validation';

const router = express.Router();

// Validation schemas
const postSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title cannot exceed 200 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt cannot exceed 500 characters').optional(),
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube', 'pinterest']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('general'),
  scheduledAt: z.string().datetime().optional(),
  media: z.array(z.string()).optional().default([]),
  thumbnail: z.string().optional(),
  settings: z.object({
    autoPublish: z.boolean().optional().default(false),
    notifyTeam: z.boolean().optional().default(true),
    createAsanaTask: z.boolean().optional().default(false),
  }).optional().default({}),
});

const updatePostSchema = postSchema.partial();

const filterSchema = z.object({
  status: z.array(z.enum(['draft', 'in_review', 'approved', 'published', 'rejected', 'scheduled'])).optional(),
  platform: z.array(z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube', 'pinterest'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),
  author: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

const sortSchema = z.object({
  field: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Get all posts
router.get('/', authenticate, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build query based on filters
    const query: Record<string, any> = {};
    
    // Apply filters if provided
    if (req.query.status) {
      query.status = { $in: Array.isArray(req.query.status) ? req.query.status : [req.query.status] };
    }
    if (req.query.platform) {
      query.platform = { $in: Array.isArray(req.query.platform) ? req.query.platform : [req.query.platform] };
    }
    if (req.query.priority) {
      query.priority = { $in: Array.isArray(req.query.priority) ? req.query.priority : [req.query.priority] };
    }
    if (req.query.author) {
      query.author = { $in: Array.isArray(req.query.author) ? req.query.author : [req.query.author] };
    }
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
      query.tags = { $in: tags };
    }
    if (req.query.category) {
      const categories = Array.isArray(req.query.category) ? req.query.category : [req.query.category];
      query.category = { $in: categories };
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }
    if (req.query.dateFrom) {
      query.createdAt = { $gte: new Date(req.query.dateFrom as string) };
    }
    if (req.query.dateTo) {
      if (!query.createdAt) query.createdAt = {};
      query.createdAt.$lte = new Date(req.query.dateTo as string);
    }

    // Apply role-based filtering
    if (req.userRole !== 'admin') {
      // Non-admin users can only see their own posts or posts they have access to
      query.$or = [
        { author: req.userId },
        { 'validations.validator': req.userId },
      ];
    }

    // Get sort options
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, number> = { [sortField]: sortOrder };

    // Execute query
    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name email role avatar')
        .populate('translations', 'language status')
        .populate('validations', 'validator status')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get posts',
    });
  }
});

// Get single post
router.get('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role avatar')
      .populate('translations', 'language content status translator createdAt')
      .populate('validations', 'validator status comments createdAt')
      .populate('comments');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user has access to this post
    if (req.userRole !== 'admin' && 
        post.author.toString() !== req.userId &&
        !post.validations.some(v => v.validator.toString() === req.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post',
    });
  }
});

// Create new post
router.post('/', authenticate, authorize(['create:post']), validateRequest(postSchema), async (req, res) => {
  try {
    const { title, content, excerpt, platform, priority, tags, category, 
            scheduledAt, media, thumbnail, settings } = req.body;

    // Create new post
    const post = new Post({
      title,
      content,
      excerpt,
      author: req.userId,
      platform,
      priority,
      tags,
      category,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      media,
      thumbnail,
      settings,
    });

    await post.save();

    // Populate author
    await post.populate('author', 'name email role avatar');

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully',
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
    });
  }
});

// Update post
router.put('/:id', authenticate, authorize(['update:post']), validateRequest(updatePostSchema), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check ownership or permission
    if (req.userRole !== 'admin' && post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own posts',
      });
    }

    // Update post
    const updates = { ...req.body };
    
    // Handle scheduledAt separately
    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);
    }

    Object.assign(post, updates);
    await post.save();

    // Populate author
    await post.populate('author', 'name email role avatar');

    res.json({
      success: true,
      data: post,
      message: 'Post updated successfully',
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
    });
  }
});

// Delete post
router.delete('/:id', authenticate, authorize(['delete:post']), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check ownership or permission
    if (req.userRole !== 'admin' && post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts',
      });
    }

    // Delete related translations and validations
    await Promise.all([
      Translation.deleteMany({ post: post._id }),
      Validation.deleteMany({ post: post._id }),
    ]);

    // Delete post
    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
});

// Update post status
router.patch('/:id/status', authenticate, authorize(['update:post', 'approve:post']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check permission based on status change
    if (status === 'approved' || status === 'rejected') {
      // Only managers and admins can approve/reject
      if (!['admin', 'manager'].includes(req.userRole as string)) {
        return res.status(403).json({
          success: false,
          error: 'Only managers and admins can approve or reject posts',
        });
      }
    } else if (status === 'published') {
      // Only admins can publish
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admins can publish posts',
        });
      }
    }

    // Update status
    post.status = status;
    
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();

    // Populate author
    await post.populate('author', 'name email role avatar');

    res.json({
      success: true,
      data: post,
      message: 'Post status updated successfully',
    });
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post status',
    });
  }
});

// Bulk delete posts
router.post('/bulk-delete', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post IDs are required',
      });
    }

    // Delete related translations and validations
    await Promise.all([
      Translation.deleteMany({ post: { $in: ids } }),
      Validation.deleteMany({ post: { $in: ids } }),
    ]);

    // Delete posts
    const result = await Post.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} posts deleted successfully`,
    });
  } catch (error) {
    console.error('Bulk delete posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete posts',
    });
  }
});

// Search posts
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const searchRegex = new RegExp(q as string, 'i');
    const query = {
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } },
        { category: searchRegex },
      ],
    };

    // Apply role-based filtering
    if (req.userRole !== 'admin') {
      query.$or = [
        { author: req.userId },
        { 'validations.validator': req.userId },
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name email role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search posts',
    });
  }
});

// Get post statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const query: Record<string, any> = {};

    // Apply role-based filtering
    if (req.userRole !== 'admin') {
      query.author = req.userId;
    }

    const [totalPosts, postsByStatus, postsByPlatform, postsByPriority, recentActivity] = await Promise.all([
      Post.countDocuments(query),
      Post.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $match: query },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $match: { ...query, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { 
          _id: null,
          created: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        }},
      ]),
    ]);

    // Format results
    const formattedByStatus: Record<string, number> = {};
    postsByStatus.forEach((item: any) => {
      formattedByStatus[item._id] = item.count;
    });

    const formattedByPlatform: Record<string, number> = {};
    postsByPlatform.forEach((item: any) => {
      formattedByPlatform[item._id] = item.count;
    });

    const formattedByPriority: Record<string, number> = {};
    postsByPriority.forEach((item: any) => {
      formattedByPriority[item._id] = item.count;
    });

    const formattedRecentActivity = recentActivity[0] || { created: 0, approved: 0, published: 0 };

    // Get team activity
    const [pendingValidations, pendingTranslations, activeUsers] = await Promise.all([
      Validation.countDocuments({ status: 'pending' }),
      Translation.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: true, lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    ]);

    res.json({
      success: true,
      data: {
        totalPosts,
        postsByStatus: formattedByStatus,
        postsByPlatform: formattedByPlatform,
        postsByPriority: formattedByPriority,
        recentActivity: formattedRecentActivity,
        teamActivity: {
          activeUsers,
          pendingValidations,
          pendingTranslations,
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

// Export posts
router.get('/export', authenticate, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const query: Record<string, any> = {};

    // Apply role-based filtering
    if (req.userRole !== 'admin') {
      query.author = req.userId;
    }

    const posts = await Post.find(query)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    switch (format) {
      case 'csv':
        const csvHeader = 'ID,Title,Content,Platform,Status,Priority,Author,Created At,Published At\n';
        const csvRows = posts.map(post => 
          `${post._id},${JSON.stringify(post.title)},${JSON.stringify(post.content)},${post.platform},${post.status},${post.priority},"${post.author.name}",${post.createdAt},${post.publishedAt || ''}`
        ).join('\n');
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=posts.csv');
        res.send(csv);
        break;

      case 'xlsx':
        // In a real app, you would use a library like xlsx to generate Excel files
        res.status(501).json({
          success: false,
          error: 'Excel export not implemented yet',
        });
        break;

      default:
        res.json({
          success: true,
          data: posts,
        });
    }
  } catch (error) {
    console.error('Export posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export posts',
    });
  }
});

// Duplicate post
router.post('/duplicate', authenticate, authorize(['create:post']), async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required',
      });
    }

    const originalPost = await Post.findById(postId);

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        error: 'Original post not found',
      });
    }

    // Create duplicate post
    const duplicatedPost = new Post({
      title: `${originalPost.title} (Copy)`,
      content: originalPost.content,
      excerpt: originalPost.excerpt,
      author: req.userId,
      platform: originalPost.platform,
      priority: originalPost.priority,
      tags: originalPost.tags,
      category: originalPost.category,
      media: originalPost.media,
      thumbnail: originalPost.thumbnail,
      settings: originalPost.settings,
      status: 'draft',
    });

    await duplicatedPost.save();

    // Populate author
    await duplicatedPost.populate('author', 'name email role avatar');

    res.status(201).json({
      success: true,
      data: duplicatedPost,
      message: 'Post duplicated successfully',
    });
  } catch (error) {
    console.error('Duplicate post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate post',
    });
  }
});

export default router;
