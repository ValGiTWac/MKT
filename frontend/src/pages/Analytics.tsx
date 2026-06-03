import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Analytics() {
  const [stats, setStats] = useState({
    posts: 0,
    engagements: 0,
    followers: 0,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytiques</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold">Posts publiés</h2>
          <p className="text-2xl">{stats.posts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold">Engagements</h2>
          <p className="text-2xl">{stats.engagements}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold">Abonnés</h2>
          <p className="text-2xl">{stats.followers}</p>
        </div>
      </div>
      <Button variant="outline" className="mt-4">
        Rafraîchir les données
      </Button>
    </div>
  );
}
