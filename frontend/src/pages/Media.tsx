import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Media() {
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Médiathèque</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <input type="file" multiple onChange={handleUpload} className="mb-4" />
        <Button variant="default" onClick={() => console.log('Upload')}>
          Télécharger
        </Button>
        <div className="mt-4">
          {files.length > 0 ? (
            <ul>
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          ) : (
            <p>Aucun fichier téléchargé.</p>
          )}
        </div>
      </div>
    </div>
  );
}
