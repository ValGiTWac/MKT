# WHISE Marketing Platform (MKT)

Une plateforme collaborative sécurisée pour le département marketing de WHISE. Gestion complète du cycle de vie des posts social media : création, traduction, validation visuelle et publication via des intégrations tierces (Asana et Buffer).

## Fonctionnalités

- ✅ **Création de posts** avec assistance IA (Mistral Vibe)
- ✅ **Traduction automatique** via Mistral Vibe
- ✅ **Correction et optimisation** de contenu
- ✅ **Validation visuelle** avec prévisualisation
- ✅ **Workflow d'approbation** collaboratif
- ✅ **Intégration Asana** pour la gestion des tâches
- ✅ **Intégration Buffer** pour la publication automatique
- ✅ **Gestion des utilisateurs** avec RBAC
- ✅ **Historique et audit** des modifications

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Pages: Dashboard, Posts, Creation, Validation, Settings      │
│  Components: PostEditor, TranslationPanel, Preview, etc.      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│  Controllers: Auth, Posts, Translations, Validations, etc.    │
│  Services: MistralVibe, Asana, Buffer, Storage                │
│  Models: User, Post, Translation, Validation, Task            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ MongoDB │   │  Asana  │   │  Buffer │
        └─────────┘   └─────────┘   └─────────┘
        │
        ▼
    ┌─────────┐
    │Cloudinary│
    └─────────┘
```

## Prérequis

- Node.js 18+ 
- MongoDB 6+
- Compte Asana avec API key
- Compte Buffer avec API token
- Accès à Mistral Vibe API
- Compte Cloudinary

## Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables d'environnement

### Backend (.env)

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/whise_mkt
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Mistral Vibe
MISTRAL_VIBE_API_KEY=your_mistral_vibe_key
MISTRAL_VIBE_BASE_URL=https://api.mistral.ai/v1

# Asana
ASANA_API_KEY=your_asana_key
ASANA_WORKSPACE_ID=your_workspace_id

# Buffer
BUFFER_API_KEY=your_buffer_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_MISTRAL_VIBE_API_KEY=your_mistral_vibe_key
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Informations utilisateur

### Posts
- `GET /api/posts` - Liste des posts
- `POST /api/posts` - Créer un post
- `GET /api/posts/:id` - Détails d'un post
- `PUT /api/posts/:id` - Mettre à jour un post
- `DELETE /api/posts/:id` - Supprimer un post

### Translations
- `POST /api/posts/:id/translate` - Traduire un post
- `GET /api/posts/:id/translations` - Liste des traductions

### Validations
- `POST /api/posts/:id/validate` - Soumettre pour validation
- `PUT /api/validations/:id` - Valider/Approuver

### Intégrations
- `POST /api/posts/:id/sync-asana` - Synchroniser avec Asana
- `POST /api/posts/:id/publish-buffer` - Publier via Buffer

## Structure des Données

### User
```typescript
{
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Post
```typescript
{
  _id: string;
  title: string;
  content: string;
  author: User;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'rejected';
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok';
  scheduledAt?: Date;
  publishedAt?: Date;
  media: string[];
  tags: string[];
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}
```

### Translation
```typescript
{
  _id: string;
  post: Post;
  language: string;
  content: string;
  status: 'pending' | 'completed' | 'needs_review';
  translator: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### Validation
```typescript
{
  _id: string;
  post: Post;
  validator: User;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  visualPreview?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Workflow

1. **Création**: L'éditeur crée un post avec Mistral Vibe
2. **Traduction**: Le post est traduit automatiquement ou manuellement
3. **Validation**: Le manager valide le contenu et l'aspect visuel
4. **Planification**: Le post est planifié dans Buffer
5. **Publication**: Buffer publie automatiquement sur les réseaux
6. **Suivi**: Asana suit l'avancement des tâches

## Sécurité

- Authentification JWT avec refresh tokens
- RBAC (Role-Based Access Control)
- Validation des entrées
- Rate limiting
- CORS configuré
- Audit logs

## Contribution

1. Fork le repository
2. Crée une branche (`git checkout -b feature/nouvelle-fonctionnalité`)
3. Commit tes changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalité`)
5. Ouvre une Pull Request

## License

MIT
