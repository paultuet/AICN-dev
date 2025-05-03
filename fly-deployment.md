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
     etc...
   ```

5. Vérifier le déploiement:
   ```bash
   fly status
   ```

6. Ouvrir l'application dans le navigateur:
   ```bash
   fly open
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

Build et redéploiement depuis un Dockerfile:
   ```bash
   fly deploy
   ```
