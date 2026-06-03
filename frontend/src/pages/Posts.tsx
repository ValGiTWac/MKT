import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { postsState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/services/postService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate, getPlatformIcon, getStatusColor, getPriorityColor } from '@/utils/helpers';
import {
  FileText,
  PlusSquare,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  Clock,
  Calendar,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PostStatus, PostPlatform, PostPriority, SortOptions } from '@/types';

export default function PostsPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [posts, setPosts] = useRecoilState(postsState);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: [] as string[],
    platform: [] as string[],
    priority: [] as string[],
  });
  const [sort, setSort] = useState({ field: 'createdAt', order: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Status options
  const statusOptions = [
    { value: 'draft', label: 'Brouillon', color: getStatusColor('draft') },
    { value: 'in_review', label: 'En revue', color: getStatusColor('in_review') },
    { value: 'approved', label: 'Approuvé', color: getStatusColor('approved') },
    { value: 'published', label: 'Publié', color: getStatusColor('published') },
    { value: 'rejected', label: 'Rejeté', color: getStatusColor('rejected') },
    { value: 'scheduled', label: 'Planifié', color: getStatusColor('scheduled') },
  ];

  // Platform options
  const platformOptions = [
    { value: 'facebook', label: 'Facebook', icon: getPlatformIcon('facebook') },
    { value: 'twitter', label: 'Twitter', icon: getPlatformIcon('twitter') },
    { value: 'instagram', label: 'Instagram', icon: getPlatformIcon('instagram') },
    { value: 'linkedin', label: 'LinkedIn', icon: getPlatformIcon('linkedin') },
    { value: 'tiktok', label: 'TikTok', icon: getPlatformIcon('tiktok') },
    { value: 'youtube', label: 'YouTube', icon: getPlatformIcon('youtube') },
    { value: 'pinterest', label: 'Pinterest', icon: getPlatformIcon('pinterest') },
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Faible', color: getPriorityColor('low') },
    { value: 'medium', label: 'Moyenne', color: getPriorityColor('medium') },
    { value: 'high', label: 'Élevée', color: getPriorityColor('high') },
    { value: 'urgent', label: 'Urgente', color: getPriorityColor('urgent') },
  ];

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      const response = await postService.getAll({
        page: 1,
        limit: 50,
        filter: {
          status: filters.status.length > 0 ? filters.status as PostStatus[] : undefined,
          platform: filters.platform.length > 0 ? filters.platform as PostPlatform[] : undefined,
          priority: filters.priority.length > 0 ? filters.priority as PostPriority[] : undefined,
          search: searchQuery || undefined,
        },
        sort: sort as SortOptions,
      });

      setPosts({
        ...posts,
        posts: response.data,
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
        filters: { ...filters, search: searchQuery },
      });
    } catch (error) {
      toast.error('Échec du chargement des posts');
      console.error('Fetch posts error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters, sort, searchQuery]);

  // Toggle filter
  const toggleFilter = (category: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category as keyof typeof filters].includes(value)
        ? prev[category as keyof typeof filters].filter((v) => v !== value)
        : [...prev[category as keyof typeof filters], value],
    }));
  };

  // Toggle sort
  const toggleSort = (field: string) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Select all posts
  const selectAll = () => {
    if (selectedPosts.length === posts.posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.posts.map((post) => post._id));
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  // Bulk actions
  const handleBulkAction = async (action: 'delete' | 'approve' | 'publish') => {
    if (selectedPosts.length === 0) {
      toast.error('Veuillez sélectionner au moins un post');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          await postService.bulkDelete(selectedPosts);
          toast.success(`${selectedPosts.length} posts supprimés`);
          break;
        case 'approve':
          // In a real app, you would call an approve endpoint
          toast.success(`${selectedPosts.length} posts approuvés`);
          break;
        case 'publish':
          // In a real app, you would call a publish endpoint
          toast.success(`${selectedPosts.length} posts publiés`);
          break;
      }
      
      // Refresh posts
      fetchPosts();
      setSelectedPosts([]);
    } catch (error) {
      toast.error(`Échec de l'action: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  };

  // Delete single post
  const handleDeletePost = async (postId: string) => {
    try {
      await postService.delete(postId);
      toast.success('Post supprimé avec succès');
      fetchPosts();
    } catch (error) {
      toast.error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tous les Posts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {posts.total} posts trouvés
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasPermission('create:post') && (
            <Button onClick={() => navigate('/posts/create')}>
              <PlusSquare className="w-4 h-4 mr-2" />
              Nouveau Post
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher des posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-t dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Statut</h3>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('status', option.value)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                      filters.status.includes(option.value)
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Plateforme</h3>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('platform', option.value)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                      filters.platform.includes(option.value)
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Priorité</h3>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('priority', option.value)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                      filters.priority.includes(option.value)
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedPosts.length} post(s) sélectionné(s)
            </p>
            <div className="flex items-center gap-2">
              {hasPermission('approve:post') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              )}
              {hasPermission('publish:post') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('publish')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              )}
              {hasPermission('delete:post') && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedPosts.length === posts.posts.length && posts.posts.length > 0}
                  onChange={selectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Titre
                  {sort.field === 'title' && (
                    sort.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => toggleSort('platform')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Plateforme
                  {sort.field === 'platform' && (
                    sort.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priorité
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => toggleSort('author')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Auteur
                  {sort.field === 'author' && (
                    sort.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => toggleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Date
                  {sort.field === 'createdAt' && (
                    sort.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="w-16 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
                </td>
              </tr>
            ) : posts.posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun post trouvé</p>
                </td>
              </tr>
            ) : (
              posts.posts.map((post) => (
                <tr
                  key={post._id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post._id)}
                      onChange={() => togglePostSelection(post._id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/posts/${post._id}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {post.title}
                    </Link>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{post.tags.length - 2} autres
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xl">{getPlatformIcon(post.platform)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(post.status)}`}>
                      {post.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(post.priority)}`}>
                      {post.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {(post.author as any)?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {(post.author as any)?.name || 'Inconnu'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/posts/${post._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      {hasPermission('update:post') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/posts/${post._id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      {hasPermission('delete:post') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {posts.total > posts.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Affichage {posts.posts.length} sur {posts.total} posts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={posts.page === 1}
              onClick={() => setPosts((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {posts.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!posts.pagination?.hasNext}
              onClick={() => setPosts((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
