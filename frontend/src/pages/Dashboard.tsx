import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { dashboardStatsState, postsState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/services/postService';
import { Button } from '@/components/ui/Button';
import { cn, formatDate, getStatusColor } from '@/utils/helpers';
import {
  FileText,
  PlusSquare,
  CheckSquare,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  MoreVertical,
} from 'lucide-react';

// Stats cards
type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
};

function StatCard({ title, value, icon, color = 'bg-blue-500', trend, trendDirection }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            {trend !== undefined && (
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  trendDirection === 'up' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                  trendDirection === 'down' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
                  trendDirection === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {trendDirection === 'up' && '+'}{trend}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Quick actions
function QuickActionCard() {
  const { hasPermission } = useAuth();

  const actions = [
    {
      title: 'Créer un Post',
      description: 'Rédigez un nouveau post avec Mistral Vibe',
      href: '/posts/create',
      icon: <PlusSquare className="w-5 h-5" />,
      color: 'bg-blue-500',
      permission: 'create:post',
    },
    {
      title: 'Voir les Validations',
      description: 'Validez les posts en attente',
      href: '/validations',
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'bg-green-500',
      permission: 'approve:post',
    },
    {
      title: 'Gérer les Traductions',
      description: 'Traduisez vos posts dans plusieurs langues',
      href: '/translations',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-purple-500',
      permission: 'translate:post',
    },
    {
      title: 'Calendrier',
      description: 'Planifiez vos publications',
      href: '/calendar',
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-orange-500',
      permission: 'read:post',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions
          .filter((action) => hasPermission(action.permission))
          .map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                {action.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

// Recent posts
function RecentPostsCard() {
  const [posts, setPosts] = useRecoilState(postsState);
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await postService.getAll({
          page: 1,
          limit: 5,
          sort: { field: 'createdAt', order: 'desc' },
        });
        setPosts((prev) => ({ ...prev, posts: response.data, total: response.pagination.total }));
      } catch (error) {
        console.error('Failed to fetch recent posts:', error);
      }
    };

    fetchRecentPosts();
  }, [setPosts]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Posts récents</h3>
        {hasPermission('create:post') && (
          <Button size="sm" onClick={() => window.location.href = '/posts/create'}>
            Voir tout
          </Button>
        )}
      </div>

      {posts.posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucun post récent</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.posts.slice(0, 5).map((post) => (
            <Link
              key={post._id}
              to={`/posts/${post._id}`}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{getPlatformIcon(post.platform)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">{post.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(post.status)}`}>
                    {post.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {post.author.name}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Platform distribution chart
function PlatformDistributionCard() {
  const [stats, setStats] = useRecoilState(dashboardStatsState);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await postService.getStats();
        setStats((prev) => ({ ...prev, ...data, loading: false }));
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [setStats]);

  const platforms = [
    { name: 'Facebook', value: stats.postsByPlatform?.facebook || 0, color: 'bg-blue-500' },
    { name: 'Twitter', value: stats.postsByPlatform?.twitter || 0, color: 'bg-blue-400' },
    { name: 'Instagram', value: stats.postsByPlatform?.instagram || 0, color: 'bg-pink-500' },
    { name: 'LinkedIn', value: stats.postsByPlatform?.linkedin || 0, color: 'bg-blue-700' },
    { name: 'TikTok', value: stats.postsByPlatform?.tiktok || 0, color: 'bg-black' },
    { name: 'Autres', value: stats.postsByPlatform?.youtube || 0, color: 'bg-gray-500' },
  ];

  const total = platforms.reduce((sum, platform) => sum + platform.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Répartition par plateforme</h3>
      {total === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{platform.name}</span>
                </div>
              </div>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${platform.color} rounded-full`}
                  style={{ width: `${(platform.value / total) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right text-sm text-gray-500 dark:text-gray-400">
                {platform.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Activity timeline
function ActivityTimelineCard() {
  const activities = [
    { type: 'created', title: 'Nouveau post créé', time: 'Il y a 2 min', user: 'Marie Dupont' },
    { type: 'approved', title: 'Post approuvé', time: 'Il y a 15 min', user: 'Jean Martin' },
    { type: 'published', title: 'Post publié sur LinkedIn', time: 'Il y a 1 heure', user: 'System' },
    { type: 'translated', title: 'Traduction terminée', time: 'Il y a 3 heures', user: 'Sophie Leroy' },
    { type: 'rejected', title: 'Post rejeté', time: 'Il y a 5 heures', user: 'Pierre Durand' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <PlusSquare className="w-4 h-4 text-blue-500" />;
      case 'approved':
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      case 'published':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'translated':
        return <Globe className="w-4 h-4 text-orange-500" />;
      case 'rejected':
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activité récente</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{activity.user}</p>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard component
export default function DashboardPage() {
  const { auth } = useAuth();
  const [stats, setStats] = useRecoilState(dashboardStatsState);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true }));
        
        // Fetch stats
        const statsData = await postService.getStats();
        
        setStats({
          ...stats,
          ...statsData,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setStats((prev) => ({ ...prev, loading: false, error: 'Failed to load data' }));
      }
    };

    fetchDashboardData();
  }, [setStats, stats]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bonjour, {auth.user?.name || 'Utilisateur'} !
        </h1>
        <p className="opacity-90">
          Voici un aperçu de votre activité marketing pour aujourd'hui.
        </p>
        <div className="mt-4 flex gap-4">
          <Button variant="outline" className="bg-white/20 border-white/30 hover:bg-white/30 text-white">
            <PlusSquare className="w-4 h-4 mr-2" />
            Nouveau Post
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <Calendar className="w-4 h-4 mr-2" />
            Voir le Calendrier
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Posts Totaux"
          value={stats.totalPosts}
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          trend={12}
          trendDirection="up"
        />
        <StatCard
          title="En attente de validation"
          value={stats.teamActivity.pendingValidations}
          icon={<CheckSquare className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          trend={5}
          trendDirection="down"
        />
        <StatCard
          title="Traductions en cours"
          value={stats.teamActivity.pendingTranslations}
          icon={<Globe className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          trend={8}
          trendDirection="up"
        />
        <StatCard
          title="Utilisateurs actifs"
          value={stats.teamActivity.activeUsers}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-green-500"
          trend={3}
          trendDirection="up"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <QuickActionCard />
          <RecentPostsCard />
        </div>
        <div className="space-y-6">
          <PlatformDistributionCard />
          <ActivityTimelineCard />
        </div>
      </div>
    </div>
  );
}

// Helper function for platform icons
function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: '📘',
    twitter: '🐦',
    instagram: '📷',
    linkedin: '💼',
    tiktok: '🎵',
    youtube: '📺',
    pinterest: '📌',
  };
  return icons[platform.toLowerCase()] || '🌐';
}
