// Types de base pour l'identification
export type ID = string
export type EntityId = string
export type FieldId = number | string
export type GroupName = string

// Type pour un message dans une conversation
export type Message = {
  id: ID
  conversationId: ID
  content: string
  createdAt: string
  authorId: string
  authorName: string
}

// Types de sélection possibles (discriminated union)
export type FieldSelection = {
  type: 'field'
  entityId: EntityId
  fieldIds: FieldId[]
  fieldName?: string
}

export type GroupSelection = {
  type: 'group'
  entityId: EntityId
  groupName: GroupName
}

// Type union pour les sélections
export type Selection = FieldSelection | GroupSelection

// Type pour le statut de lecture d'une conversation
export type ConversationReadStatus = {
  isRead: boolean
  lastReadAt?: string
}

// Type pour une conversation
export type Conversation = {
  id: ID
  title: string
  createdAt: string
  lastActivity: string
  messageCount: number
  linkedItems: Selection[]
  messages?: Message[]
  readStatus?: ConversationReadStatus
}

// Types de filtres pour les conversations
export type ConversationFilter = (conversation: Conversation) => boolean

// Options de vue pour le panneau latéral
export type SidebarViewMode = 'selection' | 'conversation'

// Types d'action pour la gestion des conversations
export type ConversationAction = 
  | { type: 'CREATE_CONVERSATION'; payload: { title: string; linkedItems: Selection[] } }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: ID; content: string; author: { id: string; name: string } } }
  | { type: 'SELECT_CONVERSATION'; payload: { conversationId: ID } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_VIEW_MODE'; payload: SidebarViewMode }