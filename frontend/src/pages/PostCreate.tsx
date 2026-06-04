import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { postService } from '@/services/postService';
import { mistralService } from '@/services/mistralService';
import { bufferService } from '@/services/bufferService';
import { asanaService } from '@/services/asanaService';
import { SocialPlatform, PostStatus } from '@/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import {
  FileText,
  Sparkles,
  Globe,
  Check,
  X,
  Calendar,
  Tag,
  Image,
  Send,
  Brain,
  Plug,
  Users,
} from 'lucide-react';

const PostCreatePage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platforms: [] as SocialPlatform[],
    scheduledAt: '',
    tags: [] as string[],
    images: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [bufferProfiles, setBufferProfiles] = useState<{ id: string; platform: SocialPlatform; name: string }[]>([]);
  const [asanaProjects, setAsanaProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedBufferProfile, setSelectedBufferProfile] = useState<string>('');
  const [selectedAsanaProject, setSelectedAsanaProject] = useState<string>('');
  const [createAsanaTask, setCreateAsanaTask] = useState(false);

  const platformOptions = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
  ];

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        // Fetch Buffer profiles
        const bufferStatus = await bufferService.checkStatus();
        if (bufferStatus.connected) {
          const profiles = await bufferService.getProfiles();
          setBufferProfiles(profiles || []);
        }

        // Fetch Asana projects
        const asanaStatus = await asanaService.checkStatus();
        if (asanaStatus.connected) {
          const projects = await asanaService.getProjects();
          setAsanaProjects(projects || []);
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      }
    };

    fetchIntegrations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      const platforms = formData.platforms as string[];
      if (checked) {
        setFormData({ ...formData, platforms: [...platforms, value] });
      } else {
        setFormData({ ...formData, platforms: platforms.filter((p) => p !== value) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTagsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const generateContentWithAI = async () => {
    if (!formData.title.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez entrer un titre pour générer du contenu',
      });
      return;
    }

    try {
      setIsGenerating(true);
      const prompt = `Créez un post pour les réseaux sociaux sur le sujet suivant: ${formData.title}. 
      Le post doit être engageant, professionnel et adapté au marketing digital. 
      Utilisez un ton positif et incluez un appel à l'action.`;

      const result = await mistralService.generateContent({
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      });

      const generatedContent = result.choices?.[0]?.text || '';
      setFormData({ ...formData, content: generatedContent });
      
      addNotification({
        type: 'success',
        title: 'Contenu généré',
        message: 'Le contenu a été généré avec Mistral Vibe',
      });
    } catch (error) {
      console.error('Failed to generate content:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la génération de contenu',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const translateContent = async (targetLanguage: string) => {
    if (!formData.content.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez entrer du contenu à traduire',
      });
      return;
    }

    try {
      setIsGenerating(true);
      const result = await mistralService.translateContent({
        text: formData.content,
        target_language: targetLanguage,
      });

      // For demo, just show the translated content
      addNotification({
        type: 'info',
        title: 'Traduction',
        message: `Traduction: ${result.translated_text.substring(0, 100)}...`,
      });
    } catch (error) {
      console.error('Failed to translate content:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la traduction',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeContent = async () => {
    if (!formData.content.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez entrer du contenu à optimiser',
      });
      return;
    }

    try {
      setIsGenerating(true);
      const result = await mistralService.optimizeContent({
        content: formData.content,
        targetAudience: 'marketing professionals',
        tone: 'professional',
      });

      setFormData({ ...formData, content: result.optimizedContent });
      
      addNotification({
        type: 'success',
        title: 'Contenu optimisé',
        message: 'Le contenu a été optimisé avec Mistral Vibe',
      });
    } catch (error) {
      console.error('Failed to optimize content:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de l\'optimisation du contenu',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHashtags = async () => {
    if (!formData.content.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez entrer du contenu pour générer des hashtags',
      });
      return;
    }

    try {
      setIsGenerating(true);
      const hashtags = await mistralService.generateHashtags(formData.content, 5);
      setFormData({ ...formData, tags: [...formData.tags, ...hashtags] });
      
      addNotification({
        type: 'success',
        title: 'Hashtags générés',
        message: `${hashtags.length} hashtags ont été ajoutés`,
      });
    } catch (error) {
      console.error('Failed to generate hashtags:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la génération des hashtags',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (status: PostStatus = 'draft') => {
    try {
      setIsLoading(true);
      
      const postData = {
        ...formData,
        status,
      };

      const post = await postService.createPost(postData);
      
      addNotification({
        type: 'success',
        title: 'Post créé',
        message: `Le post a été créé avec le statut: ${status}`,
      });

      // Handle additional actions
      if (createAsanaTask && selectedAsanaProject) {
        try {
          await asanaService.createTaskFromPost(post.id, selectedAsanaProject);
          addNotification({
            type: 'success',
            title: 'Tâche Asana créée',
            message: 'Une tâche a été créée dans Asana pour ce post',
          });
        } catch (error) {
          console.error('Failed to create Asana task:', error);
        }
      }

      if (status === 'published' && selectedBufferProfile) {
        try {
          const profile = bufferProfiles.find((p) => p.id === selectedBufferProfile);
          if (profile) {
            await bufferService.publishPost(
              profile.id,
              post.id,
              formData.content,
              formData.images
            );
            addNotification({
              type: 'success',
              title: 'Post publié',
              message: 'Le post a été publié sur Buffer',
            });
          }
        } catch (error) {
          console.error('Failed to publish to Buffer:', error);
        }
      }

      navigate('/posts');
    } catch (error) {
      console.error('Failed to create post:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la création du post',
      });
    } finally {
      setIsLoading(false);
      setShowPublishOptions(false);
    }
  };

  const characterCount = formData.content.length;
  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Créer un nouveau post</h1>
          <p className="text-secondary-500">
            Utilisez l'IA pour générer et optimiser votre contenu
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye size={16} />
            Prévisualiser
          </Button>
          <Button variant="secondary" onClick={() => navigate('/posts')}>
            <X size={16} />
            Annuler
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit('draft'); }} className="space-y-6">
          {/* Title */}
          <div>
            <Input
              label="Titre"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Entrez un titre accrocheur..."
              required
              leftIcon={<FileText size={18} className="text-secondary-400" />}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Contenu
            </label>
            <div className="relative">
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Écrivez votre contenu ici..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between mt-2 text-sm text-secondary-500">
                <div className="flex gap-4">
                  <span>{characterCount} caractères</span>
                  <span>{wordCount} mots</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Tools */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={generateContentWithAI}
              isLoading={isGenerating}
              leftIcon={<Sparkles size={16} />}
            >
              Générer avec IA
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => translateContent('en')}
              isLoading={isGenerating}
              leftIcon={<Globe size={16} />}
            >
              Traduire en EN
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={optimizeContent}
              isLoading={isGenerating}
              leftIcon={<Brain size={16} />}
            >
              Optimiser
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={generateHashtags}
              isLoading={isGenerating}
              leftIcon={<Tag size={16} />}
            >
              Hashtags
            </Button>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Plateformes de publication
            </label>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-lg cursor-pointer hover:bg-secondary-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    name="platforms"
                    value={option.value}
                    checked={formData.platforms.includes(option.value as SocialPlatform)}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Input
              label="Tags"
              placeholder="Ajoutez un tag et appuyez sur Entrée..."
              onKeyDown={handleTagsChange}
              leftIcon={<Tag size={18} className="text-secondary-400" />}
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <Input
              label="URLs des images (séparées par des virgules)"
              name="images"
              value={formData.images.join(', ')}
              onChange={(e) => {
                const urls = e.target.value.split(',').map((url) => url.trim()).filter(Boolean);
                setFormData({ ...formData, images: urls });
              }}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              leftIcon={<Image size={18} className="text-secondary-400" />}
            />
          </div>

          {/* Scheduled Date */}
          <div>
            <Input
              label="Date de publication (optionnel)"
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleInputChange}
              leftIcon={<Calendar size={18} className="text-secondary-400" />}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              isLoading={isLoading}
              leftIcon={<FileText size={16} />}
            >
              Enregistrer comme brouillon
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowPublishOptions(true)}
              isLoading={isLoading}
              leftIcon={<Send size={16} />}
            >
              Publier
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Prévisualisation du post"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">{formData.title || 'Sans titre'}</h3>
            <div className="prose max-w-none text-secondary-700">
              {formData.content || 'Aucun contenu'}
            </div>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-medium text-secondary-600 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {formData.platforms.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-medium text-secondary-600 mb-2">Plateformes</h4>
              <div className="flex flex-wrap gap-2">
                {formData.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center px-2 py-1 bg-secondary-100 text-secondary-800 text-xs font-medium rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Publish Options Modal */}
      <Modal
        isOpen={showPublishOptions}
        onClose={() => setShowPublishOptions(false)}
        title="Options de publication"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Choisissez comment vous souhaitez publier ce post.
          </p>

          {/* Buffer Integration */}
          {bufferProfiles.length > 0 && (
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Plug size={20} className="text-blue-600" />
                <h3 className="font-semibold text-secondary-900">Publier sur Buffer</h3>
              </div>
              <Select
                label="Sélectionnez un profil"
                options={[
                  { value: '', label: 'Ne pas publier sur Buffer' },
                  ...bufferProfiles.map((profile) => ({
                    value: profile.id,
                    label: `${profile.name} (${profile.platform})`,
                  })),
                ]}
                value={selectedBufferProfile}
                onChange={(e) => setSelectedBufferProfile(e.target.value)}
              />
            </div>
          )}

          {/* Asana Integration */}
          {asanaProjects.length > 0 && (
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users size={20} className="text-orange-600" />
                <h3 className="font-semibold text-secondary-900">Créer une tâche Asana</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAsanaTask}
                    onChange={(e) => setCreateAsanaTask(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">Créer une tâche pour ce post</span>
                </label>
                
                {createAsanaTask && (
                  <Select
                    label="Sélectionnez un projet"
                    options={[
                      { value: '', label: 'Projet par défaut' },
                      ...asanaProjects.map((project) => ({
                        value: project.id,
                        label: project.name,
                      })),
                    ]}
                    value={selectedAsanaProject}
                    onChange={(e) => setSelectedAsanaProject(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowPublishOptions(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit('published')}
              isLoading={isPublishing}
              leftIcon={<Check size={16} />}
            >
              Confirmer la publication
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PostCreatePage;
