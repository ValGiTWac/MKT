import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { postService } from '@/services/postService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Post } from '@/types';

export default function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Partial<Post>>({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      postService.getById(id).then((data) => {
        setPost(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await postService.update(id, post as Post);
      } else {
        await postService.create(post as Post);
      }
      navigate('/posts');
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{id ? 'Modifier le post' : 'Créer un post'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Titre</label>
          <Input
            value={post.title || ''}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-2">Contenu</label>
          <textarea
            className="w-full p-2 border rounded"
            value={post.content || ''}
            onChange={(e) => setPost({ ...post, content: e.target.value })}
          />
        </div>
        <Button type="submit" variant="default">
          {id ? 'Mettre à jour' : 'Créer'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/posts')}>
          Annuler
        </Button>
      </form>
    </div>
  );
}
