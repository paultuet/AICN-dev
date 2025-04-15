-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS aicn_db;

-- Set search path to use aicn_db schema
SET search_path TO aicn_db;

-- Create users table
CREATE TABLE IF NOT EXISTS aicn_db.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
    access_rights JSONB NOT NULL DEFAULT '{"referenceIds": [], "categoryIds": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS aicn_db.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS aicn_db.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES aicn_db.conversations(id),
    user_id UUID NOT NULL REFERENCES aicn_db.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_table_id ON aicn_db.conversations(table_id);
CREATE INDEX idx_conversations_status ON aicn_db.conversations(status);
CREATE INDEX idx_messages_conversation_id ON aicn_db.messages(conversation_id);
CREATE INDEX idx_messages_user_id ON aicn_db.messages(user_id);

-- Insert admin user (password: adminpass)
INSERT INTO aicn_db.users (email, password_hash, name, organization, role)
VALUES ('admin@example.com', 'bcrypt+blake2b-512$54ea933c69de0d145ef87d47c8e1a836$12$e8f22c729a5dd00d866c76a6754058b0f098d5986a3f47d9' , 'Admin', 'AICN', 'ADMIN') ON CONFLICT (email) DO NOTHING;