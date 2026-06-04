import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { bufferService } from '@/services/bufferService';
import { asanaService } from '@/services/asanaService';
import { mistralService } from '@/services/mistralService';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Plug,
  Users,
  Brain,
  Check,
  X,
  Link,
  Unlink,
  Settings,
  BarChart3,
  Calendar,
  Clock,
} from 'lucide-react';

const IntegrationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [bufferStatus, setBufferStatus] = useState<{
    active: boolean;
    connected: boolean;
    profiles?: { id: string; platform: string; name: string }[];
  }>({ active: false, connected: false });
  const [asanaStatus, setAsanaStatus] = useState<{
    active: boolean;
    connected: boolean;
    workspaceId?: string;
    userId?: string;
    projects?: { id: string; name: string }[];
  }>({ active: false, connected: false });
  const [mistralStatus, setMistralStatus] = useState<{
    active: boolean;
    model?: string;
  }>({ active: false });
  
  const [bufferAnalytics, setBufferAnalytics] = useState<{
    totalPosts: number;
    engagement: number;
    reach: number;
    byPlatform: Record<string, { posts: number; engagement: number }>;
  } | null>(null);
  
  const [asanaAnalytics, setAsanaAnalytics] = useState<{
    totalTasks: number;
    completedTasks: number;
    byProject: Record<string, { tasks: number; completed: number }>;
  } | null>(null);

  useEffect(() => {
    if (!hasRole(['admin', 'manager'])) {
      return;
    }
    
    fetchData();
  }, [hasRole]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Buffer status and data
      const bufferStatus = await bufferService.checkStatus();
      setBufferStatus(bufferStatus);
      
      if (bufferStatus.connected) {
        try {
          const profiles = await bufferService.getProfiles();
          setBufferStatus({ ...bufferStatus, profiles });
          
          const analytics = await bufferService.getAnalytics(30);
          setBufferAnalytics(analytics);
        } catch (error) {
          console.error('Failed to fetch Buffer data:', error);
        }
      }

      // Fetch Asana status and data
      const asanaStatus = await asanaService.checkStatus();
      setAsanaStatus(asanaStatus);
      
      if (asanaStatus.connected) {
        try {
          const projects = await asanaService.getProjects();
          setAsanaStatus({ ...asanaStatus, projects });
          
          const analytics = await asanaService.getAnalytics(30);
          setAsanaAnalytics(analytics);
        } catch (error) {
          console.error('Failed to fetch Asana data:', error);
        }
      }

      // Fetch Mistral status
      const mistralStatus = await mistralService.checkIntegration();
      setMistralStatus(mistralStatus);
    } catch (error) {
      console.error('Failed to fetch integrations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBufferConnect = async () => {
    try {
      const { url } = await bufferService.connectBuffer();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to connect Buffer:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la connexion à Buffer',
      });
    }
  };

  const handleBufferDisconnect = async () => {
    try {
      await bufferService.disconnectBuffer();
      setBufferStatus({ ...bufferStatus, connected: false, profiles: undefined });
      setBufferAnalytics(null);
      addNotification({
        type: 'success',
        title: 'Buffer déconnecté',
        message: 'Buffer a été déconnecté avec succès',
      });
    } catch (error) {
      console.error('Failed to disconnect Buffer:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la déconnexion de Buffer',
      });
    }
  };

  const handleAsanaConnect = async () => {
    try {
      const { url } = await asanaService.connectAsana();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to connect Asana:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la connexion à Asana',
      });
    }
  };

  const handleAsanaDisconnect = async () => {
    try {
      await asanaService.disconnectAsana();
      setAsanaStatus({ ...asanaStatus, connected: false, projects: undefined });
      setAsanaAnalytics(null);
      addNotification({
        type: 'success',
        title: 'Asana déconnecté',
        message: 'Asana a été déconnecté avec succès',
      });
    } catch (error) {
      console.error('Failed to disconnect Asana:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la déconnexion de Asana',
      });
    }
  };

  if (!hasRole(['admin', 'manager'])) {
    return (
      <div className="text-center py-8">
        <Settings size={48} className="text-secondary-300 mx-auto mb-2" />
        <p className="text-secondary-500">Accès refusé</p>
        <p className="text-sm text-secondary-400">Vous n'avez pas les permissions nécessaires</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Gestion des intégrations</h1>
        <p className="text-secondary-500">
          Configurez et gérez les intégrations avec les services externes
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mistral Vibe */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Mistral Vibe</h2>
                <p className="text-secondary-500">Génération de contenu IA</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Statut</h3>
                <div className="flex items-center gap-2">
                  {mistralStatus.active ? (
                    <>
                      <span className="badge badge-success">Actif</span>
                      {mistralStatus.model && (
                        <span className="text-secondary-600">Modèle: {mistralStatus.model}</span>
                      )}
                    </>
                  ) : (
                    <span className="badge badge-error">Inactif</span>
                  )}
                </div>
                <p className="text-sm text-secondary-500 mt-2">
                  Mistral Vibe est utilisé pour la génération, traduction et optimisation de contenu.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Fonctionnalités</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Génération de contenu
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Traduction automatique
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Optimisation de contenu
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Correction grammaticale
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Analyse de sentiment
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buffer */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Plug size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Buffer</h2>
                <p className="text-secondary-500">Publication sur les réseaux sociaux</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Statut</h3>
                <div className="flex items-center gap-2 mb-4">
                  {bufferStatus.connected ? (
                    <span className="badge badge-success">Connecté</span>
                  ) : (
                    <span className="badge badge-warning">Non connecté</span>
                  )}
                </div>
                
                {bufferStatus.connected ? (
                  <Button
                    variant="danger"
                    onClick={handleBufferDisconnect}
                    leftIcon={<Unlink size={16} />}
                  >
                    Déconnecter
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleBufferConnect}
                    leftIcon={<Link size={16} />}
                  >
                    Connecter à Buffer
                  </Button>
                )}
                
                {bufferStatus.profiles && bufferStatus.profiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-secondary-600 mb-2">
                      Profils connectés ({bufferStatus.profiles.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {bufferStatus.profiles.map((profile) => (
                        <span
                          key={profile.id}
                          className="inline-flex items-center px-3 py-1 bg-secondary-100 text-secondary-800 text-sm font-medium rounded-full"
                        >
                          {profile.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {bufferAnalytics && (
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    Statistiques (30 derniers jours)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {bufferAnalytics.totalPosts}
                      </div>
                      <div className="text-sm text-secondary-500">Posts publiés</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {bufferAnalytics.engagement}
                      </div>
                      <div className="text-sm text-secondary-500">Engagements</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {bufferAnalytics.reach}
                      </div>
                      <div className="text-sm text-secondary-500">Portée</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {Object.keys(bufferAnalytics.byPlatform).length}
                      </div>
                      <div className="text-sm text-secondary-500">Plateformes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asana */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Asana</h2>
                <p className="text-secondary-500">Gestion des tâches et projets</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Statut</h3>
                <div className="flex items-center gap-2 mb-4">
                  {asanaStatus.connected ? (
                    <span className="badge badge-success">Connecté</span>
                  ) : (
                    <span className="badge badge-warning">Non connecté</span>
                  )}
                </div>
                
                {asanaStatus.connected ? (
                  <Button
                    variant="danger"
                    onClick={handleAsanaDisconnect}
                    leftIcon={<Unlink size={16} />}
                  >
                    Déconnecter
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleAsanaConnect}
                    leftIcon={<Link size={16} />}
                  >
                    Connecter à Asana
                  </Button>
                )}
                
                {asanaStatus.projects && asanaStatus.projects.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-secondary-600 mb-2">
                      Projets disponibles ({asanaStatus.projects.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {asanaStatus.projects.map((project) => (
                        <span
                          key={project.id}
                          className="inline-flex items-center px-3 py-1 bg-secondary-100 text-secondary-800 text-sm font-medium rounded-full"
                        >
                          {project.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {asanaAnalytics && (
                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    Statistiques (30 derniers jours)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {asanaAnalytics.totalTasks}
                      </div>
                      <div className="text-sm text-secondary-500">Tâches totales</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {asanaAnalytics.completedTasks}
                      </div>
                      <div className="text-sm text-secondary-500">Tâches complétées</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {Math.round((asanaAnalytics.completedTasks / asanaAnalytics.totalTasks) * 100) || 0}%
                      </div>
                      <div className="text-sm text-secondary-500">Taux de complétion</div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-secondary-900">
                        {Object.keys(asanaAnalytics.byProject).length}
                      </div>
                      <div className="text-sm text-secondary-500">Projets</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Résumé des intégrations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain size={20} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">Mistral Vibe</div>
                  <div className="text-sm text-secondary-500">
                    {mistralStatus.active ? 'Actif' : 'Inactif'}
                  </div>
                </div>
                {mistralStatus.active && (
                  <span className="badge badge-success">OK</span>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plug size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">Buffer</div>
                  <div className="text-sm text-secondary-500">
                    {bufferStatus.connected ? 'Connecté' : 'Non connecté'}
                  </div>
                </div>
                {bufferStatus.connected ? (
                  <span className="badge badge-success">OK</span>
                ) : (
                  <span className="badge badge-warning">À configurer</span>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">Asana</div>
                  <div className="text-sm text-secondary-500">
                    {asanaStatus.connected ? 'Connecté' : 'Non connecté'}
                  </div>
                </div>
                {asanaStatus.connected ? (
                  <span className="badge badge-success">OK</span>
                ) : (
                  <span className="badge badge-warning">À configurer</span>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-start gap-3">
                <Check size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-primary-900">Toutes les intégrations sont prêtes !</h3>
                  <p className="text-sm text-primary-700 mt-1">
                    Votre plateforme WHISE MKT est configurée pour utiliser toutes les intégrations disponibles.
                    Vous pouvez maintenant créer des posts, les optimiser avec Mistral Vibe, les publier via Buffer,
                    et gérer les tâches dans Asana.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
