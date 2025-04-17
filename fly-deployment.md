# Déploiement AICN sur Fly.io avec Supabase

Ce document explique comment déployer l'application AICN sur Fly.io en utilisant Supabase comme base de données.

## Prérequis

1. Créer un compte sur [Fly.io](https://fly.io)
2. Créer un compte sur [Supabase](https://supabase.com)
3. Installer le CLI Fly avec:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
   Ou sur macOS:
   ```bash
   brew install flyctl
   ```

## Configuration Supabase

1. Créer un nouveau projet sur Supabase
2. Noter les informations de connexion:
   - Host (généralement *.supabase.co)
   - Port (généralement 5432)
   - Database name
   - User
   - Password
3. Initialiser votre base de données en important les scripts SQL fournis

## Déploiement sur Fly.io

1. Se connecter à Fly.io:
   ```bash
   fly auth login
   ```

2. Construire l'application:
   ```bash
   ./build.sh
   ```

3. Lancer le déploiement en initialisant l'application:
   ```bash
   fly launch
   ```
   Ou utiliser la configuration existante:
   ```bash
   fly deploy
   ```

4. Configuration des secrets pour la connexion à Supabase:
   ```bash
   fly secrets set \
     DB_HOST=db.example.supabase.co \
     DB_PORT=5432 \
     DB_USER=postgres \
     DB_PASSWORD=your-password \
     DB_NAME=postgres
   ```

5. Vérifier le déploiement:
   ```bash
   fly status
   ```

6. Ouvrir l'application dans le navigateur:
   ```bash
   fly open
   ```

## Test local avec Supabase

Pour tester localement avec Supabase, créez un fichier `.env` à la racine du projet:

```
DB_HOST=db.example.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
SSL_MODE=require
```

Puis lancez l'application avec:

```bash
docker-compose -f docker-compose.unified.yml up
```

## Résolution des problèmes

- **Vérifier les logs**:
  ```bash
  fly logs
  ```

- **Se connecter à l'instance**:
  ```bash
  fly ssh console
  ```

- **Redémarrer l'application**:
  ```bash
  fly apps restart
  ```

## Mise à jour

Pour mettre à jour l'application après des modifications:

1. Reconstruire l'application:
   ```bash
   ./build.sh
   ```

2. Redéployer:
   ```bash
   fly deploy
   ```