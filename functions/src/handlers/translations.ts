import express from 'express';
import { z } from 'zod';
import Translation from '../models/Translation';
import Post from '../models/Post';
import User from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, paginationSchema } from '../middleware/validation';

const router = express.Router();

// Validation schemas
const translationSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID'),
  language: z.string().min(2, 'Language is required').max(10, 'Language code too long'),
  content: z.string().min(1, 'Content is required'),
  sourceLanguage: z.string().min(2).max(10).optional(),
});

const updateTranslationSchema = translationSchema.partial();

// Get all translations
router.get('/', authenticate, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: Record<string, any> = {};

    // Apply filters
    if (req.query.postId) {
      query.post = req.query.postId;
    }
    if (req.query.language) {
      query.language = req.query.language;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.translator) {
      query.translator = req.query.translator;
    }

    // Apply role-based filtering
    if (req.userRole !== 'admin') {
      // Non-admin users can only see translations for their own posts
      const userPosts = await Post.find({ author: req.userId }).select('_id');
      query.post = { $in: userPosts.map(p => p._id) };
    }

    const [translations, total] = await Promise.all([
      Translation.find(query)
        .populate('post', 'title platform status')
        .populate('translator', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Translation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: translations,
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
    console.error('Get translations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get translations',
    });
  }
});

// Get single translation
router.get('/:id', authenticate, async (req, res) => {
  try {
    const translation = await Translation.findById(req.params.id)
      .populate('post', 'title platform status author')
      .populate('translator', 'name email');

    if (!translation) {
      return res.status(404).json({
        success: false,
        error: 'Translation not found',
      });
    }

    // Check if user has access to this translation
    if (req.userRole !== 'admin') {
      const post = await Post.findById(translation.post);
      if (!post || post.author.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    console.error('Get translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get translation',
    });
  }
});

// Create new translation
router.post('/', authenticate, authorize(['translate:post']), validateRequest(translationSchema), async (req, res) => {
  try {
    const { postId, language, content, sourceLanguage } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user has access to the post
    if (req.userRole !== 'admin' && post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only translate your own posts',
      });
    }

    // Check if translation already exists for this post and language
    const existingTranslation = await Translation.findOne({
      post: postId,
      language,
    });

    if (existingTranslation) {
      return res.status(400).json({
        success: false,
        error: 'Translation already exists for this post and language',
      });
    }

    // Create new translation
    const translation = new Translation({
      post: postId,
      language,
      content,
      sourceLanguage: sourceLanguage || post.metadata?.hashtags?.[0] || 'fr',
      translator: req.userId,
      status: 'completed',
    });

    await translation.save();

    // Add translation to post
    post.translations.push(translation._id);
    await post.save();

    // Populate data
    await translation.populate('post', 'title platform status');
    await translation.populate('translator', 'name email');

    res.status(201).json({
      success: true,
      data: translation,
      message: 'Translation created successfully',
    });
  } catch (error) {
    console.error('Create translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create translation',
    });
  }
});

// Update translation
router.put('/:id', authenticate, authorize(['translate:post']), validateRequest(updateTranslationSchema), async (req, res) => {
  try {
    const translation = await Translation.findById(req.params.id);

    if (!translation) {
      return res.status(404).json({
        success: false,
        error: 'Translation not found',
      });
    }

    // Check if user has access to this translation
    if (req.userRole !== 'admin') {
      const post = await Post.findById(translation.post);
      if (!post || post.author.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only update translations for your own posts',
        });
      }
    }

    // Update translation
    const updates = { ...req.body };
    Object.assign(translation, updates);
    await translation.save();

    // Populate data
    await translation.populate('post', 'title platform status');
    await translation.populate('translator', 'name email');

    res.json({
      success: true,
      data: translation,
      message: 'Translation updated successfully',
    });
  } catch (error) {
    console.error('Update translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update translation',
    });
  }
});

// Delete translation
router.delete('/:id', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const translation = await Translation.findById(req.params.id);

    if (!translation) {
      return res.status(404).json({
        success: false,
        error: 'Translation not found',
      });
    }

    // Check if user has access to this translation
    if (req.userRole !== 'admin') {
      const post = await Post.findById(translation.post);
      if (!post || post.author.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete translations for your own posts',
        });
      }
    }

    // Remove translation from post
    const post = await Post.findById(translation.post);
    if (post) {
      post.translations = post.translations.filter(
        (t: any) => t.toString() !== translation._id.toString()
      );
      await post.save();
    }

    // Delete translation
    await translation.deleteOne();

    res.json({
      success: true,
      message: 'Translation deleted successfully',
    });
  } catch (error) {
    console.error('Delete translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete translation',
    });
  }
});

// Get translations for a specific post
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
    if (req.userRole !== 'admin' && post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const translations = await Translation.find({ post: postId })
      .populate('translator', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: translations,
    });
  } catch (error) {
    console.error('Get post translations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post translations',
    });
  }
});

// Update translation status
router.patch('/:id/status', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const translation = await Translation.findById(req.params.id);

    if (!translation) {
      return res.status(404).json({
        success: false,
        error: 'Translation not found',
      });
    }

    // Update status
    translation.status = status;
    await translation.save();

    // Populate data
    await translation.populate('post', 'title platform status');
    await translation.populate('translator', 'name email');

    res.json({
      success: true,
      data: translation,
      message: 'Translation status updated successfully',
    });
  } catch (error) {
    console.error('Update translation status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update translation status',
    });
  }
});

// Translate post with Mistral Vibe (placeholder for actual implementation)
router.post('/translate-with-ai', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { postId, targetLanguage, sourceLanguage } = req.body;

    if (!postId || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and target language are required',
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user has access to the post
    if (req.userRole !== 'admin' && post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only translate your own posts',
      });
    }

    // Check if translation already exists
    const existingTranslation = await Translation.findOne({
      post: postId,
      language: targetLanguage,
    });

    if (existingTranslation) {
      return res.status(400).json({
        success: false,
        error: 'Translation already exists for this post and language',
      });
    }

    // In a real implementation, you would call Mistral Vibe API here
    // For now, we'll create a pending translation
    const translation = new Translation({
      post: postId,
      language: targetLanguage,
      content: `[Translation pending for ${targetLanguage}] ${post.content}`,
      sourceLanguage: sourceLanguage || 'fr',
      translator: req.userId,
      status: 'pending',
    });

    await translation.save();

    // Add translation to post
    post.translations.push(translation._id);
    await post.save();

    // Populate data
    await translation.populate('post', 'title platform status');
    await translation.populate('translator', 'name email');

    res.status(201).json({
      success: true,
      data: translation,
      message: 'Translation request created. AI translation will be processed shortly.',
    });
  } catch (error) {
    console.error('Translate with AI error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create translation request',
    });
  }
});

export default router;
