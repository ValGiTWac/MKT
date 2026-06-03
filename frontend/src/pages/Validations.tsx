import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { validationsState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import { validationService } from '@/services/validationService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate, getStatusColor } from '@/utils/helpers';
import {
  CheckSquare,
  XSquare,
  Clock,
  Eye,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ValidationsPage() {
  const navigate = useNavigate();
  const { auth, hasPermission } = useAuth();
  const [validations, setValidations] = useRecoilState(validationsState);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [showFilters, setShowFilters] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'En attente', color: getStatusColor('in_review') },
    { value: 'approved', label: 'Approuvé', color: getStatusColor('approved') },
    { value: 'rejected', label: 'Rejeté', color: getStatusColor('rejected') },
    { value: 'changes_requested', label: 'Modifications demandées', color: getStatusColor('draft') },
  ];

  // Fetch validations
  const fetchValidations = async () => {
    try {
      setIsLoading(true);
      
      const response = await validationService.getAll({
        page: 1,
        limit: 50,
        filter: {
          status: statusFilter === 'all' ? undefined : [statusFilter],
          search: searchQuery || undefined,
        },
      });

      setValidations({
        ...validations,
        validations: response.data,
        total: response.pagination.total,
        pendingValidations: response.data.filter(v => v.status === 'pending'),
      });
    } catch (error) {
      toast.error('Échec du chargement des validations');
      console.error('Fetch validations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValidations();
  }, [statusFilter, searchQuery]);

  // Handle validation action
  const handleValidationAction = async (validationId: string, action: 'approve' | 'reject' | 'request_changes', changes?: string[]) => {
    try {
      switch (action) {
        case 'approve':
          await validationService.approve(validationId, 'Approuvé');
          toast.success('Validation approuvée');
          break;
        case 'reject':
          await validationService.reject(validationId, 'Rejeté');
          toast.success('Validation rejetée');
          break;
        case 'request_changes':
          await validationService.requestChanges(validationId, 'Modifications demandées', changes || []);
          toast.success('Modifications demandées');
          break;
      }
      fetchValidations();
    } catch (error) {
      toast.error(`Échec de l'action: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  };

  // Refresh validations
  const handleRefresh = () => {
    fetchValidations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {validations.total} validations trouvées
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {validations.pendingValidations.length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approuvées</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {validations.validations.filter(v => v.status === 'approved').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <XSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rejetées</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {validations.validations.filter(v => v.status === 'rejected').length}
              </h3>
            </div>
          </div>
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
                placeholder="Rechercher des validations..."
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
          <div className="pb-4 border-t dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Statut</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                    statusFilter === option.value
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === 'all'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                Tous
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validations table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Post
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Validateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Commentaires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="w-20 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
                </td>
              </tr>
            ) : validations.validations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune validation trouvée</p>
                </td>
              </tr>
            ) : (
              validations.validations.map((validation) => (
                <tr
                  key={validation._id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/posts/${(validation.post as any)?._id || validation.post}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {(validation.post as any)?.title || 'Post sans titre'}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(validation.post as any)?.platformDisplay || 'Plateforme inconnue'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {(validation.validator as any)?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {(validation.validator as any)?.name || 'Inconnu'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(validation.status)}`}>
                      {validation.statusDisplay || validation.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {validation.comments || 'Aucun commentaire'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(validation.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/posts/${(validation.post as any)?._id || validation.post}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      {validation.status === 'pending' && hasPermission('approve:post') && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleValidationAction(validation._id, 'approve')}
                            className="text-green-600 dark:text-green-400"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleValidationAction(validation._id, 'reject')}
                            className="text-red-600 dark:text-red-400"
                          >
                            <XSquare className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pending validations for current user */}
      {hasPermission('approve:post') && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mes validations en attente
          </h2>
          {validations.pendingValidations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Aucune validation en attente
            </p>
          ) : (
            <div className="space-y-4">
              {validations.pendingValidations.map((validation) => (
                <div
                  key={validation._id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <Link
                      to={`/posts/${(validation.post as any)?._id || validation.post}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {(validation.post as any)?.title || 'Post sans titre'}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Soumis le {formatDate(validation.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleValidationAction(validation._id, 'approve')}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidationAction(validation._id, 'reject')}
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                    >
                      <XSquare className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Create a validation service for the frontend
// This is a temporary implementation - in a real app, this would be in a separate file
const validationService = {
  async getAll(params: any) {
    // In a real app, this would call the API
    return {
      data: [],
      pagination: { total: 0, page: 1, limit: 10 },
    };
  },
  async approve(id: string, comments: string) {
    // In a real app, this would call the API
    return { success: true };
  },
  async reject(id: string, comments: string) {
    // In a real app, this would call the API
    return { success: true };
  },
  async requestChanges(id: string, comments: string, changes: string[]) {
    // In a real app, this would call the API
    return { success: true };
  },
};
