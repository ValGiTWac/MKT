import { Button } from '@/components/ui/Button';

export default function Help() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Aide</h1>
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <section>
          <h2 className="font-semibold">Comment utiliser WHISE Marketing Platform ?</h2>
          <p>Guide d'utilisation pour gérer vos posts, traductions et validations.</p>
        </section>
        <section>
          <h2 className="font-semibold">Problèmes courants</h2>
          <ul className="list-disc pl-5">
            <li>Assurez-vous que vos clés API sont configurées.</li>
            <li>Vérifiez votre connexion internet.</li>
          </ul>
        </section>
        <Button variant="outline">
          Contacter le support
        </Button>
      </div>
    </div>
  );
}
