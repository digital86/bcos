import { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight,
  Calendar,
  Clock,
  User,
  Search,
  TrendingUp,
  BookOpen,
  Users,
  Lightbulb,
  Target,
  Briefcase,
  Heart,
  Monitor,
  Eye,
  MessageCircle,
  Share2,
  Award,
  Shield,
  MessageSquare
} from 'lucide-react';
import { useBlogArticles, useBlogCategories } from '@/hooks/useSupabase';
import { EditableText, EditableImage } from '@/components/admin/EditableContent';
import SEO from '@/components/SEO';

const Blog = () => {
  const location = useLocation();
  
  // Instant language detection
  const [language, setLanguage] = useState<'fr' | 'ar'>(() => {
    if (typeof window === 'undefined') return 'fr';
    const path = window.location.pathname;
    return (path.includes('/ar/') || path === '/ar' || path.endsWith('/ar')) ? 'ar' : 'fr';
  });
  
  useEffect(() => {
    // Language synchronization
  }, [location.pathname]);

  const seoData = language === 'ar' ? {
    title: 'مدونة بيكوص | نصائح وموارد تدريبية',
    description: 'اكتشف نصائح خبرائنا، التوجهات وأفضل الممارسات لتطوير مهاراتكم في الجزائر.',
    canonical: 'https://bcos-dz.com/ar/blog'
  } : {
    title: 'Blog BCOS | Conseils & Ressources de Formation',
    description: 'Découvrez nos conseils d\'experts, tendances et bonnes pratiques pour développer vos compétences en Algérie.',
    canonical: 'https://bcos-dz.com/fr/blog'
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Fetch data from Supabase
  const { articles: allArticles, loading: articlesLoading } = useBlogArticles(language);
  const { categories: blogCategories, loading: categoriesLoading } = useBlogCategories();

  const categoryIcons: { [key: string]: any } = {
    'management': Target,
    'commercial': TrendingUp,
    'digital': Monitor,
    'rh': Heart,
    'conseils': Lightbulb,
    'qualite': Award,
    'securite': Shield,
    'communication': MessageSquare,
    'innovation': Lightbulb,
    'gestion-projet': Briefcase,
    'developpement-personnel': User,
    'all': BookOpen
  };

  const translations = {
    fr: {
      badge: 'Blog & Ressources',
      heroTitle: 'Blog BCOS',
      heroSubtitle: 'Découvrez nos conseils d\'experts, tendances et bonnes pratiques pour développer vos compétences',
      searchPlaceholder: 'Rechercher un article...',
      featuredBadge: 'Articles à la une',
      featuredTitle: 'Nos derniers articles',
      featuredSubtitle: 'Restez informé des dernières tendances et bonnes pratiques',
      featuredLabel: 'À la une',
      allArticles: 'Tous les articles',
      readMore: 'Lire la suite',
      readTime: 'min',
      views: 'vues',
      comments: 'commentaires',
      noArticles: 'Aucun article trouvé',
      recentTitle: 'Articles récents',
      categoriesTitle: 'Catégories',
      catSub: 'Trouvez les articles qui vous intéressent selon vos domaines d\'expertise'
    },
    ar: {
      badge: 'المدونة والموارد',
      heroTitle: 'مدونة بيكوص',
      heroSubtitle: 'اكتشف نصائح خبرائنا والاتجاهات وأفضل الممارسات لتطوير مهاراتك',
      searchPlaceholder: 'ابحث عن مقال...',
      featuredBadge: 'المقالات المميزة',
      featuredTitle: 'أحدث مقالاتنا',
      featuredSubtitle: 'ابق على اطلاع بآخر الاتجاهات وأفضل الممارسات',
      featuredLabel: 'مميز',
      allArticles: 'جميع المقالات',
      readMore: 'اقرأ المزيد',
      readTime: 'دقيقة',
      views: 'مشاهدات',
      comments: 'تعليقات',
      noArticles: 'لم يتم العثور على مقالات',
      recentTitle: 'المقالات الأخيرة',
      categoriesTitle: 'الفئات',
      catSub: 'ابحث عن المقالات التي تهمك حسب مجالات خبرتك'
    }
  };

  const t = translations[language];

  const categories = useMemo(() => {
    const transformedCategories = blogCategories.map(cat => ({
      id: cat.slug,
      name: language === 'ar' ? (cat.name_ar || cat.name) : (cat.name_fr || cat.name),
      icon: categoryIcons[cat.slug] || BookOpen,
      count: allArticles.filter(article => article.category?.slug === cat.slug).length
    }));

    return [
      { id: 'all', name: t.allArticles, icon: BookOpen, count: allArticles.length },
      ...transformedCategories
    ];
  }, [blogCategories, allArticles, language, t.allArticles]);

  const articles = allArticles.map(article => ({
    id: parseInt(article.id),
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category?.slug || 'general',
    author: article.author?.full_name || (language === 'ar' ? 'فريق بيكوص' : "L'équipe BCOS"),
    authorImage: article.author?.avatar_url || 'https://i.postimg.cc/TPBc4x45/Artboard-1.webp',
    publishDate: new Date(article.published_at || article.created_at).toISOString().split('T')[0],
    readTime: `${article.read_time} min`,
    image: article.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: article.views,
    comments: article.comments_count,
    featured: article.is_featured,
    tags: article.tags || [],
    createdAt: new Date(article.published_at || article.created_at).getTime()
  })).sort((a, b) => b.createdAt - a.createdAt);

  const filteredArticles = articles.filter(article => {
    const q = searchTerm.trim().toLowerCase();
    const title = (article.title || '').toLowerCase();
    const matchesSearch = q === '' || title.includes(q);
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categorySlug: string) => {
    return categories.find(cat => cat.id === categorySlug)?.name || categorySlug;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'digital': return 'bg-purple-100 text-purple-800';
      case 'rh': return 'bg-pink-100 text-pink-800';
      case 'conseils': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SEO 
        {...seoData} 
        lang={language} 
        schemaData={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": articles.slice(0, 10).map((a, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://bcos-dz.com/${language}/blog/${a.slug}`
          }))
        }}
      />
      <main className="pb-12">

        {/* ── Hero ── */}
        <section className="py-14 sm:py-20 lg:py-28 relative min-h-[50vh] sm:min-h-[60vh] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          >
            <EditableImage 
              pageKey="blog"
              contentKey="blog_hero_bg"
              defaultUrl="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.80)' }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-3 sm:mb-4">
                <Badge className="bg-accent text-accent-foreground px-3 py-1 text-xs sm:text-sm">
                  <EditableText pageKey="blog" contentKey={`blog_${language}_badge`} defaultContent={t.badge} />
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white mb-3 sm:mb-4 leading-tight">
                <EditableText pageKey="blog" contentKey={`blog_${language}_hero_title`} defaultContent={t.heroTitle} />
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8">
                <EditableText pageKey="blog" contentKey={`blog_${language}_hero_sub`} defaultContent={t.heroSubtitle} multiline />
              </p>
              {/* Search */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${language === 'ar' ? 'pr-10' : 'pl-10'} py-2.5 bg-white border-none shadow-xl rounded-xl text-sm`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="py-10 sm:py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-3">
                <EditableText pageKey="blog" contentKey={`blog_${language}_cat_title`} defaultContent={t.categoriesTitle} />
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                <EditableText pageKey="blog" contentKey={`blog_${language}_cat_desc`} defaultContent={t.catSub} />
              </p>
            </div>

            {/* Category filter buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-16">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1.5 rounded-xl text-xs sm:text-sm ${
                    selectedCategory === category.id
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                      : 'hover:border-primary/30'
                  }`}
                >
                  <category.icon className="w-3.5 h-3.5" />
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] bg-slate-100">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Articles Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border hover:border-primary/20 group overflow-hidden flex flex-col"
                >
                  <Link to={`/${language}/blog/${article.slug || article.id}`} className="block overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <CardHeader className="flex-1 p-4 sm:p-6 pb-2">
                    <Badge
                      className={`${getCategoryColor(article.category)} rounded-lg mb-3 text-xs w-fit`}
                      variant="secondary"
                    >
                      {getCategoryName(article.category)}
                    </Badge>
                    <Link to={`/${language}/blog/${article.slug || article.id}`} className="block">
                      <CardTitle className="text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 hover:text-primary transition-colors font-semibold leading-snug">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-muted-foreground">
                        {article.excerpt}
                      </CardDescription>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 mt-auto border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={article.authorImage}
                          className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                          alt={article.author}
                        />
                        <span className="text-xs font-semibold text-slate-700">{article.author}</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="text-xs font-semibold text-primary hover:text-primary/80 px-2">
                        <Link to={`/${language}/blog/${article.slug || article.id}`}>
                          {t.readMore}
                          <ArrowRight className={`${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'} w-3.5 h-3.5`} />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-base text-slate-400 font-medium">{t.noArticles}</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Blog;
