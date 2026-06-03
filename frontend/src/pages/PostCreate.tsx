import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { editorState, postsState } from '@/store/atoms';
import { postService } from '@/services/postService';
import { mistralService } from '@/services/mistralService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { debounce } from '@/utils/helpers';
import {
  Calendar,
  Clock,
  Users,
  Globe,
  Check,
  X,
  Lightbulb,
  Send,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Platform options
const platformOptions = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
];

// Priority options
const priorityOptions = [
  { value: 'low', label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

// Tone options for AI generation
const toneOptions = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'friendly', label: 'Amical' },
  { value: 'formal', label: 'Formel' },
  { value: 'humorous', label: 'Humoristique' },
  { value: 'inspirational', label: 'Inspirant' },
];

// Length options for AI generation
const lengthOptions = [
  { value: 'short', label: 'Court' },
  { value: 'medium', label: 'Moyen' },
  { value: 'long', label: 'Long' },
];

export default function PostCreatePage() {
  const navigate = useNavigate();
  const [editor, setEditor] = useRecoilState(editorState);
  const [posts, setPosts] = useRecoilState(postsState);

  // Form state
  const [title, setTitle] = useState(editor.title || '');
  const [content, setContent] = useState(editor.content || '');
  const [platform, setPlatform] = useState<string>('linkedin');
  const [priority, setPriority] = useState<string>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI generation state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiLength, setAiLength] = useState('medium');
  const [aiTargetAudience, setAiTargetAudience] = useState('');

  // Auto-save
  const autoSave = useCallback(
    debounce(async () => {
      if (!title && !content) return;

      try {
        setEditor((prev) => ({ ...prev, isSaving: true }));
        
        // In a real app, you would save to drafts API
        // For now, just update local state
        setEditor({
          ...editor,
          title,
          content,
          isSaving: false,
          lastSaved: new Date(),
          isDirty: false,
        });

        toast.success('Brouillon sauvegardé');
      } catch (error) {
        toast.error('Échec de la sauvegarde');
      }
    }, 2000),
    [title, content, editor]
  );

  useEffect(() => {
    autoSave();
    return () => autoSave.cancel();
  }, [title, content, autoSave]);

  // Update word and character count
  useEffect(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    setEditor((prev) => ({
      ...prev,
      wordCount: words,
      characterCount: content.length,
      isDirty: true,
    }));
  }, [content, setEditor]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // Generate content with Mistral Vibe
  const generateWithAI = async () => {
    if (!aiTopic) {
      toast.error('Veuillez entrer un sujet');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await mistralService.generatePost({
        topic: aiTopic,
        platform,
        tone: aiTone,
        length: aiLength,
        targetAudience: aiTargetAudience || undefined,
        includeHashtags: true,
        includeEmojis: true,
      });

      setTitle(result.title);
      setContent(result.content);
      if (result.hashtags.length > 0) {
        setTags(result.hashtags);
      }

      setShowAIPanel(false);
      toast.success('Contenu généré avec succès !');
    } catch (error) {
      toast.error('Échec de la génération de contenu');
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Optimize content with Mistral Vibe
  const optimizeContent = async () => {
    if (!content) {
      toast.error('Aucun contenu à optimiser');
      return;
    }

    try {
      const optimized = await mistralService.optimize(content, platform, {
        tone: aiTone,
        length: aiLength,
      });

      setContent(optimized);
      toast.success('Contenu optimisé !');
    } catch (error) {
      toast.error('Échec de l\'optimisation');
    }
  };

  // Translate content
  const translateContent = async (targetLanguage: string) => {
    if (!content) {
      toast.error('Aucun contenu à traduire');
      return;
    }

    try {
      const translation = await mistralService.translate(content, targetLanguage, 'fr');
      setContent(translation.content);
      toast.success(`Contenu traduit en ${targetLanguage}`);
    } catch (error) {
      toast.error('Échec de la traduction');
    }
  };

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = async (action: 'save' | 'publish' | 'draft') => {
    if (!title || !content) {
      toast.error('Veuillez remplir le titre et le contenu');
      return;
    }

    const status = action === 'publish' ? 'approved' : action === 'draft' ? 'draft' : 'in_review';

    try {
      setIsSaving(true);
      if (action === 'publish') setIsPublishing(true);

      const newPost = await postService.create({
        title,
        content,
        platform: platform as any,
        priority: priority as any,
        tags,
        category,
        scheduledAt: action === 'publish' ? new Date().toISOString() : scheduledAt || undefined,
        settings: {
          autoPublish: action === 'publish',
          notifyTeam: true,
          createAsanaTask: false,
        },
      });

      // Update local state
      setPosts((prev) => ({
        ...prev,
        posts: [newPost, ...prev.posts],
        total: prev.total + 1,
      }));

      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setCategory('');
      setScheduledAt('');
      setEditor({
        ...editor,
        title: '',
        content: '',
        isDirty: false,
        lastSaved: null,
      });

      toast.success(`Post ${action === 'publish' ? 'publié' : 'enregistré'} avec succès !`);

      if (action === 'publish') {
        navigate('/posts');
      } else {
        navigate(`/posts/${newPost._id}`);
      }
    } catch (error) {
      toast.error(`Échec de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer un Post</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Rédigez votre contenu avec l'aide de Mistral Vibe
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/posts')}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
          <Button
            onClick={() => handleSubmit('publish')}
            isLoading={isPublishing}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <Send className="w-4 h-4 mr-2" />
            Publier
          </Button>
        </div>
      </div>

      {/* AI Generation Panel */}
      {showAIPanel ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Génération avec Mistral Vibe
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAIPanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sujet principal
              </label>
              <Input
                placeholder="Ex: Lancement de notre nouveau produit"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ton
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-3 py-2 text-sm"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longueur
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-3 py-2 text-sm"
                  value={aiLength}
                  onChange={(e) => setAiLength(e.target.value)}
                >
                  {lengthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Public cible (optionnel)
              </label>
              <Input
                placeholder="Ex: Professionnels du marketing"
                value={aiTargetAudience}
                onChange={(e) => setAiTargetAudience(e.target.value)}
              />
            </div>

            <Button
              onClick={generateWithAI}
              isLoading={isGenerating}
              className="w-full"
            >
              <Magic className="w-4 h-4 mr-2" />
              Générer le contenu
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAIPanel(true)}
          className="w-full"
        >
          <Magic className="w-4 h-4 mr-2" />
          Générer avec Mistral Vibe
        </Button>
      )}

      {/* Main form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre du Post
            </label>
            <Input
              placeholder="Donnez un titre accrocheur à votre post..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          {/* Content editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenu
              </label>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{editor.wordCount} mots</span>
                <span>{editor.characterCount} caractères</span>
              </div>
            </div>
            <div className="relative">
              <textarea
                placeholder="Écrivez votre contenu ici...\n\nUtilisez @ pour mentionner, # pour les hashtags, et les emojis 😊\n\nVous pouvez aussi utiliser Markdown pour la mise en forme :\n\n- **Gras**\n- *Italique*\n- [Lien](https://example.com)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[300px] p-4 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              
              {/* AI suggestions */}
              {editor.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editor.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setContent(content + ' ' + suggestion);
                        setEditor((prev) => ({
                          ...prev,
                          suggestions: prev.suggestions.filter((_, i) => i !== index),
                        }));
                      }}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={optimizeContent}
                className="text-sm"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Optimiser
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => translateContent('en')}
                className="text-sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Traduire
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Ajouter un tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie
            </label>
            <Input
              placeholder="Ex: Produits, Événements, Annonces..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plateforme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {platformOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPlatform(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                    platform === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priorité
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    priority === option.value
                      ? 'ring-2 ring-primary-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                    option.color
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Planification
            </label>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setScheduledAt(new Date().toISOString())}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {scheduledAt ? formatDate(scheduledAt) : 'Publier maintenant'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Clock className="w-4 h-4 mr-2" />
                Choisir une heure
              </Button>
            </div>
          </div>

          {/* Auto-save status */}
          <div className="text-center">
            {editor.isDirty ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sauvegarde en cours...</span>
              </div>
            ) : editor.lastSaved ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <Check className="w-4 h-4 inline mr-1" />
                Sauvegardé à {formatDate(editor.lastSaved)}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Pas encore sauvegardé
              </div>
            )}
          </div>

          {/* Publish actions */}
          <div className="space-y-2">
            <Button
              onClick={() => handleSubmit('save')}
              isLoading={isSaving}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer le brouillon
            </Button>
            <Button
              onClick={() => handleSubmit('publish')}
              isLoading={isPublishing}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
