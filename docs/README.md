# Espace Collaboratif Referentiel (ECR)

Plateforme collaborative pour la gestion des referentiels de l'AICN.

## Architecture du projet

Ce monorepo est organise en deux packages principaux :

- **Backend** (`packages/backend`) : API REST developpee en Clojure avec Reitit et Integrant
- **Frontend** (`packages/frontend`) : Application SPA developpee en React et TypeScript

### Schema des flux

```
┌──────────────┐     ┌──────────────────┐     ┌────────────┐
│   Frontend   │────>│   Backend API    │────>│ PostgreSQL │
│  React SPA   │<────│  Clojure/Jetty   │<────│            │
└──────────────┘     └──────┬───────────┘     └────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
              ┌─────▼─────┐   ┌─────▼──────┐
              │  Airtable  │   │  Stockage  │
              │  (sync)    │   │  fichiers  │
              └────────────┘   └────────────┘
```

- Le **frontend** communique avec le backend via l'API REST (port 1337)
- Le **backend** gere l'authentification (JWT), les conversations et les fichiers en PostgreSQL
- Les **referentiels** sont synchronises depuis Airtable et stockes en fichiers EDN locaux (`packages/backend/resources/data/`)
- Les **fichiers uploades** sont stockes sur disque (volume persistant en production)
- En production, le frontend est servi comme assets statiques par le backend (build integre dans l'uberjar)

## Technologies utilisees

### Backend
- **Clojure** : Langage de programmation fonctionnel sur la JVM
- **Reitit** : Framework web HTTP/Router avec support OpenAPI
- **Integrant** : Gestion des composants et du cycle de vie de l'application
- **Ring/Jetty** : Serveur HTTP
- **Ragtime** : Gestion des migrations de base de donnees
- **PostgreSQL** : Base de donnees relationnelle
- **next.jdbc** : Bibliotheque d'acces a la base de donnees
- **Malli** : Validation des donnees et generation de schemas
- **Buddy** : Authentification et autorisation (JWT)
- **Jakarta Mail** : Envoi d'emails

### Frontend
- **React 19** : Bibliotheque UI
- **TypeScript** : Typage statique pour JavaScript
- **React Router v7** : Gestion du routage cote client
- **TanStack React Query** : Gestion du cache et des requetes API
- **Vite** : Outil de build et serveur de developpement
- **Tailwind CSS** : Framework CSS utilitaire
- **MJML** : Framework pour creer des emails responsive
- **Axios** : Client HTTP pour les appels API

### Infrastructure
- **Docker** : Conteneurisation de la base de donnees (developpement)
- **Fly.io** : Plateforme de deploiement (production)

## Fonctionnalites principales

- **Gestion hierarchique des referentiels** : Navigation et consultation des referentiels a 4 niveaux (NIV1 > NIV2 > NIV3 > NIV4)
- **Synchronisation Airtable** : Import des donnees de referentiel depuis Airtable (voir [documentation](docs/synchronisation-airtable.md))
- **Conversations** : Systeme de discussions lie aux elements du referentiel
- **Gestion de fichiers** : Upload, telechargement et gestion de documents
- **Administration** : Gestion des utilisateurs, logs d'activite, declenchement de synchronisations
- **Authentification** : Inscription, connexion, reinitialisation de mot de passe par email

## Demarrage rapide

### Prerequis
- [Node.js](https://nodejs.org/) (v18+)
- [PNPM](https://pnpm.io/) (v8+)
- [Clojure CLI](https://clojure.org/guides/deps_and_cli)
- [Docker](https://www.docker.com/) et Docker Compose

### Installation

```bash
# Installer les dependances
pnpm install

# Demarrer la base de donnees
docker-compose up -d

# Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec vos valeurs

# Executer les migrations
cd packages/backend && clojure -M:migrate && cd ../..

# Demarrer en developpement
pnpm dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:1337

### Commandes utiles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lancer tous les packages en parallele |
| `pnpm build` | Build complet |
| `pnpm test` | Lancer les tests |
| `pnpm lint` | Linter tous les packages |
| `cd packages/backend && clojure -M:run-m` | Backend uniquement |
| `cd packages/backend && clojure -T:build test` | Tests backend |
| `cd packages/backend && clojure -T:build ci` | Build uberjar backend |
| `cd packages/backend && clojure -M:migrate` | Executer les migrations |
| `cd packages/backend && clojure -M:rollback` | Annuler la derniere migration |
| `cd packages/backend && clojure -M:cli create <nom>` | Creer une migration |
| `cd packages/frontend && pnpm compile-emails` | Compiler les templates email |

## Base de donnees

PostgreSQL en local via Docker :
- **Nom** : `aicn_db`
- **Utilisateur** : `postgres`
- **Mot de passe** : `postgres`
- **Port** : 5432

Les migrations sont stockees dans `packages/backend/resources/migrations/`.

## Variables d'environnement

Voir `.env.example` pour la liste complete. Les principales :

| Variable | Description | Defaut |
|----------|-------------|--------|
| `DB_HOST` | Hote PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `DB_NAME` | Nom de la base | `aicn_db` |
| `SSL_MODE` | Mode SSL PostgreSQL | `disable` |
| `PORT` | Port du serveur backend | `1337` |
| `JWT_SECRET` | Cle secrete pour les tokens JWT | - |
| `AIRTABLE_TOKEN` | Token API Airtable | - |
| `AIRTABLE_APP_ID` | ID de l'application Airtable | - |
| `EMAIL_HOST` | Serveur SMTP | - |
| `EMAIL_PORT` | Port SMTP | `587` |
| `EMAIL_USERNAME` | Utilisateur SMTP | - |
| `EMAIL_PASSWORD` | Mot de passe SMTP | - |
| `EMAIL_FROM` | Adresse email d'expedition | - |
| `FRONTEND_URL` | URL du frontend (pour les emails) | `http://localhost:3000` |
| `UPLOAD_DIR` | Repertoire de stockage des fichiers | `uploads` |
| `LOG_LEVEL` | Niveau de log | `info` |

## Documentation

- [Guide d'administration](docs/administration.md) — gestion des utilisateurs, synchronisation, fichiers, monitoring
- [Deploiement sur Fly.io](docs/deploiement.md) — mise en production et configuration des secrets
- [Synchronisation Airtable](docs/synchronisation-airtable.md) — fonctionnement de la sync et impact sur les conversations
- [Specifications fonctionnelles](docs/2025%2003%2031%20Specs%20ECR%20V1.docx)
