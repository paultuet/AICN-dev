# Plan d'Action : Gestion Lu/Non-Lu des Conversations

## Vue d'ensemble

L'objectif est d'ajouter un système permettant aux utilisateurs de marquer des conversations comme "lues" et de les faire repasser automatiquement en "non-lues" quand de nouveaux messages arrivent.

## 🗄️ Phase 1 : Modifications Base de Données

### 1.1 Nouvelle table `conversation_read_status`
```sql
-- Migration 004-add-conversation-read-status.up.sql
CREATE TABLE conversation_read_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique : un statut par utilisateur/conversation
    UNIQUE(conversation_id, user_id)
);

-- Index pour performance
CREATE INDEX idx_conversation_read_status_user_id ON conversation_read_status(user_id);
CREATE INDEX idx_conversation_read_status_conversation_id ON conversation_read_status(conversation_id);
CREATE INDEX idx_conversation_read_status_unread ON conversation_read_status(user_id, is_read) 
    WHERE is_read = false;
```

### 1.2 Trigger automatique pour marquer "non-lu"
```sql
-- Fonction trigger pour marquer comme non-lu quand nouveau message
CREATE OR REPLACE FUNCTION mark_conversation_unread_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Marquer comme non-lu pour tous les utilisateurs qui l'avaient marqué comme lu
    UPDATE conversation_read_status 
    SET is_read = false, 
        updated_at = NOW()
    WHERE conversation_id = NEW.conversation_id 
    AND is_read = true
    AND user_id::text != NEW.author_id; -- Pas pour l'auteur du message
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur ajout de message
CREATE TRIGGER trigger_mark_conversation_unread
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION mark_conversation_unread_on_new_message();
```

## 🔧 Phase 2 : Backend Clojure

### 2.1 Nouveau modèle Malli
```clojure
;; Dans aicn.model
:conversation-read-status
[:map
 [:id :uuid]
 [:conversation-id :string]
 [:user-id :uuid]
 [:is-read :boolean]
 [:last-read-at {:optional true} [:maybe inst?]]
 [:created-at inst?]
 [:updated-at inst?]]
```

### 2.2 Nouvelles fonctions DB
```clojure
;; Dans aicn.db - nouvelles fonctions
(defn get-conversation-read-status [db conversation-id user-id]
  "Récupère le statut lu/non-lu d'une conversation pour un utilisateur")

(defn mark-conversation-as-read [db conversation-id user-id]
  "Marque une conversation comme lue (UPSERT)")

(defn mark-conversation-as-unread [db conversation-id user-id]
  "Marque une conversation comme non-lue")

(defn get-conversations-with-read-status [db user-id]
  "Récupère toutes les conversations avec leur statut lu/non-lu pour l'utilisateur")

(defn get-unread-conversations-count [db user-id]
  "Compte le nombre de conversations non-lues pour un utilisateur")
```

### 2.3 Mise à jour API REST
```clojure
;; Nouvelles routes dans aicn.routes
;; PUT /api/conversations/:id/read - Marquer comme lu
;; DELETE /api/conversations/:id/read - Marquer comme non-lu  
;; GET /api/conversations/unread-count - Compteur conversations non-lues

;; Modification route existante
;; GET /api/conversations - Inclure le statut lu/non-lu dans la réponse
```

### 2.4 Nouveau schéma de réponse API
```clojure
;; Format réponse enrichi
{:conversations 
 [{:id "conv-123"
   :title "Ma conversation"
   :message-count 5
   :last-activity "2024-01-15T10:30:00Z"
   :read-status {:is-read true
                 :last-read-at "2024-01-15T09:45:00Z"}
   :messages [...]}]}
```

## 🎨 Phase 3 : Frontend React

### 3.1 Mise à jour des types TypeScript
```typescript
// Dans types/conversation.ts
export type ConversationReadStatus = {
  isRead: boolean
  lastReadAt?: string
}

export type Conversation = {
  id: ID
  title: string
  createdAt: string
  lastActivity: string
  messageCount: number
  linkedItems: Selection[]
  messages?: Message[]
  readStatus?: ConversationReadStatus // NOUVEAU
}
```

### 3.2 Nouveaux hooks React Query
```typescript
// Dans hooks/useConversations.ts
export const useMarkConversationAsRead = () => {
  return useMutation({
    mutationFn: (conversationId: string) => 
      api.put(`/conversations/${conversationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations'])
    }
  })
}

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['conversations', 'unread-count'],
    queryFn: () => api.get('/conversations/unread-count'),
    refetchInterval: 30000 // Rafraîchit toutes les 30s
  })
}
```

### 3.3 Composants UI enrichis

#### Indicateur visuel dans la liste
```typescript
// ConversationListItem.tsx (nouveau composant)
const ConversationListItem = ({ conversation }) => {
  const isUnread = !conversation.readStatus?.isRead
  
  return (
    <div className={`p-3 border-l-4 ${
      isUnread ? 'border-blue-500 bg-blue-50' : 'border-transparent'
    }`}>
      <div className="flex justify-between items-center">
        <h3 className={isUnread ? 'font-bold' : 'font-normal'}>
          {conversation.title}
        </h3>
        {isUnread && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Non lu
          </span>
        )}
      </div>
    </div>
  )
}
```

#### Bouton "Marquer comme lu"
```typescript
// ConversationHeader.tsx - ajout du bouton
const MarkAsReadButton = ({ conversationId, isRead }) => {
  const markAsRead = useMarkConversationAsRead()
  
  if (isRead) return null
  
  return (
    <button 
      onClick={() => markAsRead.mutate(conversationId)}
      className="text-sm text-blue-600 hover:text-blue-800"
    >
      Marquer comme lu
    </button>
  )
}
```

#### Badge compteur global
```typescript
// UnreadBadge.tsx - badge dans le header/sidebar
const UnreadBadge = () => {
  const { data: count } = useUnreadCount()
  
  if (!count || count === 0) return null
  
  return (
    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
      {count}
    </span>
  )
}
```

### 3.4 Auto-marquage comme lu
```typescript
// Hook pour marquer automatiquement comme lu après lecture
const useAutoMarkAsRead = (conversationId: string, isRead: boolean) => {
  const markAsRead = useMarkConversationAsRead()
  
  useEffect(() => {
    if (!isRead && conversationId) {
      // Marquer comme lu après 3 secondes de visibilité
      const timer = setTimeout(() => {
        markAsRead.mutate(conversationId)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [conversationId, isRead, markAsRead])
}
```

## 🔄 Phase 4 : Logique Métier et UX

### 4.1 Règles métier
- **Auto-marquage** : Une conversation devient "lue" automatiquement après 3s de consultation
- **Nouveau message** : Trigger DB marque automatiquement comme "non-lu" pour tous sauf l'auteur
- **Marquage manuel** : Bouton "Marquer comme lu" disponible
- **Persistance** : Le statut est sauvegardé par utilisateur

### 4.2 Indicateurs visuels
- **Conversation non-lue** : Bordure bleue + fond légèrement coloré + titre en gras
- **Badge "Non lu"** : Pastille bleue avec texte
- **Compteur global** : Badge rouge avec nombre de conversations non-lues
- **État de transition** : Loading states pendant les requêtes

### 4.3 Filtres et recherche
```typescript
// Ajout d'un filtre dans ConversationSidebar
const ConversationFilters = () => {
  return (
    <div className="mb-4">
      <button 
        onClick={() => setFilter('unread')}
        className="mr-2 px-3 py-1 bg-blue-100 text-blue-800 rounded"
      >
        Non lues ({unreadCount})
      </button>
      <button 
        onClick={() => setFilter('all')}
        className="px-3 py-1 bg-gray-100 text-gray-800 rounded"
      >
        Toutes
      </button>
    </div>
  )
}
```

## 🚀 Phase 5 : Migration et Déploiement

### 5.1 Migration de données existantes
```sql
-- Script de migration pour les conversations existantes
INSERT INTO conversation_read_status (conversation_id, user_id, is_read, last_read_at)
SELECT DISTINCT 
    c.id as conversation_id,
    u.id as user_id,
    true as is_read, -- Marquer comme lues par défaut
    c.last_activity as last_read_at
FROM conversations c
CROSS JOIN users u
WHERE NOT EXISTS (
    SELECT 1 FROM conversation_read_status crs 
    WHERE crs.conversation_id = c.id AND crs.user_id = u.id
);
```

### 5.2 Tests
- **Tests unitaires** : Fonctions DB nouvelles
- **Tests d'intégration** : API endpoints
- **Tests E2E** : Scénarios utilisateur complets
- **Tests de performance** : Requêtes avec JOINs

## 📊 Phase 6 : Monitoring et Métriques

### 6.1 Métriques à suivre
- Nombre de conversations marquées comme lues/non-lues par jour
- Temps moyen avant marquage comme lu
- Performances des requêtes avec JOINs
- Utilisation du filtre "Non lues"

### 6.2 Logs
- Actions de marquage lu/non-lu
- Triggers automatiques
- Erreurs de synchronisation

## 🔧 Estimation Temporelle

- **Phase 1** (DB) : 0.5 jour
- **Phase 2** (Backend) : 1 jour  
- **Phase 3** (Frontend) : 1.5 jours
- **Phase 4** (UX/Tests) : 0.5 jour
- **Phase 5** (Migration) : 0.5 jour

**Total estimé : 4 jours**

## 🏗️ Architecture Existante Analysée

### Base de Données Actuelle
- Table `conversations` avec ID string, titre, compteurs automatiques
- Table `messages` avec cascade DELETE et triggers de mise à jour
- Index optimisés pour performance
- Structure moderne vs ancienne architecture refactorisée

### Backend Clojure
- Architecture Integrant avec injection de dépendances
- Schémas Malli pour validation
- API REST avec transformateurs automatiques kebab-case/snake_case
- Authentification JWT avec intercepteurs

### Frontend React
- React 19 + TypeScript + TanStack Query
- Context API + React Query pour state management
- Composants modulaires avec Tailwind CSS
- Architecture scalable avec hooks personnalisés

## 🎯 Points Clés de l'Implémentation

**Architecture proposée :**
- Table `conversation_read_status` pour traçabilité par utilisateur
- Trigger automatique pour marquer "non-lu" lors de nouveaux messages  
- API REST enrichie avec statuts de lecture
- Interface utilisateur avec indicateurs visuels et filtres

**Avantages de cette approche :**
- **Scalable** : Une table séparée évite la dénormalisation
- **Performant** : Index optimisés pour les requêtes fréquentes
- **Flexible** : Peut être étendu (notifications, mentions, etc.)
- **UX intuitive** : Auto-marquage + contrôle manuel

**Intégration avec l'existant :**
- S'appuie sur l'architecture Integrant + React Query existante
- Réutilise les patterns de validation Malli et transformateurs API
- Compatible avec le système d'authentification JWT actuel

Ce plan respecte les conventions du codebase et propose une solution robuste pour la gestion lu/non-lu des conversations.