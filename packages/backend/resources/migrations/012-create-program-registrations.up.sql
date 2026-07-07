-- Program registrations: participant emails submitted from the "Programmes
-- d'adoption" dashboard. Stored here (not written back to Airtable) and reviewed
-- by admins in the Admin console.
CREATE TABLE IF NOT EXISTS public.program_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_airtable_id TEXT NOT NULL,   -- pgm_adopt Airtable record id
    program_name TEXT,                   -- denormalized program name snapshot at submit time
    emails JSONB NOT NULL,               -- JSON array of participant emails
    submitted_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_program_registrations_program ON public.program_registrations(program_airtable_id);
CREATE INDEX idx_program_registrations_created_at ON public.program_registrations(created_at DESC);
CREATE INDEX idx_program_registrations_submitter ON public.program_registrations(submitted_by);
