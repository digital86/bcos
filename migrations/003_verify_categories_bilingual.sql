-- ============================================================================
-- Migration: Verify Categories Bilingual Support
-- Description: Verifies and ensures categories table has all bilingual fields
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- 1. VERIFY EXISTING COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_columns TEXT[];
  v_missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for required bilingual columns
  SELECT ARRAY_AGG(column_name::TEXT) INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'categories';
  
  -- Check each required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'name_fr'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'name_fr');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'name_ar'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'name_ar');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'description_fr'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'description_fr');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'description_ar'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'description_ar');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'display_order'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'display_order');
  END IF;
  
  -- Report results
  IF array_length(v_missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ All bilingual columns exist in categories table';
  ELSE
    RAISE NOTICE '⚠ Missing columns: %', array_to_string(v_missing_columns, ', ');
    RAISE NOTICE '→ These columns will be added automatically';
  END IF;
END $$;

-- ============================================================================
-- 2. ADD MISSING COLUMNS (IF ANY)
-- ============================================================================

-- Add French fields
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_fr TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

-- Add Arabic fields
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Add display order
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- ============================================================================
-- 3. MIGRATE EXISTING DATA (IF NEEDED)
-- ============================================================================

-- Copy existing name to name_fr if name_fr is empty
UPDATE categories
SET 
  name_fr = COALESCE(name_fr, name),
  description_fr = COALESCE(description_fr, description)
WHERE name_fr IS NULL OR name_fr = '';

-- Set default display_order for categories without order
UPDATE categories
SET display_order = COALESCE(display_order, 0)
WHERE display_order IS NULL;

-- ============================================================================
-- 4. CREATE INDEXES (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- 5. VERIFY FINAL STATE
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_with_ar INTEGER;
  v_without_ar INTEGER;
BEGIN
  -- Count total categories
  SELECT COUNT(*) INTO v_count FROM categories;
  
  -- Count categories with Arabic translation
  SELECT COUNT(*) INTO v_with_ar 
  FROM categories 
  WHERE name_ar IS NOT NULL AND name_ar != '';
  
  -- Count categories without Arabic translation
  v_without_ar := v_count - v_with_ar;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Categories Summary:';
  RAISE NOTICE '  Total categories: %', v_count;
  RAISE NOTICE '  With Arabic translation: %', v_with_ar;
  RAISE NOTICE '  Without Arabic translation: %', v_without_ar;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 6. DISPLAY CURRENT CATEGORIES STATUS
-- ============================================================================

-- Show all categories with their translation status
SELECT 
  id,
  name_fr AS "Nom FR",
  name_ar AS "Nom AR",
  slug AS "Slug",
  CASE 
    WHEN name_ar IS NULL OR name_ar = '' THEN '❌ بدون ترجمة'
    ELSE '✅ مع ترجمة'
  END AS "حالة الترجمة",
  display_order AS "ترتيب العرض"
FROM categories
ORDER BY display_order ASC, name_fr ASC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

RAISE NOTICE '✓ Categories bilingual support verified and ready!';


