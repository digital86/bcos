-- Add language handling for blog articles
-- Supports bilingual FR/AR content with per-language slugs

ALTER TABLE blog_articles
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'ar'));

-- Index for language-filtered queries
CREATE INDEX IF NOT EXISTS idx_blog_articles_language ON blog_articles(language);

-- Optional: allow same slug across languages
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug_language ON blog_articles(slug, language);

