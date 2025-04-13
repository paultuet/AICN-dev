# Espace Collaboratif Référentiel (ECR)

Plateforme collaborative pour la gestion des référentiels de l'AICN.

## Structure du projet

Ce monorepo contient:
- `packages/backend`: API backend en Clojure
- `packages/frontend`: Application frontend en React/TypeScript
- `packages/shared`: Code et types partagés

## Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [PNPM](https://pnpm.io/) (v8+)
- [Clojure CLI](https://clojure.org/guides/deps_and_cli)
- [Docker](https://www.docker.com/) et Docker Compose

### Installation
```bash
# Installer les dépendances
pnpm install

# Démarrer en développement
pnpm run dev
```

## Déploiement avec Docker

Cette application utilise Docker et Docker Compose pour faciliter le déploiement. Deux configurations sont disponibles :

1. **Local** : Configuration simple pour le développement local
2. **Production** : Configuration complète avec SSL automatique via Let's Encrypt

### Structure des containers

#### En local
1. **PostgreSQL** - Base de données
2. **Backend** - Application Clojure
3. **Frontend** - Application React

#### En production
Les mêmes containers qu'en local, plus :
4. **Nginx-Proxy** - Reverse proxy pour gérer les connexions HTTPS
5. **Let's Encrypt** - Service pour générer et renouveler les certificats SSL

### Instructions de déploiement

1. Cloner le dépôt

```bash
git clone <repository-url>
cd aicn
```

2. Choisir votre environnement

Pour le développement local :
```bash
docker compose -f docker-compose.local.yml up -d
```

Pour la production avec SSL :
```bash
# Modifier d'abord les domaines dans docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

3. Accéder à l'application

En local :
- Frontend: http://localhost
- Backend API: http://localhost:1337
- Base de données PostgreSQL: localhost:5439

En production :
- Frontend: https://votre-domaine.com
- Backend API: https://api.votre-domaine.com

### Configuration pour la production

Avant de déployer en production, vous devez modifier les domaines dans le fichier `docker-compose.prod.yml` :

1. Pour le frontend :
```yaml
environment:
  VIRTUAL_HOST: votre-domaine.com
  LETSENCRYPT_HOST: votre-domaine.com
```

2. Pour le backend :
```yaml
environment:
  VIRTUAL_HOST: api.votre-domaine.com
  LETSENCRYPT_HOST: api.votre-domaine.com
```

3. Pour Let's Encrypt :
```yaml
environment:
  DEFAULT_EMAIL: votre-email@example.com
```

### Variables d'environnement

Les fichiers docker-compose définissent les variables d'environnement nécessaires.

#### Backend
- `PORT`: Port d'écoute du serveur backend (par défaut: 1337)
- `DB_HOST`: Nom d'hôte de la base de données (par défaut: postgres)
- `DB_PORT`: Port de la base de données (par défaut: 5432)
- `DB_USER`: Utilisateur de la base de données (par défaut: postgres) 
- `DB_PASSWORD`: Mot de passe de la base de données (par défaut: postgres)
- `SSL_MODE`: Mode SSL pour PostgreSQL (par défaut: disable)
- En production: `VIRTUAL_HOST`, `LETSENCRYPT_HOST` pour le SSL

### Déploiement sur Coolify

Pour déployer cette application sur un VPS avec Coolify:

1. Créez un nouveau projet dans Coolify
2. Connectez votre dépôt Git
3. Configurez les ressources pour déployer les services depuis le fichier docker-compose.prod.yml
4. Configurez les variables d'environnement nécessaires
5. Assurez-vous que vos domaines pointent vers l'adresse IP de votre VPS
6. Déployez l'application
