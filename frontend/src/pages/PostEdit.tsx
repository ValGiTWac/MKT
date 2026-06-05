import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { postService } from '@/services/postService';
import { mistralService, BufferProfilesResponse, AsanaProjectsResponse } from '@/services/mistralService';
import { Post, SocialPlatform, PostStatus, BufferProfile, AsanaProject } from '@/types';
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
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const PostEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([]);
  const [asanaProjects, setAsanaProjects] = useState<AsanaProject[]>([]);
  const [selectedBufferProfile, setSelectedBufferProfile] = useState<string>('');
  const [selectedAsanaProject, setSelectedAsanaProject] = useState<string>('');
  const [createAsanaTask, setCreateAsanaTask] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'schedule' | 'publish' | null>(null);

  const platformOptions = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'pending_review', label: 'En attente de validation' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'scheduled', label: 'Planifié' },
    { value: 'published', label: 'Publié' },
    { value: 'rejected', label: 'Rejeté' },
  ];

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        
        const postData = await postService.getPostById(id);
        setPost(postData);
        
        // Fetch integrations via Mistral Vibe MCP
        try {
          const bufferResponse = await mistralService.getBufferProfiles();
          setBufferProfiles(bufferResponse.profiles || []);
        } catch (bufferError) {
          console.log('Buffer integration not available via Mistral Vibe MCP');
        }

        try {
          const asanaResponse = await mistralService.getAsanaProjects();
          setAsanaProjects(asanaResponse.projects || []);
        } catch (asanaError) {
          console.log('Asana integration not available via Mistral Vibe MCP');
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Échec du chargement du post',
        });
        navigate('/posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!post) return;
    
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      const platforms = post.platforms || [];
      if (checked) {
        setPost({ ...post, platforms: [...platforms, value as SocialPlatform] });
      } else {
        setPost({ ...post, platforms: platforms.filter((p) => p !== value) });
      }
    } else {
      setPost({ ...post, [name]: value });
    }
  };

  const handleTagsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!post) return;
    
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase();
      if (!post.tags?.includes(newTag)) {
        setPost({ ...post, tags: [...(post.tags || []), newTag] });
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    if (!post) return;
    setPost({ ...post, tags: post.tags?.filter((t) => t !== tag) || [] });
  };

  const handleSave = async () => {
    if (!post || !id) return;
    
    try {
      setIsSaving(true);
      await postService.updatePost(id, post);
      
      addNotification({
        type: 'success',
        title: 'Post mis à jour',
        message: 'Le post a été mis à jour avec succès',
      });
    } catch (error) {
      console.error('Failed to update post:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la mise à jour du post',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await postService.deletePost(id);
      addNotification({
        type: 'success',
        title: 'Post supprimé',
        message: 'Le post a été supprimé avec succès',
      });
      navigate('/posts');
    } catch (error) {
      console.error('Failed to delete post:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la suppression du post',
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleAction = async (actionType: 'approve' | 'reject' | 'schedule' | 'publish') => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      
      let result;
      switch (actionType) {
        case 'approve':
          result = await postService.approvePost(id);
          break;
        case 'reject':
          result = await postService.rejectPost(id);
          break;
        case 'schedule':
          result = await postService.schedulePost(id, new Date().toISOString());
          break;
        case 'publish':
          result = await postService.publishPost(id);
          
          // Handle Buffer publishing via Mistral Vibe MCP
          if (selectedBufferProfile) {
            const profile = bufferProfiles.find((p) => p.id === selectedBufferProfile);
            if (profile && post) {
              await mistralService.publishToBuffer({
                post: {
                  text: post.content || '',
                  mediaUrls: post.images,
                  platform: profile.platform as 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok',
                },
                profileId: profile.id,
              });
              addNotification({
                type: 'success',
                title: 'Publié sur Buffer',
                message: 'Le post a été publié sur Buffer via Mistral Vibe MCP',
              });
            }
          }
          
          // Handle Asana task creation via Mistral Vibe MCP
          if (createAsanaTask && selectedAsanaProject) {
            await mistralService.createAsanaTaskFromPost(id, selectedAsanaProject);
            addNotification({
              type: 'success',
              title: 'Tâche Asana créée',
              message: 'Une tâche a été créée dans Asana via Mistral Vibe MCP',
            });
          } else if (createAsanaTask && !selectedAsanaProject) {
            // Create task without specific project
            await mistralService.createAsanaTaskFromPost(id);
            addNotification({
              type: 'success',
              title: 'Tâche Asana créée',
              message: 'Une tâche a été créée dans Asana via Mistral Vibe MCP',
            });
          }
          break;
      }
      
      setPost(result);
      setShowPublishModal(false);
      setAction(null);
      
      addNotification({
        type: 'success',
        title: 'Action effectuée',
        message: `Le post a été ${actionType === 'approve' ? 'approuvé' : actionType === 'reject' ? 'rejeté' : actionType === 'schedule' ? 'planifié' : 'publié'}`,
      });
    } catch (error) {
      console.error(`Failed to ${actionType} post:`, error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: `Échec de l'action`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateContentWithAI = async () => {
    if (!post || !post.title.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez entrer un titre pour générer du contenu',
      });
      return;
    }

    try {
      setIsGenerating(true);
      const prompt = `Améliorez le contenu suivant pour les réseaux sociaux: ${post.title}. 
      Contenu actuel: ${post.content || 'Aucun contenu'}
      
      Améliorez-le pour le rendre plus engageant et professionnel.`;

      const result = await mistralService.generateContent({
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      });

      const generatedContent = result.choices?.[0]?.text || '';
      setPost({ ...post, content: generatedContent });
      
      addNotification({
        type: 'success',
        title: 'Contenu généré',
        message: 'Le contenu a été amélioré avec Mistral Vibe',
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
    if (!post || !post.content?.trim()) {
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
        text: post.content,
        target_language: targetLanguage,
      });

      // Update post content with translation
      setPost({ ...post, content: result.translated_text });
      
      addNotification({
        type: 'info',
        title: 'Traduction',
        message: `Contenu traduit en ${targetLanguage.toUpperCase()}`,
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
    if (!post || !post.content?.trim()) {
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
        content: post.content,
        targetAudience: 'marketing professionals',
        tone: 'professional',
      });

      setPost({ ...post, content: result.optimizedContent });
      
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
    if (!post || !post.content?.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez entrer du contenu pour générer des hashtags',
      });
      return;
    }

    try {
      setIsGenerating(true);
      const hashtags = await mistralService.generateHashtags(post.content, 5);
      setPost({ ...post, tags: [...(post.tags || []), ...hashtags] });
      
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

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-warning">Brouillon</span>;
      case 'pending_review':
        return <span className="badge badge-primary">En attente</span>;
      case 'approved':
        return <span className="badge badge-success">Approuvé</span>;
      case 'scheduled':
        return <span className="badge bg-blue-100 text-blue-800">Planifié</span>;
      case 'published':
        return <span className="badge bg-green-100 text-green-800">Publié</span>;
      case 'rejected':
        return <span className="badge badge-error">Rejeté</span>;
      default:
        return <span className="badge badge-secondary">Inconnu</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-8">
        <FileText size={48} className="text-secondary-300 mx-auto mb-2" />
        <p className="text-secondary-500">Post non trouvé</p>
        <Button asChild className="mt-4">
          <Link to="/posts">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const characterCount = post.content?.length || 0;
  const wordCount = post.content?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Modifier le post</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(post.status)}
            <span className="text-sm text-secondary-500">
              Créé le {new Date(post.createdAt).toLocaleDateString('fr')}
            </span>
          </div>
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
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Title */}
          <div>
            <Input
              label="Titre"
              name="title"
              value={post.title}
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
                value={post.content || ''}
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
              Améliorer avec IA
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
                    checked={(post.platforms || []).includes(option.value as SocialPlatform)}
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
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags.map((tag) => (
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
              value={(post.images || []).join(', ')}
              onChange={(e) => {
                const urls = e.target.value.split(',').map((url: string) => url.trim()).filter(Boolean);
                setPost({ ...post, images: urls });
              }}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              leftIcon={<Image size={18} className="text-secondary-400" />}
            />
          </div>

          {/* Status */}
          {hasRole(['admin', 'manager']) && (
            <div>
              <Select
                label="Statut"
                name="status"
                value={post.status}
                onChange={handleInputChange}
                options={statusOptions}
                leftIcon={<Clock size={18} className="text-secondary-400" />}
              />
            </div>
          )}

          {/* Scheduled Date */}
          <div>
            <Input
              label="Date de publication (optionnel)"
              type="datetime-local"
              name="scheduledAt"
              value={post.scheduledAt || ''}
              onChange={handleInputChange}
              leftIcon={<Calendar size={18} className="text-secondary-400" />}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="outline"
              isLoading={isSaving}
              leftIcon={<FileText size={16} />}
            >
              Enregistrer
            </Button>
            
            {hasRole(['admin', 'manager']) && post.status === 'pending_review' && (
              <>
                <Button
                  type="button"
                  variant="success"
                  onClick={() => { setAction('approve'); setShowPublishModal(true); }}
                  isLoading={isSaving}
                  leftIcon={<CheckCircle size={16} />}
                >
                  Approuver
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => { setAction('reject'); setShowPublishModal(true); }}
                  isLoading={isSaving}
                  leftIcon={<XCircle size={16} />}
                >
                  Rejeter
                </Button>
              </>
            )}
            
            {hasRole(['admin', 'manager', 'editor']) && (
              <>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => { setAction('publish'); setShowPublishModal(true); }}
                  isLoading={isSaving}
                  leftIcon={<Send size={16} />}
                >
                  Publier
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  isLoading={isSaving}
                  leftIcon={<Trash2 size={16} />}
                >
                  Supprimer
                </Button>
              </>
            )}
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
            <h3 className="text-xl font-bold text-secondary-900 mb-2">{post.title || 'Sans titre'}</h3>
            <div className="prose max-w-none text-secondary-700">
              {post.content || 'Aucun contenu'}
            </div>
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-medium text-secondary-600 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
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

          {post.platforms && post.platforms.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-medium text-secondary-600 mb-2">Plateformes</h4>
              <div className="flex flex-wrap gap-2">
                {post.platforms.map((platform) => (
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

      {/* Publish Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => { setShowPublishModal(false); setAction(null); }}
        title={action === 'approve' ? 'Approuver le post' : action === 'reject' ? 'Rejeter le post' : 'Publier le post'}
        size="lg"
      >
        <div className="space-y-4">
          {action === 'reject' && (
            <div>
              <Input
                label="Raison du rejet (optionnel)"
                placeholder="Expliquez pourquoi ce post est rejeté..."
                rows={3}
              />
            </div>
          )}

          {action === 'publish' && (
            <>
              {/* Buffer Integration via Mistral Vibe MCP */}
              {bufferProfiles.length > 0 && (
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Plug size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-secondary-900">Publier sur Buffer via Mistral Vibe</h3>
                  </div>
                  <Select
                    label="Sélectionnez un profil Buffer"
                    options={[
                      { value: '', label: 'Ne pas publier sur Buffer' },
                      ...bufferProfiles.map((profile) => ({
                        value: profile.id,
                        label: `${profile.name || profile.platformUsername} (${profile.platform})`,
                      })),
                    ]}
                    value={selectedBufferProfile}
                    onChange={(e) => setSelectedBufferProfile(e.target.value)}
                  />
                  <p className="text-sm text-secondary-500 mt-2">
                    Mistral Vibe MCP gère la connexion et la publication sur Buffer.
                  </p>
                </div>
              )}

              {/* Asana Integration via Mistral Vibe MCP */}
              {asanaProjects.length > 0 && (
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={20} className="text-orange-600" />
                    <h3 className="font-semibold text-secondary-900">Créer une tâche Asana via Mistral Vibe</h3>
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
                        label="Sélectionnez un projet Asana"
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
                    <p className="text-sm text-secondary-500 mt-2">
                      Mistral Vibe MCP gère la connexion et la création de tâches dans Asana.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => { setShowPublishModal(false); setAction(null); }}>
              Annuler
            </Button>
            {action && (
              <Button
                variant={action === 'reject' ? 'danger' : 'primary'}
                onClick={() => action && handleAction(action)}
                isLoading={isSaving}
                leftIcon={action === 'approve' ? <CheckCircle size={16} /> : action === 'reject' ? <XCircle size={16} /> : <Send size={16} />}
              >
                {action === 'approve' ? 'Approuver' : action === 'reject' ? 'Rejeter' : 'Publier'}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le post"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isSaving}
              leftIcon={<Trash2 size={16} />}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PostEditPage;
