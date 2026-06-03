import express from 'express';
import { z } from 'zod';
import User from '../models/User';
import Post from '../models/Post';
import { authenticate, authorizeRoles, authorize } from '../middleware/auth';
import { validateRequest, paginationSchema } from '../middleware/validation';

const router = express.Router();

// Validation schemas
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['admin', 'manager', 'editor', 'viewer']).optional(),
  avatar: z.string().optional(),
  asanaUserId: z.string().optional(),
  bufferProfileId: z.string().optional(),
  preferences: z.object({
    language: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
    }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

const updateUserSchema = userSchema.partial();

// Get all users (admin only)
router.get('/', authenticate, authorizeRoles(['admin']), validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: users,
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
    });
  }
});

// Get single user
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has permission to view this user
    if (req.userRole !== 'admin' && req.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

// Create new user (admin only)
router.post('/', authenticate, authorizeRoles(['admin']), validateRequest(userSchema), async (req, res) => {
  try {
    const { name, email, password, role, avatar, asanaUserId, bufferProfileId, preferences, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password: password || Math.random().toString(36).substring(2, 10), // Generate random password if not provided
      role: role || 'editor',
      avatar,
      asanaUserId,
      bufferProfileId,
      preferences: preferences || { language: 'fr', notifications: { email: true, push: true } },
      isActive: isActive !== undefined ? isActive : true,
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
});

// Update user
router.put('/:id', authenticate, authorize(['update:user']), validateRequest(updateUserSchema), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has permission to update this user
    if (req.userRole !== 'admin' && req.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own profile',
      });
    }

    // Prevent role change for non-admin users
    if (req.userRole !== 'admin' && req.body.role && req.body.role !== user.role) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can change user roles',
      });
    }

    // Prevent deactivating self
    if (req.userId === user._id.toString() && req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account',
      });
    }

    // Update user
    const updates = { ...req.body };
    
    // If password is being updated, it will be hashed in the pre-save hook
    Object.assign(user, updates);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent deleting self
    if (req.userId === user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account',
      });
    }

    // Delete user's posts
    await Post.deleteMany({ author: user._id });

    // Delete user
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

// Get user profile (current user)
router.get('/me/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ author: user._id });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          postCount,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
});

// Update user profile (current user)
router.put('/me/profile', authenticate, validateRequest(updateUserSchema.partial()), async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent role change
    if (req.body.role && req.body.role !== user.role) {
      return res.status(403).json({
        success: false,
        error: 'You cannot change your own role',
      });
    }

    // Prevent deactivating self
    if (req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account',
      });
    }

    // Update user
    const updates = { ...req.body };
    Object.assign(user, updates);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// Get user permissions
router.get('/:id/permissions', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('role permissions');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has permission to view this user's permissions
    if (req.userRole !== 'admin' && req.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: {
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permissions',
    });
  }
});

// Search users
router.get('/search', authenticate, authorizeRoles(['admin']), async (req, res) => {
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
        { name: searchRegex },
        { email: searchRegex },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
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
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    });
  }
});

// Get user activity
router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission to view this user's activity
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get user's posts
    const posts = await Post.find({ author: id })
      .select('title platform status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get user's stats
    const [totalPosts, draftPosts, publishedPosts, approvedPosts] = await Promise.all([
      Post.countDocuments({ author: id }),
      Post.countDocuments({ author: id, status: 'draft' }),
      Post.countDocuments({ author: id, status: 'published' }),
      Post.countDocuments({ author: id, status: 'approved' }),
    ]);

    res.json({
      success: true,
      data: {
        recentPosts: posts,
        stats: {
          totalPosts,
          draftPosts,
          publishedPosts,
          approvedPosts,
        },
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user activity',
    });
  }
});

// Update user preferences
router.put('/:id/preferences', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has permission to update this user's preferences
    if (req.userRole !== 'admin' && req.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
      await user.save();
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
});

export default router;
