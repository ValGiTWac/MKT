import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Mail, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      addNotification({
        type: 'success',
        title: 'Connexion réussie',
        message: 'Vous êtes maintenant connecté.',
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError('Identifiants invalides. Veuillez réessayer.');
      addNotification({
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Identifiants invalides. Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">WHISE MKT</h1>
            <p className="text-secondary-500 mt-1">
              Plateforme de gestion de contenu marketing
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              label="Adresse e-mail"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail size={18} className="text-secondary-400" />}
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock size={18} className="text-secondary-400" />}
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
            >
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-500">
              Vous n'avez pas de compte ? Contactez l'administrateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
