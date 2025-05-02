-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add an index on the name for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(name);

-- Insert some default feature flags
INSERT INTO public.feature_flags (name, description, enabled)
VALUES 
  ('conversations', 'Show conversations feature', false);
