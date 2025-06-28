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

