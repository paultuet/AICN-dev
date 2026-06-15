// Types for the Journal feature (admin-authored posts + attachments)

export interface JournalAttachment {
  id: string;
  postId: string;
  fileName: string;
  fileSize: number;
  contentType?: string | null;
  createdAt: string;
}

export interface JournalPost {
  id: string;
  postDate: string; // ISO date string (YYYY-MM-DD)
  title: string;
  content: string; // sanitized rich-text HTML
  tag: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments: JournalAttachment[];
}

export interface CreateJournalPostInput {
  postDate: string;
  title: string;
  content: string;
  tag: string;
}

export interface UpdateJournalPostInput {
  postDate?: string;
  title?: string;
  content?: string;
  tag?: string;
}
