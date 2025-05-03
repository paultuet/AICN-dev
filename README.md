# Espace Collaboratif Référentiel (ECR)

Plateforme collaborative pour la gestion des référentiels de l'AICN.

## Architecture du projet

Ce monorepo est organisé en deux packages principaux :

- **Backend** (`packages/backend`): API REST développée en Clojure avec Reitit et Integrant
- **Frontend** (`packages/frontend`): Application SPA développée en React et TypeScript

## Technologies utilisées

### Backend
- **Clojure**: Langage de programmation fonctionnel sur la JVM
- **Reitit**: Framework web HTTP/Router avec support OpenAPI
- **Integrant**: Gestion des composants et du cycle de vie de l'application
- **Ring/Jetty**: Serveur HTTP
- **Ragtime**: Gestion des migrations de base de données
- **PostgreSQL**: Base de données relationnelle
- **next.jdbc**: Bibliothèque d'accès à la base de données
- **Malli**: Validation des données et génération de schémas
- **Buddy**: Authentification et autorisation
- **Jakarta Mail**: Envoi d'emails

### Frontend
- **React**: Bibliothèque UI
- **TypeScript**: Typage statique pour JavaScript
- **React Router**: Gestion du routage côté client
- **Vite**: Outil de build et serveur de développement
- **Tailwind CSS**: Framework CSS utilitaire
- **MJML**: Framework pour créer des emails responsive
- **Axios**: Client HTTP pour les appels API

### Infrastructure
- **Docker**: Conteneurisation de la base de données
- **PostgreSQL**: Base de données relationnelle
- **Fly.io**: Plateforme de déploiement

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

# Démarrer la base de données
docker-compose up -d

# Exécuter les migrations
cd packages/backend && clojure -M:migrate

# Démarrer en développement
pnpm dev
```

### Commandes utiles
- **Développement complet**: `pnpm dev` (lance tous les packages en parallèle)
- **Backend uniquement**: `cd packages/backend && clojure -M:run-m`
- **Build complet**: `pnpm build`
- **Tests**: `pnpm test`
- **Tests backend**: `cd packages/backend && clojure -T:build test`
- **Build backend uberjar**: `cd packages/backend && clojure -T:build ci`
- **Commandes REPL backend**: `(go)`, `(reset)`, `(halt)` dans le REPL Clojure
- **Compiler les templates email**: `cd packages/frontend && pnpm compile-emails`

## Base de données

Le projet utilise PostgreSQL, accessible via Docker:
- **Nom de la BDD**: `aicn_db`
- **Utilisateur**: `postgres`
- **Mot de passe**: `postgres`
- **Port**: 5432

### Migrations de base de données
- **Exécuter les migrations**: `cd packages/backend && clojure -M:migrate`
- **Annuler la dernière migration**: `cd packages/backend && clojure -M:rollback`
- **Créer une nouvelle migration**: `cd packages/backend && clojure -M:cli create nom-de-ma-migration`
- Les fichiers de migration sont stockés dans `packages/backend/resources/migrations/`

## Variables d'environnement

### Backend
- `PORT`: Port d'écoute du serveur backend (par défaut: 1337)
- `DB_HOST`: Nom d'hôte de la base de données (par défaut: postgres)
- `DB_PORT`: Port de la base de données (par défaut: 5432)
- `DB_USER`: Utilisateur de la base de données (par défaut: postgres) 
- `DB_PASSWORD`: Mot de passe de la base de données (par défaut: postgres)
- `DB_NAME`: Nom de la base de données (par défaut: aicn_db)
- `SSL_MODE`: Mode SSL pour PostgreSQL (par défaut: disable)

## Déploiement

Le projet est configuré pour être déployé sur Fly.io. Les instructions détaillées se trouvent dans le fichier `fly-deployment.md`.