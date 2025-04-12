export type Message = {
  id: string
  conversationId: string
  content: string
  createdAt: string
  authorId: string
  authorName: string
}

export type Conversation = {
  id: string
  title: string
  createdAt: string
  lastActivity: string
  messageCount: number
  // Données pour lier la conversation à des groupes ou des champs
  linkedItems: Selection[]
  messages?: Message[]
}

export type Selection = {
  type: 'field' | 'group'
  entityId: string
  groupName?: string
  fieldIds?: number[]
}