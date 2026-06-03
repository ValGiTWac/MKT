import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { translationsState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import { translationService } from '@/services/translationService';
import { mistralService } from '@/services/mistralService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate, getStatusColor } from '@/utils/helpers';
import {
  Globe,
  PlusSquare,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  Clock,
  Magic,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Language options
const languageOptions = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'Anglais', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol', flag: '🇪🇸' },
  { code: 'de', name: 'Allemand', flag: '🇩🇪' },
  { code: 'it', name: 'Italien', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹' },
  { code: 'nl', name: 'Néerlandais', flag: '🇳🇱' },
  { code: 'ar', name: 'Arabe', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinois', flag: '🇨🇳' },
  { code: 'ja', name: 'Japonais', flag: '🇯🇵' },
  { code: 'ru', name: 'Russe', flag: '🇷🇺' },
];

// Status options
const statusOptions = [
  { value: 'pending', label: 'En attente', color: getStatusColor('in_review') },
  { value: 'completed', label: 'Terminé', color: getStatusColor('approved') },
  { value: 'needs_review', label: 'À réviser', color: getStatusColor('draft') },
  { value: 'failed', label: 'Échoué', color: getStatusColor('rejected') },
];

export default function TranslationsPage() {
  const navigate = useNavigate();
  const { auth, hasPermission } = useAuth();
  const [translations, setTranslations] = useRecoilState(translationsState);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>([]);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch translations
  const fetchTranslations = async () => {
    try {
      setIsLoading(true);
      
      const response = await translationService.getAll({
        page: 1,
        limit: 50,
        filter: {
          language: languageFilter === 'all' ? undefined : [languageFilter],
          status: statusFilter === 'all' ? undefined : [statusFilter],
          search: searchQuery || undefined,
        },
      });

      setTranslations({
        ...translations,
        translations: response.data,
        total: response.pagination.total,
      });
    } catch (error) {
      toast.error('Échec du chargement des traductions');
      console.error('Fetch translations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, [languageFilter, statusFilter, searchQuery]);

  // Translate with AI
  const handleTranslateWithAI = async (postId: string) => {
    setSelectedPostId(postId);
    setShowTranslateModal(true);
  };

  const confirmTranslateWithAI = async () => {
    if (!selectedPostId || !targetLanguage) return;

    try {
      setIsTranslating(true);
      
      // In a real app, this would call the API to translate the post
      // For now, we'll simulate it
      await mistralService.translate('Sample content', targetLanguage, 'fr');
      
      toast.success(`Traduction vers ${languageOptions.find(l => l.code === targetLanguage)?.name} démarrée`);
      setShowTranslateModal(false);
      setSelectedPostId('');
      setTargetLanguage('en');
      fetchTranslations();
    } catch (error) {
      toast.error(`Échec de la traduction: ${error instanceof Error ? error.message : 'Erreur'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Delete translation
  const handleDeleteTranslation = async (translationId: string) => {
    try {
      await translationService.delete(translationId);
      toast.success('Traduction supprimée avec succès');
      fetchTranslations();
    } catch (error) {
      toast.error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  };

  // Select all translations
  const selectAll = () => {
    if (selectedTranslations.length === translations.translations.length) {
      setSelectedTranslations([]);
    } else {
      setSelectedTranslations(translations.translations.map((t) => t._id));
    }
  };

  // Toggle translation selection
  const toggleTranslationSelection = (translationId: string) => {
    setSelectedTranslations((prev) =>
      prev.includes(translationId) ? prev.filter((id) => id !== translationId) : [...prev, translationId]
    );
  };

  // Get language display name
  const getLanguageName = (code: string) => {
    return languageOptions.find(l => l.code === code)?.name || code;
  };

  // Get language flag
  const getLanguageFlag = (code: string) => {
    return languageOptions.find(l => l.code === code)?.flag || '🌐';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Traductions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {translations.total} traductions trouvées
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasPermission('translate:post') && (
            <Button onClick={() => navigate('/posts')}>
              <PlusSquare className="w-4 h-4 mr-2" />
              Nouvelle Traduction
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {translations.translations.filter(t => t.status === 'pending').length}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Terminées</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {translations.translations.filter(t => t.status === 'completed').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Langues</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(translations.translations.map(t => t.language)).size}
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
                placeholder="Rechercher des traductions..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-t dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Langue</h3>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguageFilter(lang.code)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                      languageFilter === lang.code
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => setLanguageFilter('all')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                    languageFilter === 'all'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  Toutes
                </button>
              </div>
            </div>

            <div>
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
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedTranslations.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedTranslations.length} traduction(s) sélectionnée(s)
            </p>
            <div className="flex items-center gap-2">
              {hasPermission('translate:post') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslateWithAI(selectedTranslations[0])}
                  >
                    <Magic className="w-4 h-4 mr-2" />
                    Traduire avec IA
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => selectedTranslations.forEach(id => handleDeleteTranslation(id))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Translations table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedTranslations.length === translations.translations.length && translations.translations.length > 0}
                  onChange={selectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Post
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Langue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Traducteur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="w-16 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
                </td>
              </tr>
            ) : translations.translations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune traduction trouvée</p>
                </td>
              </tr>
            ) : (
              translations.translations.map((translation) => (
                <tr
                  key={translation._id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTranslations.includes(translation._id)}
                      onChange={() => toggleTranslationSelection(translation._id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/posts/${(translation.post as any)?._id || translation.post}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {(translation.post as any)?.title || 'Post sans titre'}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(translation.post as any)?.platformDisplay || 'Plateforme inconnue'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{getLanguageFlag(translation.language)}</span>
                      <span>{getLanguageName(translation.language)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(translation.status)}`}>
                      {translation.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {(translation.translator as any)?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {(translation.translator as any)?.name || 'Inconnu'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(translation.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/posts/${(translation.post as any)?._id || translation.post}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      {hasPermission('translate:post') && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTranslateWithAI((translation.post as any)?._id || translation.post)}
                          >
                            <Magic className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTranslation(translation._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Translate with AI Modal */}
      {showTranslateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Traduire avec Mistral Vibe
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowTranslateModal(false);
                  setSelectedPostId('');
                  setTargetLanguage('en');
                }}
              >
                <XSquare className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Langue cible
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-3 py-2 text-sm"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTranslateModal(false);
                    setSelectedPostId('');
                    setTargetLanguage('en');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmTranslateWithAI}
                  isLoading={isTranslating}
                >
                  <Magic className="w-4 h-4 mr-2" />
                  Traduire
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {translations.total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Affichage {translations.translations.length} sur {translations.total} traductions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={translations.page === 1}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {translations.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!translations.pagination?.hasNext}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Import XSquare for the modal close button
import { XSquare } from 'lucide-react';
