import { Conversation } from '@/types/conversation';

export const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Inventaire des équipements - Question sur les identifiants',
    createdAt: '2025-04-10T15:30:00Z',
    lastActivity: '2025-04-11T09:45:00Z',
    messageCount: 5,
    linkedItems: [
      {
        type: 'group',
        entityId: 'rec6UfjT6LZMWwKom',
        groupName: 'Identification de l\'équipement'
      }
    ],
    messages: [
      {
        id: 'm1',
        conversationId: '1',
        content: "Bonjour, pourriez-vous clarifier comment les identifiants d'équipement sont générés dans le système ? Est-ce automatique ou manuel ?",
        createdAt: '2025-04-10T15:30:00Z',
        authorId: 'user1',
        authorName: 'Julien Dupont'
      },
      {
        id: 'm2',
        conversationId: '1',
        content: "Les identifiants sont générés automatiquement par le système lors de la création de l'équipement. Ils suivent le format EQ-YYYY-XXXXX où YYYY est l'année et XXXXX est un numéro séquentiel.",
        createdAt: '2025-04-10T15:45:00Z',
        authorId: 'user2',
        authorName: 'Sophie Moreau'
      },
      {
        id: 'm3',
        conversationId: '1',
        content: "Est-ce que ces identifiants sont modifiables après création ?",
        createdAt: '2025-04-10T16:15:00Z',
        authorId: 'user1',
        authorName: 'Julien Dupont'
      },
      {
        id: 'm4',
        conversationId: '1',
        content: "Non, les identifiants sont immuables une fois créés pour garantir la traçabilité.",
        createdAt: '2025-04-10T16:30:00Z',
        authorId: 'user2',
        authorName: 'Sophie Moreau'
      },
      {
        id: 'm5',
        conversationId: '1',
        content: "Merci pour ces précisions, c'est plus clair maintenant.",
        createdAt: '2025-04-11T09:45:00Z',
        authorId: 'user1',
        authorName: 'Julien Dupont'
      }
    ]
  },
  {
    id: '2',
    title: 'Données du cycle de vie - Clarifications',
    createdAt: '2025-04-08T10:20:00Z',
    lastActivity: '2025-04-08T14:30:00Z',
    messageCount: 3,
    linkedItems: [
      {
        type: 'field',
        entityId: 'rec6UfjT6LZMWwKom',
        fieldIds: [17]
      }
    ],
    messages: [
      {
        id: 'm6',
        conversationId: '2',
        content: "Je ne comprends pas bien la différence entre 'date de mise en service' et 'date d'activation'. Pouvez-vous expliquer ?",
        createdAt: '2025-04-08T10:20:00Z',
        authorId: 'user3',
        authorName: 'Thomas Martin'
      },
      {
        id: 'm7',
        conversationId: '2',
        content: "La date de mise en service correspond à l'installation physique de l'équipement, tandis que la date d'activation est le moment où il est enregistré dans le système et devient opérationnel.",
        createdAt: '2025-04-08T11:05:00Z',
        authorId: 'user4',
        authorName: 'Claire Dubois'
      },
      {
        id: 'm8',
        conversationId: '2',
        content: "Compris, merci pour cette précision.",
        createdAt: '2025-04-08T14:30:00Z',
        authorId: 'user3',
        authorName: 'Thomas Martin'
      }
    ]
  }
];
