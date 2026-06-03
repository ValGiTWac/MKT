import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Collaboration() {
  const [users, setUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState('');

  const addUser = () => {
    if (newUser.trim()) {
      setUsers([...users, newUser]);
      setNewUser('');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Collaboration</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex mb-4">
          <input
            type="text"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            placeholder="Ajouter un utilisateur"
            className="flex-1 p-2 border rounded"
          />
          <Button variant="default" onClick={addUser} className="ml-2">
            Ajouter
          </Button>
        </div>
        <ul>
          {users.map((user, index) => (
            <li key={index} className="p-2 border-b">
              {user}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
