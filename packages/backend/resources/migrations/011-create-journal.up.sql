-- Journal feature: posts authored by admins, readable by all authenticated users.
CREATE TABLE IF NOT EXISTS public.journal_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_date DATE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,            -- sanitized rich-text HTML
    tag TEXT NOT NULL,               -- dynamic vocabulary from Airtable impact_post (no CHECK/enum)
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_posts_post_date ON public.journal_posts(post_date DESC);
CREATE INDEX idx_journal_posts_tag ON public.journal_posts(tag);

-- Journal attachments live in their own table so they never surface in the
-- Documents page (GET /files reads uploaded_files only).
CREATE TABLE IF NOT EXISTS public.journal_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.journal_posts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_attachments_post_id ON public.journal_attachments(post_id);

-- Reuse the generic updated_at trigger function created in migration 006.
CREATE TRIGGER update_journal_posts_updated_at BEFORE UPDATE
    ON public.journal_posts FOR EACH ROW EXECUTE FUNCTION update_uploaded_files_updated_at();
