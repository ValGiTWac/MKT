import express from 'express';
import { postService } from '../services/postService';
import { authenticate, isEditorOrHigher, isManagerOrAdmin } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts with pagination
// @access  Private
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const authorId = req.query.authorId as string;
    const search = req.query.search as string;

    let result;

    if (status) {
      result = await postService.getPostsByStatus(status as any, page, limit);
    } else if (authorId) {
      result = await postService.getPostsByAuthor(authorId, page, limit);
    } else if (search) {
      result = await postService.searchPosts(search, page, limit);
    } else {
      result = await postService.getAllPosts(page, limit);
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Private
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const post = await postService.getPostById(req.params.id);
    
    res.json({
      success: true,
      data: post,
    });
  })
);

// @route   POST /api/posts
// @desc    Create new post
// @access  Private/Editor+
router.post(
  '/',
  authenticate,
  isEditorOrHigher,
  asyncHandler(async (req, res) => {
    const { title, content, platforms, scheduledAt, tags, images } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    const post = await postService.createPost(req.user!._id.toString(), {
      title,
      content,
      platforms: platforms || [],
      scheduledAt,
      tags,
      images,
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully',
    });
  })
);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private/Editor+
router.put(
  '/:id',
  authenticate,
  isEditorOrHigher,
  asyncHandler(async (req, res) => {
    const post = await postService.updatePost(
      req.params.id,
      req.user!._id.toString(),
      req.body
    );

    res.json({
      success: true,
      data: post,
      message: 'Post updated successfully',
    });
  })
);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private/Editor+
router.delete(
  '/:id',
  authenticate,
  isEditorOrHigher,
  asyncHandler(async (req, res) => {
    await postService.deletePost(req.params.id, req.user!._id.toString());
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  })
);

// @route   PUT /api/posts/:id/approve
// @desc    Approve post (manager/admin only)
// @access  Private/Manager+
router.put(
  '/:id/approve',
  authenticate,
  isManagerOrAdmin,
  asyncHandler(async (req, res) => {
    const post = await postService.approvePost(req.params.id);
    
    res.json({
      success: true,
      data: post,
      message: 'Post approved successfully',
    });
  })
);

// @route   PUT /api/posts/:id/reject
// @desc    Reject post (manager/admin only)
// @access  Private/Manager+
router.put(
  '/:id/reject',
  authenticate,
  isManagerOrAdmin,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const post = await postService.rejectPost(req.params.id, reason);
    
    res.json({
      success: true,
      data: post,
      message: 'Post rejected successfully',
    });
  })
);

// @route   PUT /api/posts/:id/schedule
// @desc    Schedule post
// @access  Private/Editor+
router.put(
  '/:id/schedule',
  authenticate,
  isEditorOrHigher,
  asyncHandler(async (req, res) => {
    const { scheduledAt } = req.body;
    
    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        error: 'scheduledAt is required',
      });
    }

    const post = await postService.schedulePost(req.params.id, scheduledAt);
    
    res.json({
      success: true,
      data: post,
      message: 'Post scheduled successfully',
    });
  })
);

// @route   PUT /api/posts/:id/publish
// @desc    Publish post immediately
// @access  Private/Editor+
router.put(
  '/:id/publish',
  authenticate,
  isEditorOrHigher,
  asyncHandler(async (req, res) => {
    const post = await postService.publishPost(req.params.id);
    
    res.json({
      success: true,
      data: post,
      message: 'Post published successfully',
    });
  })
);

export default router;
