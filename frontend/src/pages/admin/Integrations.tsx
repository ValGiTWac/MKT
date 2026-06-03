import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Integrations() {
  const [integrations, setIntegrations] = useState({
    mistral: { connected: false, apiKey: '' },
    asana: { connected: false, apiKey: '' },
    buffer: { connected: false, apiKey: '' },
  });

  const toggleConnection = (service: keyof typeof integrations) => {
    setIntegrations({
      ...integrations,
      [service]: {
        ...integrations[service],
        connected: !integrations[service].connected,
      },
    });
  };

  const updateApiKey = (service: keyof typeof integrations, key: string) => {
    setIntegrations({
      ...integrations,
      [service]: { ...integrations[service], apiKey: key },
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Intégrations</h1>
      <div className="space-y-6">
        {Object.entries(integrations).map(([service, config]) => (
          <div key={service} className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold capitalize mb-2">{service}</h2>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={`Clé API ${service}`}
                value={config.apiKey}
                onChange={(e) => updateApiKey(service as keyof typeof integrations, e.target.value)}
              />
              <Button
                variant={config.connected ? 'default' : 'outline'}
                onClick={() => toggleConnection(service as keyof typeof integrations)}
              >
                {config.connected ? 'Déconnecter' : 'Connecter'}
              </Button>
            </div>
            <p className="text-sm mt-2">
              Statut: {config.connected ? '✅ Connecté' : '❌ Non connecté'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
