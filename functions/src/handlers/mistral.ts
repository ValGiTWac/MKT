import express from 'express';
import { z } from 'zod';
import axios from 'axios';
import Post from '../models/Post';
import Translation from '../models/Translation';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Mistral Vibe API configuration
const MISTRAL_API_KEY = process.env.MISTRAL_VIBE_API_KEY;
const MISTRAL_API_URL = process.env.MISTRAL_VIBE_BASE_URL || 'https://api.mistral.ai/v1';
const MISTRAL_MODEL = process.env.MISTRAL_VIBE_MODEL || 'mistral-tiny';

// Validation schemas
const generateSchema = z.object({
  type: z.enum(['post', 'translation', 'correction', 'optimization']),
  content: z.string().min(1, 'Content is required'),
  options: z.object({
    tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous', 'inspirational']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    style: z.string().optional(),
    targetAudience: z.string().optional(),
    platform: z.string().optional(),
  }).optional().default({}),
});

const translateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  targetLanguage: z.string().min(2, 'Target language is required'),
  sourceLanguage: z.string().min(2).max(10).optional(),
});

const postGenerationSchema = z.object({
  topic: z.string().min(2, 'Topic is required'),
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube', 'pinterest']),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous', 'inspirational']).optional().default('professional'),
  length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  targetAudience: z.string().optional(),
  includeHashtags: z.boolean().optional().default(true),
  includeEmojis: z.boolean().optional().default(true),
});

// Helper function to make Mistral API requests
async function mistralRequest(prompt: string, options: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
} = {}) {
  try {
    const config = {
      method: 'post',
      url: `${MISTRAL_API_URL}/completions`,
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: options.model || MISTRAL_MODEL,
        prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      },
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Mistral API error:', error);
    throw new Error('Mistral API request failed');
  }
}

// Check if Mistral Vibe is configured
router.get('/check', authenticate, (req, res) => {
  const isConfigured = !!MISTRAL_API_KEY;
  
  res.json({
    success: true,
    data: {
      isConfigured,
      hasApiKey: !!MISTRAL_API_KEY,
      model: MISTRAL_MODEL,
      apiUrl: MISTRAL_API_URL,
    },
  });
});

// Generate content with Mistral Vibe
router.post('/generate', authenticate, validateRequest(generateSchema), async (req, res) => {
  try {
    const { type, content, options = {} } = req.body;

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured. Please set MISTRAL_VIBE_API_KEY environment variable.',
      });
    }

    // Build prompt based on type
    const prompt = buildPrompt(type, content, options);

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });

    const generatedContent = response.choices[0].text;

    res.json({
      success: true,
      data: {
        content: generatedContent,
        prompt,
        usage: response.usage,
      },
      message: 'Content generated successfully',
    });
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
    });
  }
});

// Build prompt based on generation type
function buildPrompt(type: string, content: string, options: any): string {
  const { tone = 'professional', length = 'medium', style, targetAudience, platform } = options;

  switch (type) {
    case 'post':
      return `Crée un post pour les réseaux sociaux basé sur ce sujet : ${content}
        Plateforme: ${platform || 'LinkedIn'}
        Ton: ${tone}
        Longueur: ${length}
        ${style ? `Style: ${style}` : ''}
        ${targetAudience ? `Public cible: ${targetAudience}` : ''}
        Formate le résultat comme un post engageant avec des emojis et des hashtags pertinents.`;

    case 'translation':
      return `Traduis ce texte en français: ${content}
        Conserve le ton et le sens original. Utilise un langage naturel et fluide.`;

    case 'correction':
      return `Corrige les fautes d'orthographe, de grammaire et de syntaxe dans ce texte: ${content}
        Améliore également la clarté, la fluidité et le style. Conserve le sens original.`;

    case 'optimization':
      return `Optimise ce texte pour les réseaux sociaux (${platform || 'LinkedIn'}): ${content}
        Ton: ${tone}
        Longueur: ${length}
        ${targetAudience ? `Public cible: ${targetAudience}` : ''}
        Rends-le plus engageant possible avec des emojis et des hashtags.`;

    default:
      return content;
  }
}

// Translate content with Mistral Vibe
router.post('/translate', authenticate, authorize(['translate:post']), validateRequest(translateSchema), async (req, res) => {
  try {
    const { content, targetLanguage, sourceLanguage } = req.body;

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Build translation prompt
    const prompt = `Traduis ce texte de ${sourceLanguage || 'français'} vers ${targetLanguage}: ${content}
      Conserve le ton, le style et le sens original. Utilise un langage naturel et fluide.`;

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.3,
      maxTokens: 500,
    });

    const translatedContent = response.choices[0].text;

    res.json({
      success: true,
      data: {
        content: translatedContent,
        sourceLanguage: sourceLanguage || 'fr',
        targetLanguage,
        prompt,
        usage: response.usage,
      },
      message: 'Content translated successfully',
    });
  } catch (error) {
    console.error('Translate content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate content',
    });
  }
});

// Correct content with Mistral Vibe
router.post('/correct', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { content, language = 'fr' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Build correction prompt
    const prompt = `Corrige toutes les fautes d'orthographe, de grammaire et de syntaxe dans ce texte en ${language}: ${content}
      Améliore également la clarté, la fluidité et le style. Conserve le sens original et la voix de l'auteur.`;

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.3,
      maxTokens: 500,
    });

    const correctedContent = response.choices[0].text;

    res.json({
      success: true,
      data: {
        correctedContent,
        originalContent: content,
        language,
        prompt,
        usage: response.usage,
      },
      message: 'Content corrected successfully',
    });
  } catch (error) {
    console.error('Correct content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to correct content',
    });
  }
});

// Optimize content with Mistral Vibe
router.post('/optimize', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { content, platform, options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Build optimization prompt
    const { tone = 'professional', length = 'medium', targetAudience } = options;
    const prompt = `Optimise ce texte pour ${platform || 'LinkedIn'}: ${content}
      Ton: ${tone}
      Longueur: ${length}
      ${targetAudience ? `Public cible: ${targetAudience}` : ''}
      Rends-le plus engageant possible. Ajoute des emojis et des hashtags pertinents si nécessaire.`;

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });

    const optimizedContent = response.choices[0].text;

    res.json({
      success: true,
      data: {
        optimizedContent,
        originalContent: content,
        platform: platform || 'linkedin',
        options,
        prompt,
        usage: response.usage,
      },
      message: 'Content optimized successfully',
    });
  } catch (error) {
    console.error('Optimize content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize content',
    });
  }
});

// Analyze content with Mistral Vibe
router.post('/analyze', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Analyze sentiment
    const sentimentPrompt = `Analyse le sentiment de ce texte: ${content}
      Réponds uniquement avec un mot: positif, négatif ou neutre.`;
    
    const sentimentResponse = await mistralRequest(sentimentPrompt, {
      temperature: 0.1,
      maxTokens: 10,
    });
    const sentiment = sentimentResponse.choices[0].text.trim();

    // Analyze readability
    const readabilityPrompt = `Évalue la lisibilité de ce texte sur une échelle de 1 à 10 (1 = très difficile, 10 = très facile): ${content}
      Réponds uniquement avec un nombre.`;
    
    const readabilityResponse = await mistralRequest(readabilityPrompt, {
      temperature: 0.1,
      maxTokens: 5,
    });
    const readability = parseInt(readabilityResponse.choices[0].text.trim()) || 5;

    // Generate suggestions
    const suggestionsPrompt = `Fais 3 suggestions pour améliorer ce texte: ${content}
      Sois concis et précis.`;
    
    const suggestionsResponse = await mistralRequest(suggestionsPrompt, {
      temperature: 0.7,
      maxTokens: 200,
    });
    const suggestionsText = suggestionsResponse.choices[0].text;
    const suggestions = suggestionsText.split('\n').filter(s => s.trim()).slice(0, 3);

    // Calculate engagement score (simple heuristic)
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;
    const engagementScore = Math.min(100, 
      (wordCount > 0 ? 20 : 0) + 
      (characterCount > 100 ? 30 : characterCount / 100 * 30) +
      (sentiment === 'positif' ? 20 : sentiment === 'neutre' ? 10 : 0) +
      (readability >= 7 ? 30 : readability / 10 * 30)
    );

    res.json({
      success: true,
      data: {
        sentiment,
        readability,
        engagementScore: Math.round(engagementScore),
        suggestions,
        wordCount,
        characterCount,
      },
      message: 'Content analyzed successfully',
    });
  } catch (error) {
    console.error('Analyze content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
    });
  }
});

// Suggest hashtags with Mistral Vibe
router.post('/suggest-hashtags', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { content, count = 5 } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Build hashtag suggestion prompt
    const prompt = `Suggère ${count} hashtags pertinents pour ce contenu: ${content}
      Réponds uniquement avec une liste de hashtags séparés par des virgules, sans autres mots.`;

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.7,
      maxTokens: 100,
    });

    const hashtagsText = response.choices[0].text;
    const hashtags = hashtagsText.split(',').map(h => h.trim()).filter(h => h.startsWith('#'));

    res.json({
      success: true,
      data: {
        hashtags: hashtags.slice(0, count),
        prompt,
        usage: response.usage,
      },
      message: 'Hashtags suggested successfully',
    });
  } catch (error) {
    console.error('Suggest hashtags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest hashtags',
    });
  }
});

// Suggest title with Mistral Vibe
router.post('/suggest-title', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { content, count = 3 } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Build title suggestion prompt
    const prompt = `Suggère ${count} titres accrocheurs pour ce contenu: ${content}
      Réponds avec une liste de titres, un par ligne.`;

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.7,
      maxTokens: 200,
    });

    const titlesText = response.choices[0].text;
    const titles = titlesText.split('\n').map(t => t.trim()).filter(t => t);

    res.json({
      success: true,
      data: {
        titles: titles.slice(0, count),
        prompt,
        usage: response.usage,
      },
      message: 'Titles suggested successfully',
    });
  } catch (error) {
    console.error('Suggest title error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest titles',
    });
  }
});

// Generate post from scratch with Mistral Vibe
router.post('/generate/post', authenticate, authorize(['create:post']), validateRequest(postGenerationSchema), async (req, res) => {
  try {
    const { topic, platform, tone, length, targetAudience, includeHashtags, includeEmojis } = req.body;

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
      });
    }

    // Generate title
    const titlePrompt = `Crée un titre accrocheur pour un post sur ${topic} pour ${platform}.`;
    const titleResponse = await mistralRequest(titlePrompt, {
      temperature: 0.7,
      maxTokens: 50,
    });
    const title = titleResponse.choices[0].text.trim();

    // Generate content
    const contentPrompt = `Écris un post pour ${platform} sur le sujet: ${topic}
      Ton: ${tone}
      Longueur: ${length}
      ${targetAudience ? `Public cible: ${targetAudience}` : ''}
      ${includeEmojis ? 'Inclure des emojis pertinents' : 'Ne pas inclure d\'emojis'}
      Formate comme un vrai post pour ${platform}.`;

    const contentResponse = await mistralRequest(contentPrompt, {
      temperature: 0.7,
      maxTokens: 500,
    });
    const content = contentResponse.choices[0].text.trim();

    // Generate hashtags if requested
    let hashtags: string[] = [];
    if (includeHashtags) {
      const hashtagPrompt = `Suggère 5 hashtags pertinents pour un post sur ${topic} pour ${platform}.`;
      const hashtagResponse = await mistralRequest(hashtagPrompt, {
        temperature: 0.7,
        maxTokens: 100,
      });
      const hashtagsText = hashtagResponse.choices[0].text;
      hashtags = hashtagsText.split(',').map(h => h.trim()).filter(h => h.startsWith('#'));
    }

    // Generate suggestions
    const suggestionsPrompt = `Fais 3 suggestions pour améliorer ce post: ${content}`;
    const suggestionsResponse = await mistralRequest(suggestionsPrompt, {
      temperature: 0.7,
      maxTokens: 200,
    });
    const suggestionsText = suggestionsResponse.choices[0].text;
    const suggestions = suggestionsText.split('\n').filter(s => s.trim()).slice(0, 3);

    res.json({
      success: true,
      data: {
        title,
        content,
        hashtags,
        suggestions,
        platform,
        tone,
        length,
        targetAudience,
      },
      message: 'Post generated successfully',
    });
  } catch (error) {
    console.error('Generate post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate post',
    });
  }
});

// Translate post with Mistral Vibe (creates translation in database)
router.post('/translate-post', authenticate, authorize(['translate:post']), async (req, res) => {
  try {
    const { postId, targetLanguage, sourceLanguage } = req.body;

    if (!postId || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and target language are required',
      });
    }

    // Check if Mistral is configured
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral Vibe is not configured',
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

    // Build translation prompt
    const prompt = `Traduis ce texte de ${sourceLanguage || 'français'} vers ${targetLanguage}: ${post.content}
      Conserve le ton, le style et le sens original. Utilise un langage naturel et fluide.`;

    // Call Mistral API
    const response = await mistralRequest(prompt, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    const translatedContent = response.choices[0].text;

    // Create translation in database
    const translation = new Translation({
      post: postId,
      language: targetLanguage,
      content: translatedContent,
      sourceLanguage: sourceLanguage || 'fr',
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
      message: 'Post translated successfully',
    });
  } catch (error) {
    console.error('Translate post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate post',
    });
  }
});

export default router;
