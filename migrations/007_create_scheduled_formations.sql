-- ============================================================================
-- Migration: Scheduled Formations (Agenda System)
-- Version: 007
-- Description: Creates table for scheduling formations in monthly agenda
-- Date: December 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE SCHEDULED_FORMATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '09:00:00',
  end_time TIME DEFAULT '17:00:00',
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(formation_id, scheduled_date, scheduled_time)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_formations_formation_id ON scheduled_formations(formation_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_formations_date ON scheduled_formations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_formations_active ON scheduled_formations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_formations_date_range ON scheduled_formations(scheduled_date, is_active);

-- Add comment
COMMENT ON TABLE scheduled_formations IS 'Stores scheduled formations for monthly agenda display';
COMMENT ON COLUMN scheduled_formations.scheduled_date IS 'Date when the formation is scheduled';
COMMENT ON COLUMN scheduled_formations.scheduled_time IS 'Start time of the formation';
COMMENT ON COLUMN scheduled_formations.end_time IS 'End time of the formation';

-- ============================================================================
-- 2. ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE scheduled_formations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Admins can manage scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Admins can select scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Admins can insert scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Admins can update scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Admins can delete scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Allow public insert scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Allow public update scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Allow public delete scheduled formations" ON scheduled_formations;
DROP POLICY IF EXISTS "Authenticated users can manage scheduled formations" ON scheduled_formations;

-- Policy: Allow public read access to active scheduled formations
CREATE POLICY "Public can view active scheduled formations"
  ON scheduled_formations
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow all operations for now (can be restricted later with proper auth)
-- Since the app uses anon key and doesn't have proper Supabase Auth,
-- we'll allow public access for development. In production, restrict this.

-- Allow public to insert (for admin panel using anon key)
-- Remove TO clause to allow all roles
CREATE POLICY "Allow public insert scheduled formations"
  ON scheduled_formations
  FOR INSERT
  WITH CHECK (true);

-- Allow public to update
CREATE POLICY "Allow public update scheduled formations"
  ON scheduled_formations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public to delete
CREATE POLICY "Allow public delete scheduled formations"
  ON scheduled_formations
  FOR DELETE
  USING (true);

-- Alternative: If you want to check admin role from users table
-- Uncomment below and comment the above policy if you have proper auth setup
/*
CREATE POLICY "Admins can select scheduled formations"
  ON scheduled_formations
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    ))
    OR is_active = true  -- Public can also view active ones
  );

CREATE POLICY "Admins can insert scheduled formations"
  ON scheduled_formations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update scheduled formations"
  ON scheduled_formations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete scheduled formations"
  ON scheduled_formations
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  );
*/

-- ============================================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_scheduled_formations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scheduled_formations_updated_at ON scheduled_formations;

CREATE TRIGGER trigger_update_scheduled_formations_updated_at
  BEFORE UPDATE ON scheduled_formations
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_formations_updated_at();

