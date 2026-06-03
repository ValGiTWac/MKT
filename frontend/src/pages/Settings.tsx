import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'fr',
    notifications: true,
  });

  const handleSave = () => {
    console.log('Settings saved:', settings);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div>
          <label className="block mb-2">Thème</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">Langue</label>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            className="mr-2"
          />
          <label>Activer les notifications</label>
        </div>
        <Button variant="default" onClick={handleSave}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
