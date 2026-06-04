import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { postService } from '@/services/postService';
import { Post, PaginatedResponse, PostStatus, SocialPlatform } from '@/types';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Select from '@/components/Select';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PostsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | ''>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'pending_review', label: 'En attente' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'scheduled', label: 'Planifié' },
    { value: 'published', label: 'Publié' },
    { value: 'rejected', label: 'Rejeté' },
  ];

  const platformOptions = [
    { value: '', label: 'Toutes les plateformes' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
  ];

  const limitOptions = [
    { value: '5', label: '5 par page' },
    { value: '10', label: '10 par page' },
    { value: '20', label: '20 par page' },
    { value: '50', label: '50 par page' },
  ];

  useEffect(() => {
    fetchPosts();
  }, [page, limit, searchQuery, statusFilter, platformFilter]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      let result: PaginatedResponse<Post>;
      
      if (searchQuery) {
        result = await postService.searchPosts(searchQuery, page, limit);
      } else if (statusFilter) {
        result = await postService.getPostsByStatus(statusFilter, page, limit);
      } else {
        result = await postService.getAllPosts(page, limit);
      }

      // Filter by platform if selected
      let filteredPosts = result.data;
      if (platformFilter) {
        filteredPosts = filteredPosts.filter((post) =>
          post.platforms?.includes(platformFilter)
        );
      }

      setPosts(filteredPosts);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec du chargement des posts',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      addNotification({
        type: 'success',
        title: 'Post supprimé',
        message: 'Le post a été supprimé avec succès',
      });
      fetchPosts();
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la suppression du post',
      });
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

  const getPlatformIcons = (platforms: SocialPlatform[]) => {
    const icons: Record<SocialPlatform, JSX.Element> = {
      facebook: <span className="text-blue-600">FB</span>,
      twitter: <span className="text-sky-500">TW</span>,
      linkedin: <span className="text-blue-700">LI</span>,
      instagram: <span className="text-pink-500">IG</span>,
      tiktok: <span className="text-black">TT</span>,
    };

    return platforms.map((platform) => (
      <span key={platform} className="text-xs mr-1">
        {icons[platform]}
      </span>
    ));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Gestion des Posts</h1>
          <p className="text-secondary-500">
            Créez, modifiez et publiez vos contenus marketing
          </p>
        </div>
        {hasRole(['admin', 'manager', 'editor']) && (
          <Button asChild>
            <Link to="/posts/create">
              <Plus size={16} />
              Nouveau Post
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Rechercher"
            placeholder="Rechercher par titre ou contenu..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search size={18} className="text-secondary-400" />}
          />
          <Select
            label="Statut"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PostStatus | '');
              setPage(1);
            }}
            leftIcon={<Filter size={18} className="text-secondary-400" />}
          />
          <Select
            label="Plateforme"
            options={platformOptions}
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value as SocialPlatform | '');
              setPage(1);
            }}
            leftIcon={<Filter size={18} className="text-secondary-400" />}
          />
          <Select
            label="Par page"
            options={limitOptions}
            value={limit.toString()}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="text-secondary-300 mx-auto mb-2" />
              <p className="text-secondary-500">Aucun post trouvé</p>
              {hasRole(['admin', 'manager', 'editor']) && (
                <Button asChild className="mt-4">
                  <Link to="/posts/create">Créer un post</Link>
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Titre
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Plateformes
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Auteur
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-100 hover:bg-secondary-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-secondary-900 truncate max-w-xs">
                        {post.title}
                      </div>
                      <div className="text-sm text-secondary-500 line-clamp-1">
                        {post.content.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {getPlatformIcons(post.platforms || [])}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-secondary-700">{post.author?.name}</div>
                      <div className="text-xs text-secondary-400">{post.author?.role}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-secondary-700">
                        {new Date(post.createdAt).toLocaleDateString('fr')}
                      </div>
                      {post.scheduledAt && (
                        <div className="text-xs text-blue-600">
                          Planifié: {new Date(post.scheduledAt).toLocaleDateString('fr')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/posts/${post.id}/edit`)}
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </Button>
                        {hasRole(['admin', 'manager']) && (
                          <>
                            {post.status === 'pending_review' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await postService.approvePost(post.id);
                                    addNotification({
                                      type: 'success',
                                      title: 'Post approuvé',
                                      message: 'Le post a été approuvé',
                                    });
                                    fetchPosts();
                                  } catch (error) {
                                    addNotification({
                                      type: 'error',
                                      title: 'Erreur',
                                      message: 'Échec de l\'approbation',
                                    });
                                  }
                                }}
                                title="Approuver"
                              >
                                <CheckCircle size={16} />
                              </Button>
                            )}
                            {post.status === 'pending_review' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setPostToDelete(post.id);
                                  setDeleteModalOpen(true);
                                }}
                                title="Rejeter"
                              >
                                <XCircle size={16} />
                              </Button>
                            )}
                          </>
                        )}
                        {hasRole(['admin', 'manager', 'editor']) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPostToDelete(post.id);
                              setDeleteModalOpen(true);
                            }}
                            title="Supprimer"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-secondary-500">
              Affichage {((page - 1) * limit + 1)}-{Math.min(page * limit, total)} sur {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
                Précédent
              </Button>
              <span className="text-sm text-secondary-600">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        title="Supprimer le post"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setPostToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => postToDelete && handleDelete(postToDelete)}
              isLoading={isLoading}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PostsPage;
