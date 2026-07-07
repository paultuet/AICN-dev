-- Registrations now collect organization names (not participant emails).
-- The submitter's email is still captured via submitted_by (users FK).
ALTER TABLE public.program_registrations RENAME COLUMN emails TO organizations;
