-- Migration pour adapter la table conversations au nouveau schéma
-- Drop existing conversations table and recreate with new schema
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.conversations;

-- Create new conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id VARCHAR(255) PRIMARY KEY, -- Match the frontend ID format
    title VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    linked_items JSONB NOT NULL DEFAULT '[]', -- Store Selection[] as JSON
    created_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create new messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id VARCHAR(255) PRIMARY KEY, -- Match the frontend ID format
    conversation_id VARCHAR(255) NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author_id VARCHAR(255) NOT NULL, -- User ID as string (for flexibility)
    author_name VARCHAR(255) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON public.conversations(last_activity);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON public.messages(author_id);

-- Create GIN index for linked_items JSONB queries
CREATE INDEX IF NOT EXISTS idx_conversations_linked_items ON public.conversations USING GIN (linked_items);

-- Function to update last_activity when a message is added
CREATE OR REPLACE FUNCTION update_conversation_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET 
        last_activity = NEW.created_at,
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation stats when messages are inserted
CREATE TRIGGER trigger_update_conversation_last_activity
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_activity();