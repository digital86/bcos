import { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Eye,
  Tag,
  Share2,
  Loader2
} from 'lucide-react';
import SocialShare from '@/components/SocialShare';
import { supabase } from '@/lib/supabase';
import { SupabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import type { BlogArticle } from '../../supabase-config';

const BlogArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        setError('Slug manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get article by slug and language
        // First try with relations, if it fails, try without
        let { data, error: fetchError } = await supabase
          .from('blog_articles')
          .select(`
            *,
            category:blog_categories(*),
            author:users(*),
            formation:formations(id, title, title_fr, title_ar, slug)
          `)
          .eq('slug', slug)
          .eq('language', language)
          .eq('is_published', true)
          .single();

        // If error with relations, try without relations
        if (fetchError) {
          console.warn('Error fetching with relations, trying without:', fetchError);
          const { data: simpleData, error: simpleError } = await supabase
            .from('blog_articles')
            .select('*')
            .eq('slug', slug)
            .eq('language', language)
            .eq('is_published', true)
            .single();

          if (simpleError) {
            throw simpleError;
          }

          data = simpleData;
        }

        if (!data) {
          setError('Article non trouvé');
          return;
        }

        setArticle(data as BlogArticle);

        // Increment views (async, don't wait)
        supabase
          .from('blog_articles')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id)
          .then(() => {});
      } catch (err: unknown) {
        console.error('Error loading article:', err);
        console.error('Slug:', slug, 'Language:', language);
        
        // More detailed error message
        let errorMessage = 'Erreur lors du chargement';
        if (err instanceof Error) {
          errorMessage = err.message;
          // Check for specific Supabase errors
          if (err.message.includes('No rows')) {
            errorMessage = language === 'ar' ? 'المقال غير موجود' : 'Article non trouvé';
          } else if (err.message.includes('PGRST')) {
            errorMessage = language === 'ar' ? 'خطأ في قاعدة البيانات' : 'Erreur de base de données';
          }
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug, language]);

  // SEO: Update document head with meta tags
  useEffect(() => {
    if (!article) return;

    const baseUrl = window.location.origin;
    const currentUrl = `${baseUrl}${location.pathname}`;
    const frUrl = `${baseUrl}/fr/blog/${article.slug}`;
    const arUrl = `${baseUrl}/ar/blog/${article.slug}`;
    
    // Update title
    document.title = `${article.title} | BCOS Formation & Conseil`;

    // Remove existing meta tags
    const existingMetaTags = document.querySelectorAll('meta[data-dynamic-seo]');
    existingMetaTags.forEach(tag => tag.remove());

    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[data-dynamic-seo]');
    existingScripts.forEach(script => script.remove());

    // Create and append meta tags
    const metaTags = [
      { name: 'description', content: article.excerpt || article.title },
      { name: 'keywords', content: article.tags?.join(', ') || '' },
      { property: 'og:title', content: article.title },
      { property: 'og:description', content: article.excerpt || article.title },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: currentUrl },
      { property: 'og:image', content: article.image_url || `${baseUrl}/og-image.jpg` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: article.title },
      { name: 'twitter:description', content: article.excerpt || article.title },
      { name: 'twitter:image', content: article.image_url || `${baseUrl}/og-image.jpg` },
      { name: 'article:published_time', content: article.published_at || article.created_at },
      { name: 'article:author', content: article.author?.full_name || (language === 'ar' ? 'فريق بيكوص' : 'BCOS Formation & Conseil') },
      { name: 'article:section', content: article.category?.name || 'Formation' },
    ];

    metaTags.forEach(tag => {
      const meta = document.createElement('meta');
      if (tag.name) meta.setAttribute('name', tag.name);
      if (tag.property) meta.setAttribute('property', tag.property);
      meta.setAttribute('content', tag.content);
      meta.setAttribute('data-dynamic-seo', 'true');
      document.head.appendChild(meta);
    });

    // Add canonical URL
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', frUrl); // French is canonical
    canonical.setAttribute('data-dynamic-seo', 'true');
    document.head.appendChild(canonical);

    // Add hreflang tags
    const hreflangTags = [
      { lang: 'fr', url: frUrl },
      { lang: 'ar', url: arUrl },
      { lang: 'x-default', url: frUrl },
    ];

    hreflangTags.forEach(({ lang, url }) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', url);
      link.setAttribute('data-dynamic-seo', 'true');
      document.head.appendChild(link);
    });

    // Add structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.excerpt || article.title,
      image: article.image_url || `${baseUrl}/og-image.jpg`,
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at || article.created_at,
      author: {
        '@type': 'Organization',
        name: article.author?.full_name || (language === 'ar' ? 'فريق بيكوص' : 'BCOS Formation & Conseil'),
      },
      publisher: {
        '@type': 'Organization',
        name: 'BCOS Formation & Conseil',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': currentUrl,
      },
      keywords: article.tags?.join(', ') || '',
      inLanguage: language === 'ar' ? 'ar' : 'fr',
      ...(article.formation && {
        about: {
          '@type': 'Course',
          name: language === 'ar' 
            ? (article.formation.title_ar || article.formation.title)
            : (article.formation.title_fr || article.formation.title),
          url: `${baseUrl}/${language}/formation/${article.formation.slug}`,
        },
      }),
    };

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-dynamic-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', language === 'ar' ? 'ar' : 'fr');
    document.documentElement.setAttribute('dir', dir);

    // Cleanup function
    return () => {
      existingMetaTags.forEach(tag => tag.remove());
      existingScripts.forEach(script => script.remove());
    };
  }, [article, language, dir, location.pathname]);

  const translations = {
    fr: {
      back: 'Retour au blog',
      published: 'Publié le',
      readTime: 'min de lecture',
      views: 'vues',
      share: 'Partager',
      relatedFormation: 'Formation liée',
      viewFormation: 'Voir la formation',
      notFound: 'Article non trouvé',
      loading: 'Chargement...',
      error: 'Erreur lors du chargement de l\'article'
    },
    ar: {
      back: 'العودة إلى المدونة',
      published: 'نشر في',
      readTime: 'دقيقة قراءة',
      views: 'مشاهدات',
      share: 'مشاركة',
      relatedFormation: 'دورة مرتبطة',
      viewFormation: 'عرض الدورة',
      notFound: 'المقال غير موجود',
      loading: 'جاري التحميل...',
      error: 'خطأ أثناء تحميل المقال'
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <main className="container mx-auto px-4 lg:px-8 py-20">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">{t.loading}</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <main className="container mx-auto px-4 lg:px-8 py-20">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t.notFound}</h1>
              <p className="text-muted-foreground mb-6">{error || t.notFound}</p>
              <Button asChild>
                <Link to={`/${language}/blog`}>{t.back}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const shareUrl = window.location.href;

  return (
    <div className="min-h-screen bg-background" dir={dir} style={language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}}>
      <main>
        {/* Back Button */}
        <div className="container mx-auto px-4 lg:px-8 pt-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/${language}/blog`)}
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t.back}
          </Button>
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
          {/* Header */}
          <header className="mb-12">
            {article.category && (
              <Badge className="mb-4" variant="secondary">
                {article.category.name}
              </Badge>
            )}
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-foreground mb-6 leading-tight">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed font-light">
                {article.excerpt}
              </p>
            )}
            
            {/* Meta Information */}
            <div className={`flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {t.published} {new Date(article.published_at || article.created_at).toLocaleDateString(
                    language === 'ar' ? 'ar-DZ' : 'fr-FR',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{article.read_time} {t.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{article.views || 0} {t.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author?.full_name || (language === 'ar' ? 'فريق بيكوص' : "L'équipe BCOS")}</span>
              </div>
            </div>

            {/* Share Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article.title,
                    text: article.excerpt || '',
                    url: shareUrl
                  });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Lien copié');
                }
              }}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Share2 className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t.share}
            </Button>
          </header>

          {/* Featured Image */}
          {article.image_url && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
            </div>
          )}

          {/* Article Content */}
          <div
            className="article-content mb-12"
            dangerouslySetInnerHTML={{ __html: article.content }}
            dir={dir}
          />
          
          {/* Custom Styles for Article Content */}
          <style>{`
            .article-content {
              font-size: 1.125rem;
              line-height: 1.75;
              color: hsl(var(--foreground));
              direction: ${dir};
              text-align: ${language === 'ar' ? 'right' : 'left'};
            }
            
            .article-content * {
              max-width: 100%;
            }
            
            /* Paragraphs */
            .article-content p {
              margin-bottom: 1.5rem;
              line-height: 1.8;
              color: hsl(var(--muted-foreground));
              font-size: 1.125rem;
            }
            
            .article-content p:first-child {
              margin-top: 0;
            }
            
            .article-content p:last-child {
              margin-bottom: 0;
            }
            
            /* Headings */
            .article-content h1 {
              font-size: 2.25rem;
              font-weight: 700;
              line-height: 1.2;
              margin-top: 2.5rem;
              margin-bottom: 1.5rem;
              color: hsl(var(--foreground));
              font-family: var(--font-heading, inherit);
            }
            
            .article-content h2 {
              font-size: 1.875rem;
              font-weight: 700;
              line-height: 1.3;
              margin-top: 2rem;
              margin-bottom: 1.25rem;
              color: hsl(var(--foreground));
              font-family: var(--font-heading, inherit);
              border-bottom: 2px solid hsl(var(--border));
              padding-bottom: 0.5rem;
            }
            
            .article-content h3 {
              font-size: 1.5rem;
              font-weight: 600;
              line-height: 1.4;
              margin-top: 1.75rem;
              margin-bottom: 1rem;
              color: hsl(var(--foreground));
              font-family: var(--font-heading, inherit);
            }
            
            .article-content h4 {
              font-size: 1.25rem;
              font-weight: 600;
              line-height: 1.4;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              color: hsl(var(--foreground));
            }
            
            /* Lists */
            .article-content ul,
            .article-content ol {
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              padding-${language === 'ar' ? 'right' : 'left'}: 2rem;
              color: hsl(var(--muted-foreground));
            }
            
            .article-content ul {
              list-style-type: disc;
            }
            
            .article-content ol {
              list-style-type: decimal;
            }
            
            .article-content li {
              margin-bottom: 0.75rem;
              line-height: 1.7;
              padding-${language === 'ar' ? 'right' : 'left'}: 0.5rem;
            }
            
            .article-content li::marker {
              color: hsl(var(--primary));
            }
            
            .article-content ul ul,
            .article-content ol ol,
            .article-content ul ol,
            .article-content ol ul {
              margin-top: 0.75rem;
              margin-bottom: 0.75rem;
            }
            
            /* Links */
            .article-content a {
              color: hsl(var(--primary));
              text-decoration: underline;
              text-decoration-color: hsl(var(--primary) / 0.3);
              text-underline-offset: 3px;
              transition: all 0.2s ease;
              font-weight: 500;
            }
            
            .article-content a:hover {
              color: hsl(var(--primary) / 0.8);
              text-decoration-color: hsl(var(--primary));
            }
            
            /* Images */
            .article-content img {
              width: 100%;
              height: auto;
              border-radius: 1rem;
              margin: 2rem 0;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              display: block;
            }
            
            /* Blockquotes */
            .article-content blockquote {
              border-${language === 'ar' ? 'right' : 'left'}: 4px solid hsl(var(--primary));
              padding: 1.5rem;
              margin: 2rem 0;
              background: hsl(var(--muted) / 0.3);
              border-radius: 0.5rem;
              font-style: italic;
              color: hsl(var(--muted-foreground));
              position: relative;
            }
            
            .article-content blockquote p {
              margin-bottom: 0;
            }
            
            .article-content blockquote p:last-child {
              margin-bottom: 0;
            }
            
            /* Code */
            .article-content code {
              background: hsl(var(--muted));
              color: hsl(var(--foreground));
              padding: 0.25rem 0.5rem;
              border-radius: 0.375rem;
              font-size: 0.875rem;
              font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
              font-weight: 500;
            }
            
            .article-content pre {
              background: hsl(var(--muted));
              color: hsl(var(--foreground));
              padding: 1.5rem;
              border-radius: 0.75rem;
              overflow-x: auto;
              margin: 2rem 0;
              border: 1px solid hsl(var(--border));
              font-size: 0.875rem;
              line-height: 1.6;
            }
            
            .article-content pre code {
              background: transparent;
              padding: 0;
              border-radius: 0;
              font-size: inherit;
            }
            
            /* Tables */
            .article-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 2rem 0;
              font-size: 0.95rem;
            }
            
            .article-content table th,
            .article-content table td {
              padding: 0.75rem 1rem;
              border: 1px solid hsl(var(--border));
              text-align: ${language === 'ar' ? 'right' : 'left'};
            }
            
            .article-content table th {
              background: hsl(var(--muted));
              font-weight: 600;
              color: hsl(var(--foreground));
            }
            
            .article-content table tr:nth-child(even) {
              background: hsl(var(--muted) / 0.3);
            }
            
            /* Horizontal Rule */
            .article-content hr {
              border: none;
              border-top: 2px solid hsl(var(--border));
              margin: 3rem 0;
            }
            
            /* Strong and Emphasis */
            .article-content strong {
              font-weight: 700;
              color: hsl(var(--foreground));
            }
            
            .article-content em {
              font-style: italic;
            }
            
            /* Call to Action (CTA) - Special styling for CTA buttons/links */
            .article-content p a[style*="background-color"],
            .article-content a[style*="background-color"] {
              display: inline-block;
              padding: 0.875rem 1.75rem;
              background-color: hsl(var(--primary)) !important;
              color: white !important;
              text-decoration: none !important;
              border-radius: 0.5rem;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              margin: 1.5rem 0;
            }
            
            .article-content p a[style*="background-color"]:hover,
            .article-content a[style*="background-color"]:hover {
              background-color: hsl(var(--primary) / 0.9) !important;
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            }
            
            /* Center-aligned paragraphs (for CTAs) */
            .article-content p[style*="text-align: center"],
            .article-content p[style*="text-align:center"] {
              text-align: center !important;
              margin: 2rem 0;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
              .article-content {
                font-size: 1rem;
              }
              
              .article-content h1 {
                font-size: 1.875rem;
              }
              
              .article-content h2 {
                font-size: 1.5rem;
              }
              
              .article-content h3 {
                font-size: 1.25rem;
              }
              
              .article-content img {
                border-radius: 0.75rem;
                margin: 1.5rem 0;
              }
              
              .article-content blockquote {
                padding: 1rem;
                margin: 1.5rem 0;
              }
              
              .article-content pre {
                padding: 1rem;
                font-size: 0.8125rem;
              }
            }
            
            /* RTL specific adjustments */
            ${language === 'ar' ? `
              .article-content {
                font-family: 'Almarai', sans-serif;
              }
              
              .article-content h1,
              .article-content h2,
              .article-content h3,
              .article-content h4 {
                font-family: 'Almarai', sans-serif;
              }
            ` : ''}
          `}</style>

          {/* Social Share */}
          <SocialShare 
            url={window.location.href}
            title={article.title}
            description={article.excerpt}
            language={language as any}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-12 pt-12 border-t border-border">
              <div className={`flex items-center gap-3 mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">{language === 'ar' ? 'الوسوم' : 'Tags'}</h3>
              </div>
              <div className={`flex flex-wrap gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                {article.tags.map((tag, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-default"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related Formation */}
          {article.formation && (
            <Card className="mb-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className={`flex items-start gap-4 mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{t.relatedFormation}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {language === 'ar'
                        ? (article.formation.title_ar || article.formation.title)
                        : (article.formation.title_fr || article.formation.title)}
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to={`/${language}/formation/${article.formation.slug}`} className={`flex items-center justify-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {t.viewFormation}
                    <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </article>
      </main>
    </div>
  );
};

export default BlogArticleDetail;
