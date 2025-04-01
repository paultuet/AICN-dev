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
