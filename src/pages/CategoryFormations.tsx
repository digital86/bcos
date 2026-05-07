import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { SupabaseService } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Star,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Users,
  TrendingUp,
  Target,
  PieChart,
  Truck,
  Heart,
  Monitor,
  Zap,
  Award,
  Shield,
  MessageSquare,
  Lightbulb,
  Briefcase,
  User,
} from 'lucide-react';
import EnrollmentForm from '@/components/EnrollmentForm';

/* ─── Category icon map ─── */
const CATEGORY_ICONS: Record<string, any> = {
  commercial: TrendingUp,
  management: Target,
  finance: PieChart,
  logistique: Truck,
  rh: Heart,
  digital: Monitor,
  'soft-skills': Zap,
  qualite: Award,
  securite: Shield,
  communication: MessageSquare,
  innovation: Lightbulb,
  'gestion-projet': Briefcase,
  'developpement-personnel': User,
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant': return 'bg-green-100 text-green-800';
    case 'Intermédiaire': return 'bg-blue-100 text-blue-800';
    case 'Avancé': return 'bg-purple-100 text-purple-800';
    case 'Tous niveaux': return 'hidden';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getLevelLabel = (level: string, isArabic: boolean) => {
  if (level === 'Tous niveaux') return '';
  if (!isArabic) return level;
  switch (level) {
    case 'Débutant': return 'مبتدئ';
    case 'Intermédiaire': return 'متوسط';
    case 'Avancé': return 'متقدم';
    case 'Tous niveaux': return 'جميع المستويات';
    default: return level;
  }
};

/* ─── Formation Card ─── */
const FormationCard = ({
  formation,
  isArabic,
  langPrefix,
}: {
  formation: any;
  isArabic: boolean;
  langPrefix: string;
}) => {
  const title = isArabic
    ? formation.title_ar || formation.title_fr || formation.title
    : formation.title_fr || formation.title;
  const description = isArabic
    ? formation.description_ar || formation.description_fr || formation.description
    : formation.description_fr || formation.description;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Image */}
      <div className="relative h-36 sm:h-44 bg-muted flex-shrink-0">
        <img
          src={
            formation.image_url ||
            'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800'
          }
          alt={title || ''}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80';
          }}
        />
        {formation.is_popular && (
          <Badge
            className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} bg-red-500 text-white text-[10px]`}
          >
            {isArabic ? 'شائع' : 'Populaire'}
          </Badge>
        )}

      </div>

      {/* Content */}
      <CardHeader className="pb-1 px-4 pt-4 flex-grow">
        <CardTitle className="text-sm sm:text-base line-clamp-2 leading-snug">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          {formation.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formation.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            {formation.rating || '4.8'}
          </span>
          {formation.current_participants !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formation.current_participants}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" className="w-full text-xs" asChild>
            <Link to={`${langPrefix}/formation/${formation.slug}`}>
              {isArabic ? 'التفاصيل' : 'Détails'}
              <ArrowRight
                className={`w-3.5 h-3.5 ${isArabic ? 'mr-1 rotate-180' : 'ml-1'}`}
              />
            </Link>
          </Button>

        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Skeleton Card ─── */
const SkeletonCard = () => (
  <div className="rounded-lg overflow-hidden border bg-white animate-pulse">
    <div className="h-36 sm:h-44 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded mt-3" />
    </div>
  </div>
);

/* ─── Main Page ─── */
const CategoryFormations = () => {
  const { slug } = useParams();
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const isArabic = language === 'ar';
  const langPrefix = isArabic ? '/ar' : '/fr';

  const [formations, setFormations] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* translations */
  const t = {
    backToAll: isArabic ? 'جميع الدورات' : 'Toutes les formations',
    available: isArabic ? 'دورة متوفرة' : 'formation(s) disponible(s)',
    empty: isArabic ? 'لا توجد دورات في هذا القسم حالياً' : 'Aucun programme disponible dans cette catégorie.',
    backCatalog: isArabic ? 'العودة للكتالوج' : 'Retour au catalogue',
    otherCategories: isArabic ? 'أقسام أخرى' : 'Autres catégories',
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [catData, allCats] = await Promise.all([
          SupabaseService.getCategoryBySlug(slug),
          SupabaseService.getCategories(),
        ]);
        if (catData) {
          setCategory(catData);
          const formData = await SupabaseService.getFormationsByCategory(catData.id);
          setFormations(formData || []);
        }
        setAllCategories(allCats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const CategoryIcon = CATEGORY_ICONS[slug || ''] || BookOpen;
  const categoryName = isArabic
    ? category?.name_ar || category?.name
    : category?.name_fr || category?.name;

  const otherCategories = allCategories.filter((c) => c.slug !== slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
      <main>
        {/* ── Hero / Header ── */}
        <section
          className="py-14 sm:py-20 lg:py-28 relative min-h-[40vh] sm:min-h-[50vh] flex items-center"
          style={{ backgroundColor: 'rgba(37, 59, 116, 0.90)' }}
        >
          {/* Background blur blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Back link */}
            <Link
              to={`${langPrefix}/nos-formations`}
              className={`inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group text-sm font-semibold`}
            >
              <ArrowLeft
                className={`w-4 h-4 group-hover:-translate-x-1 transition-transform ${isArabic ? 'rotate-180 group-hover:translate-x-1' : ''}`}
              />
              {t.backToAll}
            </Link>

            {/* Category title */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CategoryIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight">
                  {loading ? '...' : categoryName}
                </h1>
                {!loading && (
                  <p className="text-white/70 text-sm mt-1">
                    {formations.length} {t.available}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Formations Grid ── */}
        <section className="py-10 sm:py-14 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <SkeletonCard key={n} />
                ))}
              </div>
            ) : formations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {formations.map((f) => (
                  <FormationCard
                    key={f.id}
                    formation={f}
                    isArabic={isArabic}
                    langPrefix={langPrefix}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="py-20 bg-white rounded-2xl border border-gray-100 shadow-inner max-w-2xl mx-auto text-center flex flex-col items-center px-6">
                <BookOpen className="w-16 h-16 text-gray-200 mb-6" />
                <p className="text-lg font-semibold text-gray-400 mb-6">{t.empty}</p>
                <Button asChild>
                  <Link to={`${langPrefix}/nos-formations`}>{t.backCatalog}</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── Other Categories ── */}
        {otherCategories.length > 0 && (
          <section className="py-10 sm:py-14 lg:py-20 bg-white border-t border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-6 sm:mb-8">
                {t.otherCategories}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {otherCategories.map((cat) => {
                  const CatIcon = CATEGORY_ICONS[cat.slug] || BookOpen;
                  const catName = isArabic
                    ? cat.name_ar || cat.name
                    : cat.name_fr || cat.name;
                  return (
                    <Link
                      key={cat.id}
                      to={`${langPrefix}/formations/category/${cat.slug}`}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-xl transition-all text-center group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(37,59,116,0.1)' }}
                      >
                        <CatIcon
                          className="w-5 h-5 group-hover:scale-110 transition-transform"
                          style={{ color: '#253b74' }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                        {catName}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CategoryFormations;
