import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { mistralService, BufferProfilesResponse, AsanaProjectsResponse } from '@/services/mistralService';
import { BufferProfile, AsanaProject } from '@/types';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Plug,
  Users,
  Brain,
  Check,
  Settings,
  BarChart3,
  Calendar,
  Clock,
  Link,
  Info,
} from 'lucide-react';

const IntegrationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [mistralStatus, setMistralStatus] = useState<{
    active: boolean;
    model?: string;
  }>({ active: false });
  
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([]);
  const [asanaProjects, setAsanaProjects] = useState<AsanaProject[]>([]);
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
      
      // Fetch Mistral Vibe status
      const mistralStatus = await mistralService.checkIntegration();
      setMistralStatus(mistralStatus);

      // Fetch Buffer profiles via Mistral Vibe MCP
      try {
        const bufferResponse = await mistralService.getBufferProfiles();
        setBufferProfiles(bufferResponse.profiles || []);
      } catch (error) {
        console.log('Buffer integration not available via Mistral Vibe MCP');
      }

      // Fetch Asana projects via Mistral Vibe MCP
      try {
        const asanaResponse = await mistralService.getAsanaProjects();
        setAsanaProjects(asanaResponse.projects || []);
      } catch (error) {
        console.log('Asana integration not available via Mistral Vibe MCP');
      }
    } catch (error) {
      console.error('Failed to fetch integrations data:', error);
    } finally {
      setIsLoading(false);
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
          Toutes les intégrations sont gérées via Mistral Vibe MCP
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mistral Vibe - Main Integration */}
          <div className="card border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Mistral Vibe MCP</h2>
                <p className="text-secondary-500">Proxy unique pour toutes les intégrations</p>
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
                  Mistral Vibe MCP gère toutes les connexions à Buffer et Asana.
                  Aucune configuration manuelle n'est nécessaire.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Fonctionnalités</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Génération de contenu IA
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
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Intégration Buffer (via MCP)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Intégration Asana (via MCP)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buffer via Mistral Vibe MCP */}
          <div className="card border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Plug size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Buffer</h2>
                <p className="text-secondary-500">Publication sur les réseaux sociaux via Mistral Vibe MCP</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Statut</h3>
                <div className="flex items-center gap-2 mb-4">
                  {bufferProfiles.length > 0 ? (
                    <span className="badge badge-success">Connecté ({bufferProfiles.length} profils)</span>
                  ) : (
                    <span className="badge badge-warning">Aucun profil connecté</span>
                  )}
                </div>
                
                <p className="text-sm text-blue-600">
                  <Info size={16} className="inline mr-1" />
                  La connexion est gérée automatiquement par Mistral Vibe MCP.
                  Aucune action manuelle requise.
                </p>
                
                {bufferProfiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-secondary-600 mb-2">
                      Profils disponibles ({bufferProfiles.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {bufferProfiles.map((profile) => (
                        <span
                          key={profile.id}
                          className="inline-flex items-center px-3 py-1 bg-white text-secondary-800 text-sm font-medium rounded-full border border-blue-200"
                        >
                          {profile.name || profile.platformUsername} ({profile.platform})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Fonctionnalités</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-blue-600" />
                    Publication instantanée
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-blue-600" />
                    Planification de posts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-blue-600" />
                    Multi-plateformes (Facebook, Twitter, LinkedIn, Instagram, TikTok)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-blue-600" />
                    Gestion des médias
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Asana via Mistral Vibe MCP */}
          <div className="card border-2 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Asana</h2>
                <p className="text-secondary-500">Gestion des tâches et projets via Mistral Vibe MCP</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Statut</h3>
                <div className="flex items-center gap-2 mb-4">
                  {asanaProjects.length > 0 ? (
                    <span className="badge badge-success">Connecté ({asanaProjects.length} projets)</span>
                  ) : (
                    <span className="badge badge-warning">Aucun projet disponible</span>
                  )}
                </div>
                
                <p className="text-sm text-orange-600">
                  <Info size={16} className="inline mr-1" />
                  La connexion est gérée automatiquement par Mistral Vibe MCP.
                  Aucune action manuelle requise.
                </p>
                
                {asanaProjects.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-secondary-600 mb-2">
                      Projets disponibles ({asanaProjects.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {asanaProjects.map((project) => (
                        <span
                          key={project.id}
                          className="inline-flex items-center px-3 py-1 bg-white text-secondary-800 text-sm font-medium rounded-full border border-orange-200"
                        >
                          {project.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Fonctionnalités</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-orange-600" />
                    Création de tâches
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-orange-600" />
                    Association à des projets
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-orange-600" />
                    Gestion des échéances
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-orange-600" />
                    Suivi des statuts
                  </li>
                </ul>
              </div>
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
                  <div className="font-medium text-secondary-900">Mistral Vibe MCP</div>
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
                    {bufferProfiles.length > 0 ? `${bufferProfiles.length} profils` : 'Aucun profil'}
                  </div>
                </div>
                {bufferProfiles.length > 0 ? (
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
                    {asanaProjects.length > 0 ? `${asanaProjects.length} projets` : 'Aucun projet'}
                  </div>
                </div>
                {asanaProjects.length > 0 ? (
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
                  <h3 className="font-semibold text-primary-900">Architecture simplifiée avec Mistral Vibe MCP</h3>
                  <p className="text-sm text-primary-700 mt-1">
                    Votre plateforme WHISE MKT utilise <strong>Mistral Vibe MCP</strong> comme intermédiaire unique.
                    Toutes les intégrations avec Buffer et Asana sont gérées automatiquement.
                    Aucune clé API ou configuration manuelle n'est nécessaire.
                  </p>
                  <p className="text-sm text-primary-700 mt-2">
                    <strong>Avantages :</strong> Centralisation, sécurité renforcée, maintenance simplifiée.
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
