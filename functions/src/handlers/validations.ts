import express from 'express';
import { z } from 'zod';
import Validation from '../models/Validation';
import Post from '../models/Post';
import User from '../models/User';
import { authenticate, authorize, authorizeRoles } from '../middleware/auth';
import { validateRequest, paginationSchema } from '../middleware/validation';

const router = express.Router();

// Validation schemas
const validationSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID'),
  comments: z.string().optional(),
  visualPreview: z.string().optional(),
});

const updateValidationSchema = validationSchema.partial();

// Get all validations
router.get('/', authenticate, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: Record<string, any> = {};

    // Apply filters
    if (req.query.postId) {
      query.post = req.query.postId;
    }
    if (req.query.validator) {
      query.validator = req.query.validator;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Apply role-based filtering
    if (req.userRole === 'admin') {
      // Admins can see all validations
    } else if (req.userRole === 'manager') {
      // Managers can see validations for their team
      const teamPosts = await Post.find({ author: { $in: await getTeamUserIds(req.userId) } }).select('_id');
      query.post = { $in: teamPosts.map(p => p._id) };
    } else {
      // Other users can only see their own validations
      query.validator = req.userId;
    }

    const [validations, total] = await Promise.all([
      Validation.find(query)
        .populate('post', 'title platform status author')
        .populate('validator', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Validation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: validations,
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
    console.error('Get validations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validations',
    });
  }
});

// Helper function to get team user IDs
async function getTeamUserIds(managerId: string): Promise<string[]> {
  // In a real app, you would have a team structure
  // For now, just return the manager's own ID
  return [managerId];
}

// Get single validation
router.get('/:id', authenticate, async (req, res) => {
  try {
    const validation = await Validation.findById(req.params.id)
      .populate('post', 'title platform status author content')
      .populate('validator', 'name email role');

    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation not found',
      });
    }

    // Check if user has access to this validation
    if (req.userRole !== 'admin' && req.userRole !== 'manager') {
      if (validation.validator.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Get validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validation',
    });
  }
});

// Create new validation request
router.post('/', authenticate, authorize(['approve:post']), validateRequest(validationSchema), async (req, res) => {
  try {
    const { postId, comments, visualPreview } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user can validate this post
    if (req.userRole !== 'admin' && req.userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only managers and admins can validate posts',
      });
    }

    // Check if validation already exists for this post and validator
    const existingValidation = await Validation.findOne({
      post: postId,
      validator: req.userId,
    });

    if (existingValidation) {
      return res.status(400).json({
        success: false,
        error: 'Validation already exists for this post and validator',
      });
    }

    // Create new validation
    const validation = new Validation({
      post: postId,
      validator: req.userId,
      status: 'pending',
      comments,
      visualPreview,
    });

    await validation.save();

    // Add validation to post
    post.validations.push(validation._id);
    
    // Update post status to in_review
    if (post.status === 'draft') {
      post.status = 'in_review';
    }
    await post.save();

    // Populate data
    await validation.populate('post', 'title platform status author');
    await validation.populate('validator', 'name email role');

    res.status(201).json({
      success: true,
      data: validation,
      message: 'Validation request created successfully',
    });
  } catch (error) {
    console.error('Create validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create validation',
    });
  }
});

// Update validation (approve/reject/request changes)
router.put('/:id', authenticate, authorize(['approve:post']), validateRequest(updateValidationSchema), async (req, res) => {
  try {
    const validation = await Validation.findById(req.params.id);

    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation not found',
      });
    }

    // Check if user can update this validation
    if (req.userRole !== 'admin' && validation.validator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own validations',
      });
    }

    // Update validation
    const updates = { ...req.body };
    Object.assign(validation, updates);
    await validation.save();

    // If validation is approved or rejected, update post status
    const post = await Post.findById(validation.post);
    if (post) {
      if (validation.status === 'approved') {
        // Check if all validations are approved
        const allValidations = await Validation.find({ post: post._id });
        const allApproved = allValidations.every(v => v.status === 'approved');
        
        if (allApproved) {
          post.status = 'approved';
          await post.save();
        }
      } else if (validation.status === 'rejected') {
        post.status = 'rejected';
        await post.save();
      } else if (validation.status === 'changes_requested') {
        post.status = 'draft';
        await post.save();
      }
    }

    // Populate data
    await validation.populate('post', 'title platform status author');
    await validation.populate('validator', 'name email role');

    res.json({
      success: true,
      data: validation,
      message: 'Validation updated successfully',
    });
  } catch (error) {
    console.error('Update validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update validation',
    });
  }
});

// Delete validation
router.delete('/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const validation = await Validation.findById(req.params.id);

    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation not found',
      });
    }

    // Remove validation from post
    const post = await Post.findById(validation.post);
    if (post) {
      post.validations = post.validations.filter(
        (v: any) => v.toString() !== validation._id.toString()
      );
      await post.save();
    }

    // Delete validation
    await validation.deleteOne();

    res.json({
      success: true,
      message: 'Validation deleted successfully',
    });
  } catch (error) {
    console.error('Delete validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete validation',
    });
  }
});

// Get validations for a specific post
router.get('/post/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user has access to the post
    if (req.userRole !== 'admin' && req.userRole !== 'manager') {
      if (post.author.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    const validations = await Validation.find({ post: postId })
      .populate('validator', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: validations,
    });
  } catch (error) {
    console.error('Get post validations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post validations',
    });
  }
});

// Approve validation
router.patch('/:id/approve', authenticate, authorize(['approve:post']), async (req, res) => {
  try {
    const { comments } = req.body;

    const validation = await Validation.findById(req.params.id);

    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation not found',
      });
    }

    // Check if user can approve this validation
    if (req.userRole !== 'admin' && validation.validator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only approve your own validations',
      });
    }

    // Approve validation
    validation.status = 'approved';
    validation.comments = comments || validation.comments;
    validation.approvedAt = new Date();
    await validation.save();

    // Check if all validations are approved
    const post = await Post.findById(validation.post);
    if (post) {
      const allValidations = await Validation.find({ post: post._id });
      const allApproved = allValidations.every(v => v.status === 'approved');
      
      if (allApproved) {
        post.status = 'approved';
        await post.save();
      }
    }

    // Populate data
    await validation.populate('post', 'title platform status author');
    await validation.populate('validator', 'name email role');

    res.json({
      success: true,
      data: validation,
      message: 'Validation approved successfully',
    });
  } catch (error) {
    console.error('Approve validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve validation',
    });
  }
});

// Reject validation
router.patch('/:id/reject', authenticate, authorize(['approve:post']), async (req, res) => {
  try {
    const { comments, changesRequested } = req.body;

    const validation = await Validation.findById(req.params.id);

    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation not found',
      });
    }

    // Check if user can reject this validation
    if (req.userRole !== 'admin' && validation.validator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only reject your own validations',
      });
    }

    // Reject validation
    validation.status = 'rejected';
    validation.comments = comments || validation.comments;
    validation.changesRequested = changesRequested || validation.changesRequested;
    await validation.save();

    // Update post status
    const post = await Post.findById(validation.post);
    if (post) {
      post.status = 'rejected';
      await post.save();
    }

    // Populate data
    await validation.populate('post', 'title platform status author');
    await validation.populate('validator', 'name email role');

    res.json({
      success: true,
      data: validation,
      message: 'Validation rejected successfully',
    });
  } catch (error) {
    console.error('Reject validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject validation',
    });
  }
});

// Request changes
router.patch('/:id/request-changes', authenticate, authorize(['approve:post']), async (req, res) => {
  try {
    const { comments, changesRequested } = req.body;

    if (!changesRequested || !Array.isArray(changesRequested) || changesRequested.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Changes requested list is required',
      });
    }

    const validation = await Validation.findById(req.params.id);

    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation not found',
      });
    }

    // Check if user can request changes for this validation
    if (req.userRole !== 'admin' && validation.validator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only request changes for your own validations',
      });
    }

    // Request changes
    validation.status = 'changes_requested';
    validation.comments = comments || validation.comments;
    validation.changesRequested = changesRequested;
    await validation.save();

    // Update post status
    const post = await Post.findById(validation.post);
    if (post) {
      post.status = 'draft';
      await post.save();
    }

    // Populate data
    await validation.populate('post', 'title platform status author');
    await validation.populate('validator', 'name email role');

    res.json({
      success: true,
      data: validation,
      message: 'Changes requested successfully',
    });
  } catch (error) {
    console.error('Request changes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request changes',
    });
  }
});

// Get pending validations for current user
router.get('/pending/my', authenticate, async (req, res) => {
  try {
    const validations = await Validation.find({
      validator: req.userId,
      status: 'pending',
    })
      .populate('post', 'title platform status author createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: validations,
    });
  } catch (error) {
    console.error('Get my pending validations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending validations',
    });
  }
});

export default router;
