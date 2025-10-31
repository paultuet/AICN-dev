# Plan de Refactoring AICN - Backend & Frontend

**Date:** 2025-10-31
**Scope:** Refactoring complet (HIGH + MEDIUM priority)
**Objectif:** Améliorer maintenabilité, testabilité et organisation du code

---

## Phase 1 : Backend (Clojure) - Sécurité & Structure

### 1.1 Sécurité (CRITIQUE - HIGH Priority)

**Fichier:** `/packages/backend/src/aicn/auth.clj`

- [ ] **Secret JWT hardcodé (ligne 13)** - URGENT
  - Déplacer `(def secret "votre-clé-secrète-très-longue")` vers variable d'environnement
  - Utiliser `(System/getenv "JWT_SECRET")`
  - Ajouter validation au démarrage si secret manquant
  - Mettre à jour documentation `.env.example`

- [ ] **Gestion d'erreurs DB**
  - Wrapper toutes les opérations JDBC dans `db.clj` avec try-catch
  - Logger les erreurs avec contexte
  - Retourner erreurs structurées

**Tests à ajouter:**
- Test de validation du secret au démarrage
- Tests d'erreurs DB (connexion perdue, timeout, etc.)

---

### 1.2 Réorganisation des Routes (HIGH Priority)

**Fichier:** `/packages/backend/src/aicn/routes.clj` (237 lignes)

**Problème:** Handlers inline, mélange routing + business logic

**Refactoring:**

- [ ] Créer namespace `aicn.handlers.conversations`
  - Extraire handlers lignes 47-59, 71-76
  - Fonctions: `get-conversations`, `create-conversation`, `send-message`, etc.

- [ ] Créer namespace `aicn.handlers.admin`
  - Extraire handlers lignes 93-108, 112-143
  - Fonctions: `sync-airtable`, `get-users`, etc.

- [ ] Créer namespace `aicn.handlers.files`
  - Extraire handlers lignes 148-177
  - Fonctions: `upload-file`, `list-files`, `download-file`

- [ ] Créer intercepteur `aicn.interceptors.error-response`
  ```clojure
  (defn error-response [status message & [details]]
    {:status status
     :body {:error message :details (or details {})}})
  ```

- [ ] Mettre à jour `routes.clj` pour utiliser les nouveaux handlers

**Tests à ajouter:**
- Tests unitaires pour chaque handler
- Tests d'intégration pour les routes principales
- Tests de l'intercepteur d'erreurs

---

### 1.3 Refactoring Auth (HIGH Priority)

**Fichier:** `/packages/backend/src/aicn/auth.clj` (408 lignes)

**Problème:** Auth, tokens, email, passwords tout dans un fichier

**Refactoring:**

- [ ] Créer `aicn.auth.tokens`
  - Extraire lignes 59-69 (token generation)
  - Fonctions: `generate-token`, `validate-token`, `decode-token`

- [ ] Créer `aicn.auth.passwords`
  - Extraire lignes 18-24 (password hashing)
  - Fonctions: `hash-password`, `verify-password`

- [ ] Créer `aicn.auth.handlers`
  - Extraire route handlers
  - Garder email sending (lignes 26-36) temporairement ici

- [ ] Simplifier fonction `login` (lignes 106-171, 66 lignes)
  - Extraire `validate-login-params`
  - Extraire `authenticate-user`
  - Extraire `generate-login-response`

- [ ] Simplifier fonction `register` (lignes 209-256, 48 lignes)
  - Même pattern que login

**Tests à ajouter:**
- Tests de génération/validation tokens
- Tests de hashing/vérification passwords
- Tests d'authentification (success/failure)
- Tests de registration (validation, duplication, etc.)

---

### 1.4 Optimisation DB (MEDIUM Priority)

**Fichier:** `/packages/backend/src/aicn/db.clj`

**Problème:** Duplication patterns CRUD

**Refactoring:**

- [ ] Créer fonction générique `fetch-one`
  ```clojure
  (defn fetch-one [datasource query-vec schema]
    (->> (jdbc/execute-one! datasource query-vec
           {:builder-fn rs/as-unqualified-maps})
         (decode schema)))
  ```

- [ ] Créer fonction générique `fetch-many`
  ```clojure
  (defn fetch-many [datasource query-vec schema]
    (->> (jdbc/execute! datasource query-vec
           {:builder-fn rs/as-unqualified-maps})
         (map #(decode schema %))))
  ```

- [ ] Refactoriser toutes les requêtes pour utiliser ces fonctions
  - `get-user-by-email` (lignes 102-106)
  - `get-user-by-verification-token` (lignes 108-112)
  - `get-user-by-reset-token` (lignes 114-118)
  - Etc.

- [ ] Extraire helper pour transformation réponse (kebab->camel)

**Réduction estimée:** ~30% de code en moins

**Tests à ajouter:**
- Tests des fonctions génériques
- Tests de transformation kebab->camel
- Tests des requêtes refactorisées

---

### 1.5 Simplification Airtable Adapter (HIGH Priority)

**Fichier:** `/packages/backend/src/aicn/adapters/airtable.clj` (373 lignes)

**Problème:** `build-hierarchical-level` trop complexe (lignes 256-303)

**Refactoring:**

- [ ] Extraire `process-niveau-1`
  - Logique spécifique niveau 1
  - Tests unitaires

- [ ] Extraire `process-niveau-2`
  - Logique spécifique niveau 2
  - Tests unitaires

- [ ] Extraire `process-niveau-3`
  - Logique spécifique niveau 3
  - Tests unitaires

- [ ] Refactoriser `build-hierarchical-level` pour utiliser ces fonctions
  - Réduire complexité cyclomatique de 15+ à <5

**Tests à ajouter:**
- Tests pour chaque fonction de niveau
- Tests d'intégration pour build-hierarchical-level
- Tests avec données Airtable mockées

---

### 1.6 Autres Refactorings Backend (MEDIUM Priority)

- [ ] Renommer `core.clj` en `interceptors.clj` (plus clair)
- [ ] Considérer HoneySQL pour queries complexes (optionnel)
- [ ] Étendre usage Integrant pour http-client, email (optionnel)

---

## Phase 2 : Frontend (TypeScript/React) - Composants & Hooks

### 2.1 Refactoring Composants Géants (HIGH Priority)

#### HierarchicalView.tsx (1099 lignes!)

**Fichier:** `/packages/frontend/src/components/referentials/HierarchicalView.tsx`

**Problème:** Fichier massif avec 4 composants

**Refactoring:**

- [ ] Créer `/components/referentials/hierarchical/HierarchicalNode.tsx`
  - Extraire composant HierarchicalNode
  - Props interface
  - Tests React Testing Library

- [ ] Créer `/components/referentials/hierarchical/LinkedHierarchicalNode.tsx`
  - Extraire composant LinkedHierarchicalNode
  - Props interface
  - Tests

- [ ] Créer `/components/referentials/hierarchical/LinkedFieldsContent.tsx`
  - Extraire composant LinkedFieldsContent
  - Props interface
  - Tests

- [ ] Créer `/components/referentials/hierarchical/index.ts`
  - Exports barrel

- [ ] Refactoriser `HierarchicalView.tsx` comme container
  - Importer composants extraits
  - Réduire à ~200-300 lignes

**Tests à ajouter:**
- Tests de rendu pour chaque composant
- Tests d'interactions (click, expand/collapse)
- Tests d'intégration du container

---

#### ConversationSidebar.tsx (533 lignes)

**Fichier:** `/packages/frontend/src/components/conversations/ConversationSidebar.tsx`

**Refactoring:**

- [ ] Identifier sous-composants à extraire
- [ ] Créer fichiers séparés pour chaque sous-composant
- [ ] Tests pour chaque composant

---

#### FileDownloadPage.tsx (358 lignes)

**Fichier:** `/packages/frontend/src/pages/FileDownloadPage.tsx`

**Refactoring:**

- [ ] Créer `/components/files/FileUploadForm.tsx`
  - Logique upload + validation
  - Tests

- [ ] Créer `/components/files/FileListTable.tsx`
  - Affichage liste fichiers
  - Tests

- [ ] Créer `/components/files/FilePreview.tsx`
  - Preview fichiers
  - Tests

- [ ] Refactoriser `FileDownloadPage.tsx` comme container

---

### 2.2 Refactoring Hooks (HIGH Priority)

#### useReferentials.ts (489 lignes)

**Fichier:** `/packages/frontend/src/hooks/useReferentials.ts`

**Problème:** Hook `useReferentialFilters` de 384 lignes!

**Refactoring:**

- [ ] Créer `/hooks/referentials/useReferentialFilters.ts`
  - État des filtres uniquement
  - `searchTerm`, `selectedEntityId`, `selectedType`, etc.
  - Tests

- [ ] Créer `/hooks/referentials/useReferentialPredicates.ts`
  - Fonctions de filtrage (lignes 152-233)
  - `shouldDisplayEntity`, etc.
  - Tests unitaires

- [ ] Créer `/hooks/referentials/useFilteredReferentials.ts`
  - Logique de filtrage mémoïsée (lignes 256-361)
  - Utilise les prédicates
  - Tests

- [ ] Créer `/hooks/referentials/index.ts`
  - Exports barrel
  - Hook composite si nécessaire

**Réduction:** De 489 lignes à ~3 fichiers de 100-150 lignes chacun

**Tests à ajouter:**
- Tests de chaque hook isolément
- Tests d'intégration des hooks combinés

---

#### useConversations.ts (370 lignes)

**Fichier:** `/packages/frontend/src/hooks/useConversations.ts`

**Problème:** Mélange queries, mutations, business logic

**Refactoring:**

- [ ] Créer `/hooks/conversations/useConversationQueries.ts`
  - React Query queries uniquement
  - Tests

- [ ] Créer `/hooks/conversations/useConversationMutations.ts`
  - React Query mutations
  - Tests

- [ ] Créer `/hooks/conversations/useConversationFilters.ts`
  - Logique de filtrage conversations
  - Tests

- [ ] Refactoriser `useConversations.ts` comme hook composite
  - Orchestre les autres hooks
  - ~100-150 lignes

**Tests à ajouter:**
- Tests de queries (avec MSW)
- Tests de mutations
- Tests de filtres
- Tests d'intégration

---

### 2.3 Logique de Sélection (MEDIUM Priority)

#### HomePage.tsx

**Fichier:** `/packages/frontend/src/pages/HomePage.tsx`

**Problème:** Logique complexe de sélection dans composant (lignes 77-209)

**Refactoring:**

- [ ] Créer `/hooks/useReferentialSelection.ts`
  - Extraire `isFieldSelected` (lignes 77-99)
  - Extraire `isGroupSelected` (lignes 102-108)
  - Extraire `toggleFieldSelection` (lignes 110-184)
  - Extraire `toggleGroupSelection` (lignes 186-209)
  - Tests

- [ ] Refactoriser `HomePage.tsx` pour utiliser le hook

**Tests à ajouter:**
- Tests de logique de sélection
- Tests de toggles
- Tests d'interactions

---

#### Utility Field ID Comparison

**Problème:** Duplication logique comparaison field IDs dans 3 fichiers:
- `/hooks/useReferentials.ts` lignes 217-220
- `/hooks/useConversations.ts` lignes 271-273
- `/utils/referentialUtils.ts` lignes 60-69

**Refactoring:**

- [ ] Créer fonction utilitaire centralisée
  ```typescript
  export function compareFieldIds(
    id1: number | string,
    id2: number | string
  ): boolean {
    return id1 === id2 ||
           id1 === Number(id2) ||
           String(id1) === String(id2);
  }
  ```

- [ ] Remplacer toutes les occurrences
- [ ] Tests unitaires

---

### 2.4 React Query Optimization (MEDIUM Priority)

**Problème:** Query keys simples strings, pas de stratégie invalidation

**Refactoring:**

- [ ] Créer `/config/queryKeys.ts`
  ```typescript
  export const queryKeys = {
    conversations: {
      all: ['conversations'] as const,
      unreadCount: ['conversations', 'unread-count'] as const,
      byId: (id: string) => ['conversations', id] as const,
    },
    referentials: {
      all: ['referentials'] as const,
      byType: (type: string) => ['referentials', type] as const,
    },
    users: {
      all: ['users'] as const,
      me: ['users', 'me'] as const,
    },
  };
  ```

- [ ] Remplacer tous les query keys hardcodés
- [ ] Améliorer invalidation patterns
- [ ] Documentation des stratégies

**Tests à ajouter:**
- Tests de query keys factory
- Tests d'invalidation

---

### 2.5 Réorganisation Utils (MEDIUM Priority)

#### referentialUtils.ts (225 lignes)

**Fichier:** `/packages/frontend/src/utils/referentialUtils.ts`

**Refactoring:**

- [ ] Regrouper par catégorie avec commentaires:
  ```typescript
  // ========================================
  // Conversation Predicates
  // ========================================
  export function getConversationsForField(...) {}
  export function getConversationsForGroup(...) {}

  // ========================================
  // Field Utilities
  // ========================================
  export function findFieldById(...) {}

  // ========================================
  // Group Utilities
  // ========================================
  export function getFieldsByGroup(...) {}
  ```

- [ ] Considérer split en plusieurs fichiers si nécessaire
  - `referentialUtils/conversations.ts`
  - `referentialUtils/fields.ts`
  - `referentialUtils/groups.ts`

**Tests à ajouter:**
- Tests unitaires pour chaque fonction utilitaire

---

#### Centralisation Date Formatting

- [ ] Vérifier usage de formatage dates
- [ ] Créer ou consolider `/utils/dateUtils.ts`
- [ ] Utiliser partout de façon cohérente
- [ ] Tests

---

### 2.6 Autres Refactorings Frontend (MEDIUM Priority)

- [ ] Créer factory de contextes pour réduire boilerplate
- [ ] Considérer branded types pour IDs (optionnel)
- [ ] Améliorer typage erreurs API
- [ ] Ajouter retry logic à API client (optionnel)

---

## Phase 3 : Tests & Documentation

### 3.1 Tests Backend

**Target:** 70%+ coverage pour business logic

- [ ] Tests Auth
  - Login success/failure
  - Register validation
  - Token generation/validation
  - Password hashing

- [ ] Tests Database
  - Queries critiques
  - Error handling
  - Transactions

- [ ] Tests Handlers
  - Conversations endpoints
  - Admin endpoints
  - Files endpoints

- [ ] Tests Airtable Adapter
  - Parsing niveaux
  - Transformation données
  - Error handling

**Commande test:** `cd packages/backend && clojure -T:build test`

---

### 3.2 Tests Frontend

**Target:** 70%+ coverage pour business logic

- [ ] Tests Hooks
  - useReferentials (tous les hooks extraits)
  - useConversations (tous les hooks extraits)
  - useReferentialSelection
  - Tests avec `@testing-library/react-hooks`

- [ ] Tests Composants
  - HierarchicalView hierarchy
  - ConversationSidebar
  - FileDownloadPage components
  - React Testing Library

- [ ] Tests Utils
  - referentialUtils
  - dateUtils
  - compareFieldIds
  - Jest

**Commande test:** `cd packages/frontend && pnpm test`

---

### 3.3 Documentation

- [ ] Backend
  - Ajouter docstrings manquantes pour fonctions publiques
  - README pour modules majeurs (auth, db, adapters)
  - Architecture Decision Records (ADRs) si décisions importantes

- [ ] Frontend
  - JSDoc pour hooks custom
  - JSDoc pour utils publiques
  - README pour composants complexes
  - Storybook stories (optionnel)

- [ ] Global
  - Mettre à jour CLAUDE.md avec nouvelles conventions
  - Documenter stratégies de test
  - Diagramme architecture (optionnel)

---

## Ordre d'Exécution Recommandé

### Sprint 1 : Sécurité + Composants Critiques
1. ✅ **Backend 1.1** - Secret JWT & erreurs DB (CRITIQUE)
2. ✅ **Frontend 2.1** - HierarchicalView (1099 lignes)
3. ✅ **Frontend 2.2** - useReferentials hook (489 lignes)

### Sprint 2 : Routes & Handlers
4. ✅ **Backend 1.2** - Extraction routes/handlers
5. ✅ **Backend 1.3** - Refactoring auth.clj
6. ✅ **Frontend 2.2** - useConversations hook

### Sprint 3 : Optimisations & Cleanup
7. ✅ **Backend 1.4** - Optimisation DB
8. ✅ **Backend 1.5** - Simplification Airtable
9. ✅ **Frontend 2.3** - Logique sélection
10. ✅ **Frontend 2.4** - React Query optimization
11. ✅ **Frontend 2.1** - Autres composants (ConversationSidebar, FileDownloadPage)

### Sprint 4 : Tests & Documentation
12. ✅ **Phase 3.1** - Tests backend
13. ✅ **Phase 3.2** - Tests frontend
14. ✅ **Phase 3.3** - Documentation

---

## Métriques de Succès

### Avant Refactoring
- **Backend:**
  - `auth.clj`: 408 lignes
  - `routes.clj`: 237 lignes
  - `airtable.clj`: 373 lignes
  - Secret hardcodé ❌
  - Coverage: 0%

- **Frontend:**
  - `HierarchicalView.tsx`: 1099 lignes
  - `useReferentials.ts`: 489 lignes
  - `useConversations.ts`: 370 lignes
  - Coverage: ?%

### Après Refactoring
- **Backend:**
  - Fichiers < 200 lignes en moyenne
  - Secret en env variable ✅
  - Coverage: 70%+
  - Erreurs DB gérées ✅

- **Frontend:**
  - Composants < 300 lignes
  - Hooks < 150 lignes
  - Coverage: 70%+
  - Query keys type-safe ✅

---

## Durée Estimée

- **Sprint 1:** 4-6 heures
- **Sprint 2:** 4-6 heures
- **Sprint 3:** 4-6 heures
- **Sprint 4:** 6-8 heures

**Total:** 18-26 heures (2-3 semaines à temps partiel)

---

## Notes

- Ce plan peut être ajusté en fonction des priorités changeantes
- Chaque étape doit passer les tests avant de passer à la suivante
- Les commits doivent être atomiques et bien documentés
- Faire des PRs par sprint pour faciliter la review

---

**Dernière mise à jour:** 2025-10-31
