import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Calendar() {
  const [date] = useState(new Date());

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Calendrier</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <p>Calendrier des publications à venir.</p>
        <p className="mt-2">Date sélectionnée : {date.toLocaleDateString()}</p>
        <Button variant="outline" className="mt-4">
          Ajouter un événement
        </Button>
      </div>
    </div>
  );
}
