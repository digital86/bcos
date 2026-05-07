-- Migration: Bilingual Formations System (Adapted for existing database)
-- Description: Adds bilingual support (French/Arabic) for formations and categories
-- Date: 2025-12-03

-- ============================================================================
-- 1. ADD BILINGUAL FIELDS TO FORMATIONS TABLE
-- ============================================================================

-- Add French fields
ALTER TABLE formations 
ADD COLUMN IF NOT EXISTS title_fr TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT,
ADD COLUMN IF NOT EXISTS content_fr TEXT,
ADD COLUMN IF NOT EXISTS objectives_fr TEXT[],
ADD COLUMN IF NOT EXISTS prerequisites_fr TEXT,
ADD COLUMN IF NOT EXISTS program_fr TEXT,
ADD COLUMN IF NOT EXISTS target_audience_fr TEXT;

-- Add Arabic fields
ALTER TABLE formations 
ADD COLUMN IF NOT EXISTS title_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS content_ar TEXT,
ADD COLUMN IF NOT EXISTS objectives_ar TEXT[],
ADD COLUMN IF NOT EXISTS prerequisites_ar TEXT,
ADD COLUMN IF NOT EXISTS program_ar TEXT,
ADD COLUMN IF NOT EXISTS target_audience_ar TEXT;

-- Add enhanced pricing fields
ALTER TABLE formations
ADD COLUMN IF NOT EXISTS price_ht DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_ttc DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_formations_slug ON formations(slug);
CREATE INDEX IF NOT EXISTS idx_formations_is_published ON formations(is_published);
CREATE INDEX IF NOT EXISTS idx_formations_category_id ON formations(category_id);
CREATE INDEX IF NOT EXISTS idx_formations_reference ON formations(reference);

-- ============================================================================
-- 2. ADD BILINGUAL FIELDS TO CATEGORIES TABLE
-- ============================================================================

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_fr TEXT,
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- 3. ADD MISSING FIELDS TO ENROLLMENTS TABLE (already exists)
-- ============================================================================

-- Add missing columns to existing enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS course_id UUID, -- For backward compatibility
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add check constraint for language_preference if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enrollments_language_preference_check'
    ) THEN
        ALTER TABLE enrollments 
        ADD CONSTRAINT enrollments_language_preference_check 
        CHECK (language_preference IN ('fr', 'ar'));
    END IF;
END $$;

-- Update existing enrollments to have default values
UPDATE enrollments 
SET language_preference = COALESCE(language_preference, 'fr'),
    source = COALESCE(source, COALESCE(lead_source, 'website'))
WHERE language_preference IS NULL OR source IS NULL;

-- Add indexes for enrollments if they don't exist
CREATE INDEX IF NOT EXISTS idx_enrollments_formation_id ON enrollments(formation_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_email ON enrollments(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrollment_date ON enrollments(enrollment_date);

-- ============================================================================
-- 4. CREATE LANDING PAGES TABLE (for AI-generated content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
  title TEXT NOT NULL,
  meta_description TEXT,
  hero_content TEXT,
  features JSONB,
  testimonials JSONB,
  cta_text TEXT,
  seo_keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for landing pages
CREATE INDEX IF NOT EXISTS idx_landing_pages_formation_id ON landing_pages(formation_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_language ON landing_pages(language);
CREATE INDEX IF NOT EXISTS idx_landing_pages_is_active ON landing_pages(is_active);

-- ============================================================================
-- 5. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_formations_updated_at ON formations;
CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE ON formations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. DATA MIGRATION: Copy existing data to bilingual fields
-- ============================================================================

-- Migrate formations data
UPDATE formations 
SET 
  title_fr = COALESCE(title_fr, title),
  description_fr = COALESCE(description_fr, description),
  content_fr = COALESCE(content_fr, content),
  objectives_fr = COALESCE(objectives_fr, objectives),
  prerequisites_fr = COALESCE(prerequisites_fr, prerequisites),
  price_ht = COALESCE(price_ht, price),
  price_ttc = COALESCE(price_ttc, price * 1.19), -- Assuming 19% VAT
  is_published = COALESCE(is_published, is_active, true),
  cover_image_url = COALESCE(cover_image_url, image_url)
WHERE title_fr IS NULL OR title_fr = '';

-- Migrate categories data
UPDATE categories
SET 
  name_fr = COALESCE(name_fr, name),
  description_fr = COALESCE(description_fr, description)
WHERE name_fr IS NULL OR name_fr = '';

-- ============================================================================
-- 7. SET DEFAULT VALUES FOR NEW FIELDS
-- ============================================================================

-- Ensure default values for new fields
UPDATE formations
SET 
  is_published = COALESCE(is_published, true),
  price_ht = COALESCE(price_ht, price),
  price_ttc = COALESCE(price_ttc, CASE WHEN price IS NOT NULL THEN price * 1.19 ELSE NULL END)
WHERE is_published IS NULL OR price_ht IS NULL;

UPDATE categories
SET display_order = COALESCE(display_order, 0)
WHERE display_order IS NULL;

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE landing_pages IS 'AI-generated landing pages for formations';
COMMENT ON COLUMN formations.title_fr IS 'French title of the formation';
COMMENT ON COLUMN formations.title_ar IS 'Arabic title of the formation';
COMMENT ON COLUMN formations.price_ht IS 'Price excluding tax (HT)';
COMMENT ON COLUMN formations.price_ttc IS 'Price including tax (TTC)';
COMMENT ON COLUMN enrollments.language_preference IS 'Preferred language of the enrollee (fr or ar)';
COMMENT ON COLUMN enrollments.source IS 'Where the enrollment came from (website, email, phone, etc.)';

-- Migration completed successfully!






