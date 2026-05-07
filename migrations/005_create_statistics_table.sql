-- Migration: Create statistics table for site statistics management
-- This table stores statistics that can be displayed on the formations page
-- and managed from the admin settings page

-- Create statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  label_fr TEXT NOT NULL,
  label_ar TEXT,
  icon_name TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_statistics_display_order ON statistics(display_order);
CREATE INDEX IF NOT EXISTS idx_statistics_is_visible ON statistics(is_visible);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_statistics_updated_at
  BEFORE UPDATE ON statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_statistics_updated_at();

-- Insert default statistics
INSERT INTO statistics (key, value, label_fr, label_ar, icon_name, is_visible, display_order) VALUES
  ('formations_count', '22', 'Formations disponibles', 'الدورات المتاحة', 'BookOpen', true, 1),
  ('participants_count', '500', 'Participants formés', 'المشاركون المدربون', 'Users', true, 2),
  ('rating', '4.8/5', 'Note moyenne', 'التقييم المتوسط', 'Star', true, 3),
  ('domains_count', '14', 'Domaines d''expertise', 'مجالات الخبرة', 'Briefcase', true, 4)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read all statistics
CREATE POLICY "Allow authenticated read statistics"
  ON statistics
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert statistics
CREATE POLICY "Allow authenticated insert statistics"
  ON statistics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update statistics
CREATE POLICY "Allow authenticated update statistics"
  ON statistics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete statistics
CREATE POLICY "Allow authenticated delete statistics"
  ON statistics
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow public read for visible statistics only
CREATE POLICY "Allow public read visible statistics"
  ON statistics
  FOR SELECT
  TO anon
  USING (is_visible = true);

COMMENT ON TABLE statistics IS 'Stores site statistics that can be displayed on public pages and managed from admin panel';
COMMENT ON COLUMN statistics.key IS 'Unique identifier for the statistic (e.g., formations_count)';
COMMENT ON COLUMN statistics.value IS 'The statistic value to display';
COMMENT ON COLUMN statistics.label_fr IS 'French label for the statistic';
COMMENT ON COLUMN statistics.label_ar IS 'Arabic label for the statistic';
COMMENT ON COLUMN statistics.icon_name IS 'Name of the icon to display (from lucide-react)';
COMMENT ON COLUMN statistics.is_visible IS 'Whether the statistic should be displayed on public pages';
COMMENT ON COLUMN statistics.display_order IS 'Order in which statistics should be displayed';


