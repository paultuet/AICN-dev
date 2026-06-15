-- Do NOT drop update_uploaded_files_updated_at() — it is owned by migration 006.
DROP TRIGGER IF EXISTS update_journal_posts_updated_at ON public.journal_posts;
DROP TABLE IF EXISTS public.journal_attachments;
DROP TABLE IF EXISTS public.journal_posts;
