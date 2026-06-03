import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <AlertTriangle className="w-24 h-24 mx-auto text-amber-500 dark:text-amber-400 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
            Page non trouvée
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            La page que vous cherchez n'existe pas ou a été déplacée.
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

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Essayez de rechercher :
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
            />
          </div>
        </div>

        <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
          Si vous pensez que c'est une erreur, contactez le support.
        </p>
      </div>
    </div>
  );
}
