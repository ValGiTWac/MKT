import express from 'express';
import { bufferService } from '../services/bufferService';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/buffer/connect
// @desc    Get Buffer OAuth URL for connection
// @access  Private
router.get(
  '/connect',
  authenticate,
  asyncHandler(async (req, res) => {
    const url = await bufferService.getOAuthUrl();
    
    res.json({
      success: true,
      data: { url },
    });
  })
);

// @route   GET /api/buffer/callback
// @desc    Buffer OAuth callback (handled by frontend redirect)
// @access  Public
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
    }

    // In a real implementation, we would exchange the code for a token
    // and associate it with the user
    // For now, just redirect to the frontend
    res.redirect('https://whise-mkt.netlify.app/settings?buffer=connected');
  })
);

// @route   POST /api/buffer/disconnect
// @desc    Disconnect Buffer
// @access  Private
router.post(
  '/disconnect',
  authenticate,
  asyncHandler(async (req, res) => {
    await bufferService.disconnect(req.user!._id.toString());
    
    res.json({
      success: true,
      message: 'Buffer disconnected successfully',
    });
  })
);

// @route   GET /api/buffer/status
// @desc    Check Buffer connection status
// @access  Private
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await bufferService.checkStatus(req.user!._id.toString());
    
    res.json({
      success: true,
      data: status,
    });
  })
);

// @route   GET /api/buffer/profiles
// @desc    Get available social media profiles
// @access  Private
router.get(
  '/profiles',
  authenticate,
  asyncHandler(async (req, res) => {
    const profiles = await bufferService.getProfiles(req.user!._id.toString());
    
    res.json({
      success: true,
      data: profiles,
    });
  })
);

// @route   POST /api/buffer/schedule
// @desc    Schedule a post to Buffer
// @access  Private
router.post(
  '/schedule',
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId, platform, scheduledAt, text, media } = req.body;
    
    if (!postId || !platform || !scheduledAt) {
      return res.status(400).json({
        success: false,
        error: 'postId, platform, and scheduledAt are required',
      });
    }

    // Get profiles to find the profile ID for the platform
    const profiles = await bufferService.getProfiles(req.user!._id.toString());
    const profile = profiles.find((p) => p.platform === platform);
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: `No ${platform} profile found`,
      });
    }

    const result = await bufferService.schedulePost(
      req.user!._id.toString(),
      profile.id,
      text || `Post from WHISE MKT: ${postId}`,
      media,
      scheduledAt
    );

    res.json({
      success: true,
      data: result,
      message: 'Post scheduled successfully',
    });
  })
);

// @route   POST /api/buffer/publish
// @desc    Publish a post immediately to Buffer
// @access  Private
router.post(
  '/publish',
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId, platform, text, media } = req.body;
    
    if (!postId || !platform) {
      return res.status(400).json({
        success: false,
        error: 'postId and platform are required',
      });
    }

    // Get profiles to find the profile ID for the platform
    const profiles = await bufferService.getProfiles(req.user!._id.toString());
    const profile = profiles.find((p) => p.platform === platform);
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: `No ${platform} profile found`,
      });
    }

    const result = await bufferService.publishPost(
      req.user!._id.toString(),
      profile.id,
      text || `Post from WHISE MKT: ${postId}`,
      media
    );

    res.json({
      success: true,
      data: result,
      message: 'Post published successfully',
    });
  })
);

// @route   GET /api/buffer/scheduled
// @desc    Get scheduled posts from Buffer
// @access  Private
router.get(
  '/scheduled',
  authenticate,
  asyncHandler(async (req, res) => {
    const posts = await bufferService.getScheduledPosts(req.user!._id.toString());
    
    res.json({
      success: true,
      data: posts,
    });
  })
);

// @route   GET /api/buffer/history
// @desc    Get post history from Buffer
// @access  Private
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await bufferService.getPostHistory(req.user!._id.toString(), limit);
    
    res.json({
      success: true,
      data: posts,
    });
  })
);

// @route   DELETE /api/buffer/scheduled/:id
// @desc    Delete a scheduled post from Buffer
// @access  Private
router.delete(
  '/scheduled/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await bufferService.deleteScheduledPost(req.user!._id.toString(), req.params.id);
    
    res.json({
      success: true,
      message: 'Scheduled post deleted successfully',
    });
  })
);

// @route   POST /api/buffer/publish-whise
// @desc    Publish a WHISE post to Buffer
// @access  Private
router.post(
  '/publish-whise',
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId, platforms } = req.body;
    
    if (!postId || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        error: 'postId and platforms (array) are required',
      });
    }

    const results = await bufferService.publishWhisePost(
      req.user!._id.toString(),
      postId,
      platforms
    );

    res.json({
      success: true,
      data: results,
      message: 'WHISE post published to Buffer successfully',
    });
  })
);

// @route   GET /api/buffer/analytics
// @desc    Get Buffer analytics
// @access  Private
router.get(
  '/analytics',
  authenticate,
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await bufferService.getAnalytics(req.user!._id.toString(), days);
    
    res.json({
      success: true,
      data: analytics,
    });
  })
);

export default router;
