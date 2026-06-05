import express from 'express';
import { mistralService } from '../services/mistralService';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// ==================== Mistral Core Features ====================

// @route   GET /api/mistral/status
// @desc    Check if Mistral integration is active
// @access  Private
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await mistralService.checkIntegration();
    
    res.json({
      success: true,
      data: status,
    });
  })
);

// @route   POST /api/mistral/generate
// @desc    Generate content using Mistral Vibe
// @access  Private
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req, res) => {
    const { prompt, max_tokens, temperature, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    const result = await mistralService.generateContent({
      prompt,
      max_tokens,
      temperature,
      model,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/translate
// @desc    Translate content
// @access  Private
router.post(
  '/translate',
  authenticate,
  asyncHandler(async (req, res) => {
    const { text, target_language, source_language } = req.body;
    
    if (!text || !target_language) {
      return res.status(400).json({
        success: false,
        error: 'Text and target_language are required',
      });
    }

    const result = await mistralService.translateContent({
      text,
      target_language,
      source_language,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/optimize
// @desc    Optimize content for social media
// @access  Private
router.post(
  '/optimize',
  authenticate,
  asyncHandler(async (req, res) => {
    const { content, targetAudience, tone } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    const result = await mistralService.optimizeContent(
      content,
      targetAudience,
      tone
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/correct
// @desc    Correct grammar and spelling
// @access  Private
router.post(
  '/correct',
  authenticate,
  asyncHandler(async (req, res) => {
    const { text, language } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const result = await mistralService.correctGrammar(text, language || 'fr');

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/ideas
// @desc    Generate post ideas
// @access  Private
router.post(
  '/ideas',
  authenticate,
  asyncHandler(async (req, res) => {
    const { topic, count } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    const ideas = await mistralService.generatePostIdeas(topic, count || 5);

    res.json({
      success: true,
      data: ideas,
    });
  })
);

// @route   POST /api/mistral/hashtags
// @desc    Generate hashtags
// @access  Private
router.post(
  '/hashtags',
  authenticate,
  asyncHandler(async (req, res) => {
    const { content, count } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    const hashtags = await mistralService.generateHashtags(content, count || 5);

    res.json({
      success: true,
      data: hashtags,
    });
  })
);

// @route   POST /api/mistral/sentiment
// @desc    Analyze content sentiment
// @access  Private
router.post(
  '/sentiment',
  authenticate,
  asyncHandler(async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const result = await mistralService.analyzeSentiment(text);

    res.json({
      success: true,
      data: result,
    });
  })
);

// ==================== Buffer Integration via Mistral Vibe MCP ====================

// @route   GET /api/mistral/buffer/profiles
// @desc    Get all Buffer profiles connected via Mistral Vibe MCP
// @access  Private
router.get(
  '/buffer/profiles',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await mistralService.getBufferProfiles();
    
    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/buffer/publish
// @desc    Publish a post to Buffer via Mistral Vibe MCP
// @access  Private
router.post(
  '/buffer/publish',
  authenticate,
  asyncHandler(async (req, res) => {
    const { post, profileId } = req.body;
    
    if (!post || !post.text) {
      return res.status(400).json({
        success: false,
        error: 'Post text is required',
      });
    }

    const result = await mistralService.publishToBuffer({ post, profileId });
    
    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/buffer/schedule
// @desc    Schedule a post to Buffer via Mistral Vibe MCP
// @access  Private
router.post(
  '/buffer/schedule',
  authenticate,
  asyncHandler(async (req, res) => {
    const { post, profileId, scheduleAt } = req.body;
    
    if (!post || !post.text) {
      return res.status(400).json({
        success: false,
        error: 'Post text is required',
      });
    }

    if (!scheduleAt) {
      return res.status(400).json({
        success: false,
        error: 'Schedule time is required',
      });
    }

    const result = await mistralService.scheduleBufferPost({ post, profileId, scheduleAt });
    
    res.json({
      success: true,
      data: result,
    });
  })
);

// ==================== Asana Integration via Mistral Vibe MCP ====================

// @route   GET /api/mistral/asana/projects
// @desc    Get all Asana projects connected via Mistral Vibe MCP
// @access  Private
router.get(
  '/asana/projects',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await mistralService.getAsanaProjects();
    
    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/asana/task
// @desc    Create a task in Asana via Mistral Vibe MCP
// @access  Private
router.post(
  '/asana/task',
  authenticate,
  asyncHandler(async (req, res) => {
    const { task, projectId } = req.body;
    
    if (!task || !task.title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required',
      });
    }

    const result = await mistralService.createAsanaTask({ task, projectId });
    
    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/mistral/asana/task-from-post
// @desc    Create a task from a post in Asana via Mistral Vibe MCP
// @access  Private
router.post(
  '/asana/task-from-post',
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId, projectId } = req.body;
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required',
      });
    }

    const result = await mistralService.createAsanaTaskFromPost(postId, projectId);
    
    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
