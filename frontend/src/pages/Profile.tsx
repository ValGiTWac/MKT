import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: 'Utilisateur',
    email: 'user@example.com',
    role: 'editor' as UserRole,
  });

  const handleSave = () => {
    console.log('Profile saved:', profile);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mon profil</h1>
      <div className="bg-white p-4 rounded-lg shadow space-y-4 max-w-md">
        <div>
          <label className="block mb-2">Nom</label>
          <Input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-2">Email</label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-2">Rôle</label>
          <select
            value={profile.role}
            onChange={(e) => setProfile({ ...profile, role: e.target.value as UserRole })}
            className="p-2 border rounded w-full"
          >
            <option value="viewer">Spectateur</option>
            <option value="editor">Éditeur</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button variant="default" onClick={handleSave}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
