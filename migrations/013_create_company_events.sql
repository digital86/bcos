-- ============================================================================
-- Migration: Company Events (Actualités)
-- Version: 013
-- Description: Creates table for company events/news with permissive RLS
-- ============================================================================

-- 1) Table
CREATE TABLE IF NOT EXISTS company_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Titles
  title TEXT,
  title_fr TEXT,
  title_ar TEXT,
  -- Descriptions
  description TEXT,
  description_fr TEXT,
  description_ar TEXT,
  -- Slug (optional)
  slug TEXT,
  -- Event meta
  event_date DATE,
  event_time TEXT,
  location TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Publish flags
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  -- Auditing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_events_event_date ON company_events(event_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_company_events_is_published ON company_events(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_company_events_created_at ON company_events(created_at DESC);

-- 2) RLS
ALTER TABLE company_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "Public can view published company events" ON company_events;
DROP POLICY IF EXISTS "Allow public insert company events" ON company_events;
DROP POLICY IF EXISTS "Allow public update company events" ON company_events;
DROP POLICY IF EXISTS "Allow public delete company events" ON company_events;

-- Public can read only published events
CREATE POLICY "Public can view published company events"
  ON company_events
  FOR SELECT
  USING (is_published = TRUE);

-- Development-friendly policies (since the admin panel uses anon key)
-- NOTE: Restrict these in production when proper auth is in place.
CREATE POLICY "Allow public insert company events"
  ON company_events
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Allow public update company events"
  ON company_events
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow public delete company events"
  ON company_events
  FOR DELETE
  USING (TRUE);

-- 3) Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_company_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_events_updated_at ON company_events;
CREATE TRIGGER trigger_update_company_events_updated_at
  BEFORE UPDATE ON company_events
  FOR EACH ROW
  EXECUTE FUNCTION update_company_events_updated_at();

-- 4) Comments
COMMENT ON TABLE company_events IS 'Stores company news and events for Actualité page';
COMMENT ON COLUMN company_events.is_published IS 'When true, visible publicly via RLS';

