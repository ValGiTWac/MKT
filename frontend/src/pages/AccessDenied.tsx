import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Shield className="w-24 h-24 mx-auto text-red-500 dark:text-red-400 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
            Accès refusé
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Tableau de bord
            </Link>
          </Button>
        </div>

        <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
          Si vous pensez que c'est une erreur, contactez votre administrateur.
        </p>
      </div>
    </div>
  );
}
