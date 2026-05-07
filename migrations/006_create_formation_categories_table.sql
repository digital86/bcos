-- Migration: Create many-to-many relationship between formations and categories
-- This allows a formation to have multiple categories

-- Create junction table for formation-category relationships
CREATE TABLE IF NOT EXISTS formation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(formation_id, category_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_formation_categories_formation_id ON formation_categories(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_categories_category_id ON formation_categories(category_id);

-- Enable RLS (Row Level Security)
ALTER TABLE formation_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read all formation-category relationships
CREATE POLICY "Allow authenticated read formation_categories"
  ON formation_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert formation-category relationships
CREATE POLICY "Allow authenticated insert formation_categories"
  ON formation_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete formation-category relationships
CREATE POLICY "Allow authenticated delete formation_categories"
  ON formation_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow public read for formation-category relationships
CREATE POLICY "Allow public read formation_categories"
  ON formation_categories
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON TABLE formation_categories IS 'Junction table for many-to-many relationship between formations and categories';
COMMENT ON COLUMN formation_categories.formation_id IS 'Reference to the formation';
COMMENT ON COLUMN formation_categories.category_id IS 'Reference to the category';


