export type Comment = {
  id: string;
  targetType: 'entity' | 'field';
  targetId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type CommentCount = {
  targetType: 'entity' | 'field';
  targetId: string;
  count: number;
};
