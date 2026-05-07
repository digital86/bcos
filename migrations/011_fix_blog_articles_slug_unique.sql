-- Fix slug unique constraint to allow same slug for different languages
-- This allows unified slugs across FR/AR versions of the same article

-- Drop the existing unique constraint on slug if it exists
DO $$ 
BEGIN
  -- Check if the unique constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'blog_articles_slug_key'
  ) THEN
    ALTER TABLE blog_articles DROP CONSTRAINT blog_articles_slug_key;
  END IF;
END $$;

-- Create a new unique constraint on (slug, language) combination
-- This allows the same slug for different languages but prevents duplicates within the same language
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'blog_articles_slug_language_key'
  ) THEN
    ALTER TABLE blog_articles 
    ADD CONSTRAINT blog_articles_slug_language_key 
    UNIQUE (slug, language);
  END IF;
END $$;

-- Ensure language column has a default and is NOT NULL
ALTER TABLE blog_articles 
ALTER COLUMN language SET DEFAULT 'fr',
ALTER COLUMN language SET NOT NULL;

-- Update any existing NULL language values to 'fr'
UPDATE blog_articles 
SET language = 'fr' 
WHERE language IS NULL;

