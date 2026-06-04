import express from 'express';
import { mistralService } from '../services/mistralService';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

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

export default router;
