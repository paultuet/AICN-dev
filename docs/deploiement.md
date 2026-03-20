# Deploiement sur Fly.io

## Prerequis

1. Creer un compte sur [Fly.io](https://fly.io)
2. Installer le CLI Fly :
   ```bash
   brew install flyctl
   ```
   Ou sur Linux :
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

## Configuration de la base de donnees

L'application utilise PostgreSQL. Configurez les variables d'environnement de connexion via les secrets Fly.io :

```bash
fly secrets set \
  DB_HOST=your-db-host \
  DB_PORT=5432 \
  DB_USER=postgres \
  DB_PASSWORD=your-password \
  DB_NAME=your-db-name \
  SSL_MODE=require
```

## Configuration des autres secrets

```bash
fly secrets set \
  JWT_SECRET=your-jwt-secret \
  AIRTABLE_TOKEN=your-airtable-token \
  AIRTABLE_APP_ID=your-airtable-app-id \
  EMAIL_HOST=your-smtp-host \
  EMAIL_PORT=587 \
  EMAIL_USERNAME=your-email \
  EMAIL_PASSWORD=your-email-password \
  EMAIL_FROM=noreply@example.com \
  FRONTEND_URL=https://your-app.fly.dev
```

## Volume persistant (fichiers uploades)

Avant le premier deploiement, creer un volume pour le stockage des fichiers :

```bash
fly volumes create aicn_uploads --region cdg --size 10
```

Le volume est monte automatiquement sur `/data` (configure dans `fly.toml`).

Gestion des volumes :
- Lister : `fly volumes list`
- Details : `fly volumes show <volume-id>`

> Les volumes sont persistants entre les deploiements mais specifiques a une region.

## Deploiement

1. Se connecter :
   ```bash
   fly auth login
   ```

2. Deployer :
   ```bash
   fly deploy
   ```

Le Dockerfile multi-stage (`packages/backend/Dockerfile`) gere automatiquement :
- Build du frontend (React/Vite)
- Compilation des templates email (MJML)
- Build de l'uberjar backend (Clojure)
- Image runtime minimale (JRE 17)

## Verification

```bash
fly status        # Etat de l'application
fly logs          # Logs en temps reel
fly open          # Ouvrir dans le navigateur
```

## Resolution des problemes

```bash
fly logs                # Consulter les logs
fly ssh console         # Se connecter a l'instance
fly apps restart        # Redemarrer l'application
```
