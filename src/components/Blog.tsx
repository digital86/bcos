import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ScrollFloat from './ScrollFloat';
import { useBlogArticles } from '@/hooks/useSupabase';
import { useState, useEffect } from 'react';

const Blog = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  
  // Fetch real blog articles from Supabase
  const { articles: allArticles, loading } = useBlogArticles(language);
  
  // Get the latest 3 articles
  const articles = allArticles
    .slice(0, 3)
    .map(article => ({
      id: parseInt(article.id),
      title: article.title,
      excerpt: article.excerpt,
      category: article.category?.name || 'Général',
      date: new Date(article.published_at || article.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR'),
      readTime: `${article.read_time || 5} min`,
      image: article.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      slug: article.slug || article.id,
    }));
  
  // Fallback articles if no data is available
  const fallbackArticles = [
    {
      id: 1,
      title: '5 erreurs à éviter avant d\'acheter des machines & solutions industrielles',
      excerpt: 'Découvrez les pièges les plus courants et comment les éviter pour faire les meilleurs choix d\'investissement.',
      category: 'Gestion',
      date: '15 Jan 2025',
      readTime: '5 min',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      slug: '1',
    },
    {
      id: 2,
      title: 'Votre entreprise attire-t-elle les talents ou les fait-elle fuir ?',
      excerpt: 'Les clés pour construire une marque employeur attractive et fidéliser vos meilleurs collaborateurs.',
      category: 'RH',
      date: '12 Jan 2025',
      readTime: '7 min',
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      slug: '2',
    },
    {
      id: 3,
      title: 'Entre la planification et l\'exécution : pourquoi tant de stratégies restent lettre morte ?',
      excerpt: 'Analyse des facteurs qui empêchent la mise en œuvre efficace des stratégies d\'entreprise.',
      category: 'Stratégie',
      date: '10 Jan 2025',
      readTime: '6 min',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      slug: '3',
    },
  ];
  
  const displayArticles = articles.length > 0 ? articles : fallbackArticles;

  return (
    <section id="blog" className="py-4 lg:py-6 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-6 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <ScrollFloat
            containerClassName="text-3xl lg:text-4xl xl:text-5xl font-heading text-foreground mb-6"
          >
            {language === 'ar' ? 'آخر المقالات' : 'Derniers Articles'}
          </ScrollFloat>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center" style={{ textAlign: 'center' }}>
            {language === 'ar' 
              ? 'نصائح وتحليلات ورؤى لتطوير مؤسستك'
              : 'Conseils, analyses et insights pour développer votre entreprise'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {displayArticles.map((article, index) => (
            <article
              key={article.id}
              className="glass-card rounded-3xl hover:shadow-glass transition-smooth hover:scale-105 will-change-transform group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-48 relative overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-heading font-bold text-white text-center line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {article.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>

                <Button
                  variant="ghost"
                  className="w-full rounded-xl group-hover:bg-primary/10 transition-smooth"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  asChild
                >
                  <a href={`/${language}/blog/${article.slug}`}>
                    {language === 'ar' ? 'قراءة المقال' : 'Lire l\'article'}
                    <ArrowRight className={`w-4 h-4 transition-smooth ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1`} />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ textAlign: 'center' }}>
          <Button size="lg" variant="outline" className="rounded-2xl" asChild>
            <a href={`/${language}/blog`}>
              {language === 'ar' ? 'عرض جميع المقالات' : 'Voir tous les articles'}
              <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Blog;
