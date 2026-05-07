-- Migration: Bilingual Formations System
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
-- 3. CREATE ENROLLMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
  course_id UUID, -- For backward compatibility
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  position TEXT,
  experience_level TEXT,
  motivation TEXT,
  preferred_date DATE,
  how_did_you_hear TEXT,
  special_requirements TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'to_confirm', 'confirmed', 'cancelled')),
  source TEXT DEFAULT 'website',
  language_preference TEXT DEFAULT 'fr' CHECK (language_preference IN ('fr', 'ar')),
  notes TEXT,
  commercial_notes TEXT,
  contact_date TIMESTAMP WITH TIME ZONE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for enrollments
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
  title_fr = title,
  description_fr = description,
  content_fr = content,
  objectives_fr = objectives,
  prerequisites_fr = prerequisites,
  price_ht = price,
  price_ttc = price * 1.19, -- Assuming 19% VAT (adjust if needed)
  is_published = COALESCE(is_active, true),
  cover_image_url = image_url
WHERE title_fr IS NULL OR title_fr = '';

-- Migrate categories data
UPDATE categories
SET 
  name_fr = name,
  description_fr = description
WHERE name_fr IS NULL OR name_fr = '';

-- ============================================================================
-- 7. SET DEFAULT VALUES FOR NEW FIELDS
-- ============================================================================

-- Ensure default values for new fields
UPDATE formations
SET 
  is_published = COALESCE(is_published, true),
  price_ht = COALESCE(price_ht, price),
  price_ttc = COALESCE(price_ttc, price * 1.19)
WHERE is_published IS NULL OR price_ht IS NULL;

UPDATE categories
SET display_order = COALESCE(display_order, 0)
WHERE display_order IS NULL;

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE enrollments IS 'Stores course enrollment/registration data with CRM fields';
COMMENT ON TABLE landing_pages IS 'AI-generated landing pages for formations';
COMMENT ON COLUMN formations.title_fr IS 'French title of the formation';
COMMENT ON COLUMN formations.title_ar IS 'Arabic title of the formation';
COMMENT ON COLUMN formations.price_ht IS 'Price excluding tax (HT)';
COMMENT ON COLUMN formations.price_ttc IS 'Price including tax (TTC)';
COMMENT ON COLUMN enrollments.language_preference IS 'Preferred language of the enrollee (fr or ar)';
COMMENT ON COLUMN enrollments.source IS 'Where the enrollment came from (website, email, phone, etc.)';

-- Migration completed successfully!






