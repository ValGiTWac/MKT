import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { authService } from '@/services/authService';
import { bufferService } from '@/services/bufferService';
import { asanaService } from '@/services/asanaService';
import { mistralService } from '@/services/mistralService';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  User,
  Settings,
  Plug,
  Users,
  Brain,
  Check,
  X,
  Key,
  Shield,
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [bufferStatus, setBufferStatus] = useState<{ active: boolean; connected: boolean }>({ active: false, connected: false });
  const [asanaStatus, setAsanaStatus] = useState<{ active: boolean; connected: boolean }>({ active: false, connected: false });
  const [mistralStatus, setMistralStatus] = useState<{ active: boolean; model?: string }>({ active: false });
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile
        if (user) {
          setProfileData({
            name: user.name,
            email: user.email,
          });
        }

        // Fetch integration statuses
        const bufferStatus = await bufferService.checkStatus();
        setBufferStatus(bufferStatus);
        
        const asanaStatus = await asanaService.checkStatus();
        setAsanaStatus(asanaStatus);
        
        const mistralStatus = await mistralService.checkIntegration();
        setMistralStatus(mistralStatus);
      } catch (error) {
        console.error('Failed to fetch settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      await authService.updateProfile(profileData);
      
      addNotification({
        type: 'success',
        title: 'Profil mis à jour',
        message: 'Votre profil a été mis à jour avec succès',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la mise à jour du profil',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Les mots de passe ne correspondent pas',
      });
      return;
    }

    try {
      setIsSaving(true);
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      addNotification({
        type: 'success',
        title: 'Mot de passe changé',
        message: 'Votre mot de passe a été changé avec succès',
      });
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec du changement de mot de passe',
      });
    } finally {
      setIsSaving(false);
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
      setBufferStatus({ ...bufferStatus, connected: false });
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
      setAsanaStatus({ ...asanaStatus, connected: false });
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

  const handleLogout = async () => {
    try {
      await logout();
      addNotification({
        type: 'info',
        title: 'Déconnexion',
        message: 'Vous avez été déconnecté',
      });
    } catch (error) {
      console.error('Failed to logout:', error);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Paramètres</h1>
        <p className="text-secondary-500">Gérez votre profil et les intégrations</p>
      </div>

      {/* Profile Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-secondary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Profil</h2>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              placeholder="Votre nom"
              required
            />
            <Input
              label="Adresse e-mail"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="votre@email.com"
              required
            />
          </div>
          <Button type="submit" isLoading={isSaving} leftIcon={<Check size={16} />}>
            Enregistrer les modifications
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-secondary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Mot de passe</h2>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Mot de passe actuel"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="••••••••"
              required
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="••••••••"
              required
              minLength={8}
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" isLoading={isSaving} leftIcon={<Key size={16} />}>
            Changer le mot de passe
          </Button>
        </form>
      </div>

      {/* Integrations Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Plug size={20} className="text-secondary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Intégrations</h2>
        </div>
        
        <div className="space-y-4">
          {/* Mistral Vibe */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Mistral Vibe</h3>
                <p className="text-sm text-secondary-500">Génération de contenu IA</p>
              </div>
            </div>
            {mistralStatus.active ? (
              <span className="badge badge-success">Actif</span>
            ) : (
              <span className="badge badge-error">Inactif</span>
            )}
          </div>

          {/* Buffer */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plug size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Buffer</h3>
                <p className="text-sm text-secondary-500">Publication réseaux sociaux</p>
              </div>
            </div>
            {bufferStatus.connected ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleBufferDisconnect}
                leftIcon={<X size={16} />}
              >
                Déconnecter
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleBufferConnect}
                leftIcon={<Plug size={16} />}
              >
                Connecter
              </Button>
            )}
          </div>

          {/* Asana */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Asana</h3>
                <p className="text-sm text-secondary-500">Gestion des tâches</p>
              </div>
            </div>
            {asanaStatus.connected ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleAsanaDisconnect}
                leftIcon={<X size={16} />}
              >
                Déconnecter
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAsanaConnect}
                leftIcon={<Plug size={16} />}
              >
                Connecter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-red-600" />
          <h2 className="text-lg font-semibold text-red-800">Zone de danger</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-800">Déconnexion</h3>
              <p className="text-sm text-red-600">Terminez votre session actuelle</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              leftIcon={<X size={16} />}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
