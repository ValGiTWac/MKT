import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, UserRole } from '@/types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([
    { _id: '1', name: 'Admin', email: 'admin@example.com', role: 'admin', isActive: true, createdAt: '', updatedAt: '' },
    { _id: '2', name: 'Éditeur', email: 'editor@example.com', role: 'editor', isActive: true, createdAt: '', updatedAt: '' },
  ]);

  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', email: '', role: 'viewer' });

  const addUser = () => {
    if (newUser.name && newUser.email) {
      setUsers([
        ...users,
        { id: Date.now().toString(), ...newUser } as User,
      ]);
      setNewUser({ name: '', email: '', role: 'viewer' });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Ajouter un utilisateur</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Nom"
            value={newUser.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={newUser.email || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <select
            value={newUser.role || 'viewer'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
            className="p-2 border rounded"
          >
            <option value="viewer">Spectateur</option>
            <option value="editor">Éditeur</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button variant="default" onClick={addUser}>
          Ajouter
        </Button>
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Liste des utilisateurs</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nom</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Rôle</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
