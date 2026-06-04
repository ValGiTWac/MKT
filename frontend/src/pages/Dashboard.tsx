import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { postService } from '@/services/postService';
import { bufferService } from '@/services/bufferService';
import { asanaService } from '@/services/asanaService';
import { mistralService } from '@/services/mistralService';
import { Post, DashboardStats, PaginatedResponse } from '@/types';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Plug,
  Brain,
  TrendingUp,
  Plus,
  Eye,
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bufferStatus, setBufferStatus] = useState<{ active: boolean; connected: boolean }>({ active: false, connected: false });
  const [asanaStatus, setAsanaStatus] = useState<{ active: boolean; connected: boolean }>({ active: false, connected: false });
  const [mistralStatus, setMistralStatus] = useState<{ active: boolean; model?: string }>({ active: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch stats
        const postsResponse = await postService.getAllPosts(1, 5);
        setRecentPosts(postsResponse.data);
        
        // Fetch integration statuses
        const bufferStatus = await bufferService.checkStatus();
        setBufferStatus({ active: bufferStatus.active, connected: bufferStatus.connected });
        
        const asanaStatus = await asanaService.checkStatus();
        setAsanaStatus({ active: asanaStatus.active, connected: asanaStatus.connected });
        
        const mistralStatus = await mistralService.checkIntegration();
        setMistralStatus(mistralStatus);
        
        // Calculate stats
        setStats({
          totalPosts: postsResponse.total,
          draftPosts: postsResponse.data.filter(p => p.status === 'draft').length,
          pendingPosts: postsResponse.data.filter(p => p.status === 'pending_review').length,
          publishedPosts: postsResponse.data.filter(p => p.status === 'published').length,
          totalUsers: 1, // Will be fetched from API
          activeIntegrations: {
            asana: asanaStatus.connected,
            buffer: bufferStatus.connected,
            mistral: mistralStatus.active,
          },
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-warning">Brouillon</span>;
      case 'pending_review':
        return <span className="badge badge-primary">En attente</span>;
      case 'approved':
        return <span className="badge badge-success">Approuvé</span>;
      case 'scheduled':
        return <span className="badge badge-info">Planifié</span>;
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              Bonjour, {user?.name} !
            </h2>
            <p className="text-secondary-500 mt-1">
              Voici un aperçu de votre activité récente.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/posts">
                <Eye size={16} />
                Voir tous les posts
              </Link>
            </Button>
            {hasRole(['admin', 'manager', 'editor']) && (
              <Button asChild>
                <Link to="/posts/create">
                  <Plus size={16} />
                  Nouveau post
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats?.totalPosts || 0}</p>
              <p className="text-sm text-secondary-500">Posts totaux</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats?.draftPosts || 0}</p>
              <p className="text-sm text-secondary-500">Brouillons</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats?.pendingPosts || 0}</p>
              <p className="text-sm text-secondary-500">En attente</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats?.publishedPosts || 0}</p>
              <p className="text-sm text-secondary-500">Publiés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Intégrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Mistral Vibe</p>
                <p className="text-xs text-secondary-500">Génération de contenu IA</p>
              </div>
            </div>
            {mistralStatus.active ? (
              <span className="badge badge-success">Actif</span>
            ) : (
              <span className="badge badge-error">Inactif</span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plug size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Buffer</p>
                <p className="text-xs text-secondary-500">Publication réseaux sociaux</p>
              </div>
            </div>
            {bufferStatus.connected ? (
              <span className="badge badge-success">Connecté</span>
            ) : (
              <span className="badge badge-warning">Non connecté</span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Asana</p>
                <p className="text-xs text-secondary-500">Gestion des tâches</p>
              </div>
            </div>
            {asanaStatus.connected ? (
              <span className="badge badge-success">Connecté</span>
            ) : (
              <span className="badge badge-warning">Non connecté</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Posts récents</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/posts">Voir tout</Link>
          </Button>
        </div>
        
        {recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={48} className="text-secondary-300 mx-auto mb-2" />
            <p className="text-secondary-500">Aucun post récent</p>
            {hasRole(['admin', 'manager', 'editor']) && (
              <Button asChild className="mt-4">
                <Link to="/posts/create">Créer un post</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}/edit`}
                className="flex items-center justify-between p-3 hover:bg-secondary-50 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900 truncate">{post.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-secondary-500">
                    <span>{post.author?.name}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('fr')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(post.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
