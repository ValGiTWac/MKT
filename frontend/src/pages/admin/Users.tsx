import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { authService } from '@/services/authService';
import { User, UserRole } from '@/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import {
  Users,
  Plus,
  Trash2,
  User,
  Crown,
  UserCheck,
  UserCog,
  Eye,
  Search,
} from 'lucide-react';

const UsersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { addNotification } = useNotifications();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor' as UserRole,
  });
  const [isSaving, setIsSaving] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Manager' },
    { value: 'editor', label: 'Éditeur' },
    { value: 'viewer', label: 'Visualiseur' },
  ];

  const roleIcons: Record<UserRole, JSX.Element> = {
    admin: <Crown size={16} className="text-yellow-600" />,
    manager: <UserCog size={16} className="text-blue-600" />,
    editor: <UserCheck size={16} className="text-green-600" />,
    viewer: <Eye size={16} className="text-gray-600" />,
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-yellow-100 text-yellow-800',
    manager: 'bg-blue-100 text-blue-800',
    editor: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    if (!hasRole(['admin'])) {
      // Redirect or show error
      return;
    }
    
    fetchUsers();
  }, [hasRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await authService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec du chargement des utilisateurs',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      await authService.register({
        ...newUserData,
        role: newUserData.role,
      });
      
      addNotification({
        type: 'success',
        title: 'Utilisateur créé',
        message: 'Le nouvel utilisateur a été créé avec succès',
      });
      
      // Reset form and refresh list
      setNewUserData({
        name: '',
        email: '',
        password: '',
        role: 'editor',
      });
      setShowCreateModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la création de l\'utilisateur',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await authService.updateUserRole(userId, newRole);
      
      addNotification({
        type: 'success',
        title: 'Rôle mis à jour',
        message: 'Le rôle de l\'utilisateur a été mis à jour',
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la mise à jour du rôle',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await authService.deleteUser(userToDelete);
      
      addNotification({
        type: 'success',
        title: 'Utilisateur supprimé',
        message: 'L\'utilisateur a été supprimé avec succès',
      });
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la suppression de l\'utilisateur',
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  if (!hasRole(['admin'])) {
    return (
      <div className="text-center py-8">
        <Shield size={48} className="text-secondary-300 mx-auto mb-2" />
        <p className="text-secondary-500">Accès refusé</p>
        <p className="text-sm text-secondary-400">Vous n'avez pas les permissions nécessaires</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Gestion des utilisateurs</h1>
          <p className="text-secondary-500">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />}>
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Search */}
      <div className="card">
        <Input
          label="Rechercher"
          placeholder="Rechercher par nom, email ou rôle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} className="text-secondary-400" />}
        />
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="text-secondary-300 mx-auto mb-2" />
              <p className="text-secondary-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Utilisateur
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Rôle
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-600">
                    Date de création
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-secondary-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-secondary-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-200 rounded-full flex items-center justify-center">
                          <span className="text-secondary-700 font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-secondary-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-secondary-700">{user.email}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                        options={roleOptions}
                        className="w-full"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-secondary-500">
                        {new Date(user.createdAt).toLocaleDateString('fr')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user.id);
                            setShowDeleteModal(true);
                          }}
                          leftIcon={<Trash2 size={16} />}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Ajouter un nouvel utilisateur"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nom"
            value={newUserData.name}
            onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
            placeholder="Nom de l'utilisateur"
            required
            leftIcon={<User size={18} className="text-secondary-400" />}
          />
          <Input
            label="Adresse e-mail"
            type="email"
            value={newUserData.email}
            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
            placeholder="utilisateur@email.com"
            required
            leftIcon={<Users size={18} className="text-secondary-400" />}
          />
          <Input
            label="Mot de passe"
            type="password"
            value={newUserData.password}
            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
            placeholder="••••••••"
            required
            minLength={8}
            leftIcon={<Shield size={18} className="text-secondary-400" />}
          />
          <Select
            label="Rôle"
            value={newUserData.role}
            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
            options={roleOptions}
          />
          
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSaving} leftIcon={<Plus size={16} />}>
              Créer l'utilisateur
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        title="Supprimer l'utilisateur"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setUserToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
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

export default UsersPage;
