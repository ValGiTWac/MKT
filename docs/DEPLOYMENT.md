# Déploiement de WHISE Marketing Platform sur Netlify

Ce guide explique comment déployer la plateforme WHISE Marketing sur Netlify avec déploiement automatique depuis GitHub.

## Prérequis

1. **Compte Netlify** - [S'inscrire sur Netlify](https://app.netlify.com/signup)
2. **Compte GitHub** - Avec accès au repository
3. **Node.js 18+** - Pour le développement local
4. **MongoDB Atlas** - Base de données cloud (gratuit pour les petits projets)
5. **Clés API** - Pour les intégrations (Mistral Vibe, Asana, Buffer)

## Configuration de Netlify

### 1. Créer un nouveau site sur Netlify

1. Connectez-vous à [Netlify Dashboard](https://app.netlify.com/)
2. Cliquez sur **"Add new site"** > **"Import an existing project"**
3. Sélectionnez **GitHub** comme fournisseur Git
4. Autorisez Netlify à accéder à votre compte GitHub
5. Sélectionnez le repository **ValGiTWac/MKT**
6. Configurez les paramètres de build :
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `functions`
7. Cliquez sur **"Deploy site"**

### 2. Configurer les variables d'environnement

Dans Netlify, allez dans **Site settings** > **Environment variables** et ajoutez :

#### Variables Backend (Functions)
```
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/whise_mkt?retryWrites=true&w=majority

# JWT
JWT_SECRET=votre_cle_secrete_jwt_tres_complexe
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Mistral Vibe
MISTRAL_VIBE_API_KEY=votre_cle_api_mistral_vibe
MISTRAL_VIBE_BASE_URL=https://api.mistral.ai/v1
MISTRAL_VIBE_MODEL=mistral-tiny

# Asana
ASANA_API_KEY=votre_token_asana
ASANA_WORKSPACE_ID=votre_workspace_id_asana

# Buffer
BUFFER_API_KEY=votre_token_buffer

# Cloudinary (optionnel pour les médias)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

#### Variables Frontend (dans Netlify)
```
# API URL (laisser vide pour utiliser /api en production)
VITE_API_URL=

# Mistral Vibe (optionnel - peut être utilisé directement depuis le frontend)
VITE_MISTRAL_VIBE_API_KEY=
```

### 3. Configurer le déploiement automatique

1. Dans Netlify, allez dans **Site settings** > **Build & deploy**
2. Sous **Continuous Deployment**, assurez-vous que :
   - **Repository**: ValGiTWac/MKT
   - **Branch to deploy**: main
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Sauvegardez les modifications

### 4. Configurer GitHub Actions (optionnel)

Le fichier `.github/workflows/deploy.yml` est déjà configuré pour :
- Exécuter les tests à chaque push/PR
- Déployer automatiquement sur Netlify lors des pushes sur `main` et `develop`
- Créer des prévisualisations pour les Pull Requests

Pour activer GitHub Actions :
1. Allez dans votre repository GitHub
2. Cliquez sur **Actions**
3. Autorisez les workflows
4. Ajoutez les secrets suivants dans **Settings** > **Secrets and variables** > **Actions** :
   - `NETLIFY_AUTH_TOKEN`: Votre token d'API Netlify (trouvé dans Netlify > User settings > Applications)
   - `NETLIFY_SITE_ID`: L'ID de votre site Netlify (trouvé dans Site settings > General)

## Développement Local

### 1. Cloner le repository
```bash
git clone https://github.com/ValGiTWac/MKT.git
cd MKT
```

### 2. Installer les dépendances
```bash
# À la racine
npm install

# Dans le frontend
cd frontend
npm install

# Dans les functions
cd ../functions
npm install
```

### 3. Configurer les variables d'environnement locales

Créez un fichier `.env` à la racine :
```env
# MongoDB local ou Atlas
MONGODB_URI=mongodb://localhost:27017/whise_mkt

# JWT
JWT_SECRET=votre_cle_secrete_dev
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Mistral Vibe
MISTRAL_VIBE_API_KEY=votre_cle_api_dev
MISTRAL_VIBE_BASE_URL=https://api.mistral.ai/v1

# Asana (optionnel)
ASANA_API_KEY=
ASANA_WORKSPACE_ID=

# Buffer (optionnel)
BUFFER_API_KEY=

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Créez un fichier `.env` dans le frontend :
```env
VITE_API_URL=/api
VITE_MISTRAL_VIBE_API_KEY=votre_cle_api_dev
```

### 4. Démarrer les serveurs de développement

Ouvrez deux terminaux :

**Terminal 1 - Frontend**
```bash
cd frontend
npm run dev
# Accès : http://localhost:5173
```

**Terminal 2 - Functions**
```bash
cd functions
npm run dev
# Accès : http://localhost:8888
```

Le frontend est configuré pour proxy les requêtes `/api` vers les functions.

## Configuration de MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Créez un cluster gratuit
3. Créez un utilisateur avec accès lecture/écriture
4. Ajoutez votre IP à la liste blanche (ou autorisez toutes les IP pour le développement)
5. Récupérez la chaîne de connexion et ajoutez-la dans `MONGODB_URI`

## Configuration des Intégrations

### Mistral Vibe
1. Obtenez une clé API depuis [Mistral AI](https://mistral.ai/)
2. Ajoutez-la dans `MISTRAL_VIBE_API_KEY`

### Asana
1. Créez un compte développeur sur [Asana](https://developers.asana.com/)
2. Créez une application et obtenez un token d'API
3. Récupérez votre Workspace ID
4. Ajoutez ces informations dans les variables d'environnement

### Buffer
1. Créez un compte sur [Buffer](https://buffer.com/)
2. Obtenez un token d'API depuis les paramètres de votre compte
3. Ajoutez-le dans `BUFFER_API_KEY`

### Cloudinary (optionnel pour les médias)
1. Créez un compte sur [Cloudinary](https://cloudinary.com/)
2. Récupérez vos identifiants API
3. Ajoutez-les dans les variables d'environnement

## Structure du Projet

```
MKT/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Déploiement Netlify
│       └── auto-update.yml      # Mises à jour automatiques
├── docs/
│   └── DEPLOYMENT.md           # Ce fichier
├── frontend/
│   ├── src/
│   │   ├── components/         # Composants React
│   │   ├── pages/              # Pages de l'application
│   │   ├── services/           # Services API
│   │   ├── store/              # État Recoil
│   │   ├── types/              # Types TypeScript
│   │   ├── utils/              # Utilitaires
│   │   ├── styles/             # Styles CSS
│   │   ├── App.tsx             # Application principale
│   │   └── main.tsx            # Point d'entrée
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── functions/
│   ├── src/
│   │   ├── handlers/           # Handlers Express
│   │   ├── models/             # Modèles Mongoose
│   │   ├── middleware/         # Middleware Express
│   │   ├── config/             # Configuration
│   │   └── index.ts             # Point d'entrée
│   └── package.json
├── .gitignore
├── .env.example
├── netlify.toml               # Configuration Netlify
├── package.json               # Package root (workspaces)
└── README.md
```

## Workflow de Déploiement

1. **Push sur la branche `main`**
   - GitHub Actions exécute les tests
   - Si les tests passent, déploiement automatique sur Netlify
   - Le site est mis à jour avec la dernière version

2. **Pull Request**
   - GitHub Actions exécute les tests
   - Si les tests passent, création d'une prévisualisation Netlify
   - Un commentaire est ajouté à la PR avec le lien de prévisualisation

3. **Mises à jour depuis Vibe Code**
   - Les modifications sont poussées sur la branche `main`
   - GitHub Actions déclenche un nouveau déploiement
   - Netlify met à jour le site automatiquement

## Dépannage

### Problèmes de déploiement
1. **Build échoue** : Vérifiez les logs dans Netlify > Deploys
2. **Variables d'environnement manquantes** : Assurez-vous que toutes les variables sont configurées
3. **Problèmes de connexion MongoDB** : Vérifiez que votre IP est autorisée dans Atlas

### Problèmes locaux
1. **Ports déjà utilisés** : Changez les ports dans les fichiers de configuration
2. **Dépendances manquantes** : Exécutez `npm install` dans chaque dossier
3. **Problèmes CORS** : Assurez-vous que le frontend pointe vers le bon endpoint API

### Problèmes d'intégration
1. **Mistral Vibe ne fonctionne pas** : Vérifiez que votre clé API est valide
2. **Asana/Buffer ne se connecte pas** : Vérifiez les tokens et les permissions

## Bonnes Pratiques

1. **Ne jamais commiter de secrets** : Utilisez toujours des variables d'environnement
2. **Tester localement** : Testez toujours les modifications avant de pousser
3. **Utiliser des branches** : Créez des branches pour chaque fonctionnalité
4. **Documenter les changements** : Mettez à jour le README et la documentation
5. **Surveiller les déploiements** : Vérifiez les logs Netlify après chaque déploiement

## Ressources

- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [API Mistral Vibe](https://docs.mistral.ai/)
- [API Asana](https://developers.asana.com/docs)
- [API Buffer](https://buffer.com/developers/api/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## Support

Pour toute question ou problème, contactez l'équipe WHISE Marketing.
