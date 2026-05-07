-- Create event_requests table for event organization requests
CREATE TABLE IF NOT EXISTS event_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  source TEXT DEFAULT 'website',
  language_preference TEXT DEFAULT 'fr' CHECK (language_preference IN ('fr', 'ar')),
  request_type TEXT DEFAULT 'event_organization',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_created_at ON event_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_requests_email ON event_requests(email);

-- Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view event requests" ON event_requests;
DROP POLICY IF EXISTS "Public can insert event requests" ON event_requests;
DROP POLICY IF EXISTS "Public can update event requests" ON event_requests;
DROP POLICY IF EXISTS "Public can delete event requests" ON event_requests;

-- Policy: Allow public read access (for admin panel)
CREATE POLICY "Public can view event requests"
  ON event_requests
  FOR SELECT
  USING (true);

-- Policy: Allow public to insert (for form submissions)
CREATE POLICY "Public can insert event requests"
  ON event_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow public to update (for admin panel)
CREATE POLICY "Public can update event requests"
  ON event_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public to delete (for admin panel)
CREATE POLICY "Public can delete event requests"
  ON event_requests
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_event_requests_updated_at ON event_requests;

CREATE TRIGGER update_event_requests_updated_at
  BEFORE UPDATE ON event_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

