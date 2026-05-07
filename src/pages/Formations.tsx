import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { 
  ArrowRight,
  Clock,
  Users,
  Star,
  Calendar,
  BookOpen,
  TrendingUp,
  Target,
  Briefcase,
  DollarSign,
  Truck,
  Heart,
  Monitor,
  Zap,
  PieChart,
  Award,
  Shield,
  MessageSquare,
  Lightbulb,
  User
} from 'lucide-react';
import { useFormations, useCategories, usePopularFormations } from '@/hooks/useSupabase';
import { SupabaseService } from '@/lib/supabase';
import { supabase } from '@/lib/supabaseClient';
import { EditableLink } from '@/components/admin/EditableContent';
import EnrollmentForm from '@/components/EnrollmentForm';
import type { Statistic } from '../../supabase-config';
import * as LucideIcons from 'lucide-react';

/* ─── Animated stat card for the formations stats banner ─── */
const FormationStatCard = ({
  value,
  suffix = '',
  label,
  delay = 0,
  accentColor = '#c8e847',
  isDecimal = false,
}: {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
  accentColor?: string;
  isDecimal?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      const steps = 60;
      const duration = 1600;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setCount(value * eased);
        if (step >= steps) {
          setCount(value);
          clearInterval(interval);
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [isVisible, value, delay]);

  const displayStr = isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString('fr-FR');

  return (
    <div
      ref={ref}
      className="relative rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col items-center text-center overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-b-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Number */}
      <div className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tabular-nums mb-1 leading-none">
        {isVisible ? displayStr : '0'}
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: accentColor }}>
          {suffix}
        </span>
      </div>

      {/* Label */}
      <p className="text-white/70 text-xs sm:text-sm font-medium mt-1 leading-tight">{label}</p>
    </div>
  );
};

import SEO from '@/components/SEO';
import { generateLocalBusinessSchema } from '@/utils/seoUtils';


const Formations = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Detect language from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/ar/')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
  }, [location.pathname]);

  // Update search term from URL params
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Load statistics from database
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoadingStats(true);
        const stats = await SupabaseService.getStatistics(false); // Only visible stats
        setStatistics(stats || []);
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStatistics();
  }, []);

  // Translations
  const t = {
    fr: {
      heroTitle: 'Nos Formations',
      heroSubtitle: 'Développez vos compétences avec nos formations expertes adaptées à vos besoins',
      discoverBtn: 'Découvrir nos formations',
      catalogBtn: 'Télécharger le programme mensuel',
      popularBadge: 'Formations populaires',
      popularTitle: 'Nos formations les plus demandées',
      popularSubtitle: 'Découvrez les formations qui ont le plus de succès auprès de nos clients',
      popular: 'Populaire',
      seeMore: 'En savoir plus',
      register: "S'inscrire",
      details: 'Détails',
      formationsAvailable: 'formation disponible',
      formationsAvailablePlural: 'formations disponibles',
      seeAll: 'Voir tout',
      statsTitle: 'Nos formations en chiffres',
      statsSubtitle: "Découvrez l'impact de nos programmes de formation",
      statsFormations: 'Formations disponibles',
      statsParticipants: 'Participants formés',
      statsRating: 'Note moyenne',
      statsDomains: "Domaines d'expertise",
      ctaTitle: 'Besoin d\'une formation sur mesure ?',
      ctaSubtitle: 'Nos experts conçoivent des programmes personnalisés selon vos besoins spécifiques',
      ctaQuote: 'Demander un devis',
      ctaContact: 'Nous contacter',
    },
    ar: {
      heroTitle: 'دوراتنا',
      heroSubtitle: 'طور مهاراتك مع دوراتنا المتخصصة المصممة خصيصاً لاحتياجاتك',
      discoverBtn: 'اكتشف دوراتنا',
      catalogBtn: 'تحميل البرنامج الشهري',
      popularBadge: 'الدورات الشائعة',
      popularTitle: 'أكثر الدورات طلباً',
      popularSubtitle: 'اكتشف الدورات التي تحظى بأكبر نجاح لدى عملائنا',
      popular: 'شائع',
      seeMore: 'اعرف المزيد',
      register: 'سجل الآن',
      details: 'التفاصيل',
      formationsAvailable: 'دورة متاحة',
      formationsAvailablePlural: 'دورات متاحة',
      seeAll: 'عرض الكل',
      statsTitle: 'دوراتنا بالأرقام',
      statsSubtitle: 'اكتشف تأثير برامجنا التدريبية',
      statsFormations: 'الدورات المتاحة',
      statsParticipants: 'المشاركون المدربون',
      statsRating: 'التقييم المتوسط',
      statsDomains: 'مجالات الخبرة',
      ctaTitle: 'هل تحتاج إلى دورة مخصصة؟',
      ctaSubtitle: 'يصمم خبراؤنا برامج مخصصة وفقاً لاحتياجاتك الخاصة',
      ctaQuote: 'اطلب عرض سعر',
      ctaContact: 'اتصل بنا',
    }
  };

  const translations = t[language];
  const langPrefix = language === 'ar' ? '/ar' : '/fr';

  // Fetch data from Supabase
  const { formations: allFormations, loading: formationsLoading } = useFormations();
  const { formations: popularFormations, loading: popularLoading } = usePopularFormations();
  const { categories: supabaseCategories, loading: categoriesLoading } = useCategories();

  // Fallback categories with icons
  const categoryIcons: { [key: string]: any } = {
    'commercial': TrendingUp,
    'management': Target,
    'finance': PieChart,
    'logistique': Truck,
    'rh': Heart,
    'digital': Monitor,
    'soft-skills': Zap,
    'qualite': Award,
    'securite': Shield,
    'communication': MessageSquare,
    'innovation': Lightbulb,
    'gestion-projet': Briefcase,
    'developpement-personnel': User
  };

  const categories = supabaseCategories.length > 0 
    ? supabaseCategories.map(cat => ({
        id: cat.slug,
        name: language === 'ar' ? (cat.name_ar || cat.name) : (cat.name_fr || cat.name),
        icon: categoryIcons[cat.slug] || BookOpen,
        color: cat.color
      }))
    : [
    { id: 'commercial', name: language === 'ar' ? 'تجاري ومبيعات' : 'Commercial & Vente', icon: TrendingUp, color: '#253b74' },
    { id: 'management', name: language === 'ar' ? 'الإدارة والقيادة' : 'Management & Leadership', icon: Target, color: '#253b74' },
    { id: 'finance', name: language === 'ar' ? 'المالية والمحاسبة' : 'Finance & Comptabilité', icon: PieChart, color: '#253b74' },
    { id: 'logistique', name: language === 'ar' ? 'اللوجستيك وسلسلة التوريد' : 'Logistique & Supply Chain', icon: Truck, color: '#253b74' },
    { id: 'rh', name: language === 'ar' ? 'الموارد البشرية' : 'Ressources Humaines', icon: Heart, color: '#253b74' },
    { id: 'digital', name: language === 'ar' ? 'الرقمي والذكاء الاصطناعي' : 'Digital & IA', icon: Monitor, color: '#253b74' },
    { id: 'soft-skills', name: language === 'ar' ? 'المهارات الناعمة' : 'Soft Skills', icon: Zap, color: '#253b74' },
    { id: 'qualite', name: language === 'ar' ? 'الجودة والشهادات' : 'Qualité & Certification', icon: Award, color: '#16a34a' },
    { id: 'securite', name: language === 'ar' ? 'الأمن والبيئة' : 'Sécurité & Environnement', icon: Shield, color: '#dc2626' },
    { id: 'communication', name: language === 'ar' ? 'الاتصال والعلاقات' : 'Communication & Relations', icon: MessageSquare, color: '#7c3aed' },
    { id: 'innovation', name: language === 'ar' ? 'الابتكار والإبداع' : 'Innovation & Créativité', icon: Lightbulb, color: '#f59e0b' },
    { id: 'gestion-projet', name: language === 'ar' ? 'إدارة المشاريع' : 'Gestion de Projet', icon: Briefcase, color: '#0ea5e9' },
    { id: 'developpement-personnel', name: language === 'ar' ? 'التنمية الشخصية' : 'Développement Personnel', icon: User, color: '#ec4899' }
  ];

  // Helper to extract content from HTML if needed
  const extractFromHtml = (html: string | undefined, tag: string): string => {
    if (!html) return '';
    try {
      if (tag === 'h1') {
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '').trim();
        // Fallback for h2 if h1 is missing
        const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (h2Match) return h2Match[1].replace(/<[^>]*>/g, '').trim();
      }
      if (tag === 'desc') {
        const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
        if (headerMatch) {
          const pMatch = headerMatch[1].match(/<div[^>]*class="[^"]*text-[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (pMatch) return pMatch[1].replace(/<[^>]*>/g, '').trim();
        }
        // Fallback: first 100 chars of body text
        return html.replace(/<[^>]*>/g, ' ').trim().substring(0, 150) + '...';
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  // Don't filter out formations that lack specific language translations, so they all appear in the carousel
  const filteredFormations = allFormations;

  // Debug: log formations count
  useEffect(() => {
    console.log('Formations loaded:', {
      allFormations: allFormations.length,
      filteredFormations: filteredFormations.length,
      language,
      formationsLoading
    });
  }, [allFormations, filteredFormations, language, formationsLoading]);

  const formations = filteredFormations.length > 0
    ? filteredFormations.map(formation => ({
        id: formation.id,
        title: language === 'ar' 
          ? (formation.title_ar || extractFromHtml(formation.content_ar, 'h1') || formation.title_fr || formation.title || '') 
          : (formation.title_fr || formation.title || formation.title_ar || ''),
        description: language === 'ar' 
          ? (formation.description_ar || extractFromHtml(formation.content_ar, 'desc') || formation.description_fr || formation.description || '') 
          : (formation.description_fr || formation.description || formation.description_ar || ''),
        category: formation.category?.slug || 'general',
        duration: formation.duration,
        level: (formation.level as 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux') || 'Débutant',
        participants: formation.current_participants || 0,
        rating: formation.rating || 0,
        price: `${formation.price} DA`,
        currency: 'DZD',
        image: formation.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        objectives: formation.objectives || [],
        popular: formation.is_popular,
        slug: formation.slug || ''
      }))
    : [
    // Commercial & Vente
    {
      id: 1,
      title: 'La vente par téléphone',
      title_ar: 'البيع عبر الهاتف',
      description: 'Maîtrisez les techniques de closing à distance et développez votre portefeuille clients',
      description_ar: 'أتقن تقنيات الإغلاق عن بعد وطور محصنة عملائك',
      category: 'commercial',
      duration: '3 jours',
      level: 'Intermédiaire',
      participants: 45,
      rating: 4.9,
      price: '899 DA',
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Maîtriser les techniques de prospection téléphonique', 'Développer son argumentaire de vente', 'Gérer les objections clients'],
      popular: true,
      slug: 'la-vente-par-telephone',
      currency: 'DZD'
    },
    {
      id: 2,
      title: 'Techniques de prospection et closing',
      title_ar: 'تقنيات التنقيب والإغلاق',
      description: 'Développez votre portefeuille clients efficacement avec les meilleures techniques',
      description_ar: 'طور محفظة عملائك بفعالية باستخدام أفضل التقنيات',
      category: 'commercial',
      duration: '3 jours',
      level: 'Débutant',
      participants: 67,
      rating: 4.8,
      price: '799 DA',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Identifier et qualifier les prospects', 'Maîtriser les techniques de closing', 'Construire une relation client durable'],
      currency: 'DZD'
    },
    {
      id: 3,
      title: 'Négociation commerciale avancée',
      title_ar: 'التفاوض التجاري المتقدم',
      description: 'Perfectionnez vos compétences en négociation pour maximiser vos résultats',
      description_ar: 'صقل مهاراتك في التفاوض لتحقيق أقصى قدر من النتائج',
      category: 'commercial',
      duration: '2 jours',
      level: 'Avancé',
      participants: 32,
      rating: 4.9,
      price: '1299 DA',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Préparer efficacement ses négociations', 'Utiliser les leviers psychologiques', 'Conclure des accords gagnant-gagnant'],
      currency: 'DZD'
    },
    {
      id: 28,
      title: 'Relation client et fidélisation',
      title_ar: 'علاقة العملاء والولاء',
      description: 'Développez une relation client durable et profitable',
      description_ar: 'تطوير علاقة عملاء مستدامة ومربحة',
      category: 'commercial',
      duration: '2 jours',
      level: 'Intermédiaire',
      participants: 39,
      rating: 4.7,
      price: '799 DA',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Analyser la satisfaction client', 'Mettre en place un programme de fidélisation', 'Gérer les réclamations'],
      currency: 'DZD'
    },
    {
      id: 29,
      title: 'Vente consultative et solutions',
      title_ar: 'البيع الاستشاري والحلول',
      description: 'Adoptez une approche conseil pour vendre des solutions complexes',
      description_ar: 'اعتماد نهج استشاري لبيع الحلول المعقدة',
      category: 'commercial',
      duration: '3 jours',
      level: 'Avancé',
      participants: 24,
      rating: 4.8,
      price: '1199 DA',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Diagnostiquer les besoins complexes', 'Construire une proposition de valeur', 'Vendre en mode projet'],
      currency: 'DZD'
    },
    // Management & Leadership
    {
      id: 4,
      title: 'Leadership et management d\'équipe',
      title_ar: 'القيادة وإدارة الفريق',
      description: 'Développez votre leadership pour motiver et fédérer vos équipes',
      description_ar: 'طور قيادتك لتحفيز وتوحيد فرق عملك',
      category: 'management',
      duration: '4 jours',
      level: 'Intermédiaire',
      participants: 28,
      rating: 4.7,
      price: '1599 DA',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Développer son style de leadership', 'Motiver et fédérer son équipe', 'Gérer les conflits et les résistances'],
      popular: true,
      currency: 'DZD'
    },
    {
      id: 5,
      title: 'Gestion de projet agile',
      title_ar: 'إدارة المشاريع الرشيقة (Agile)',
      description: 'Maîtrisez les méthodologies agiles pour optimiser vos projets',
      description_ar: 'إتقان المنهجيات الرشيقة لتحسين مشاريعك',
      category: 'management',
      duration: '3 jours',
      level: 'Intermédiaire',
      participants: 41,
      rating: 4.8,
      price: '1199 DA',
      image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Comprendre les principes agiles', 'Utiliser Scrum et Kanban', 'Animer des équipes agiles'],
      currency: 'DZD'
    },
    {
      id: 26,
      title: 'Conduite du changement',
      title_ar: 'إدارة التغيير',
      description: 'Accompagnez efficacement les transformations organisationnelles',
      description_ar: 'مرافقة التحولات التنظيمية بفعالية',
      category: 'management',
      duration: '3 jours',
      level: 'Avancé',
      participants: 26,
      rating: 4.7,
      price: '1399 DA',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Diagnostiquer la résistance au changement', 'Élaborer un plan de conduite', 'Mobiliser les acteurs'],
      currency: 'DZD'
    },
    {
      id: "27",
      title: 'Délégation et autonomisation',
      title_ar: 'التفويض والتمكين',
      description: 'Apprenez à déléguer efficacement pour développer vos équipes',
      description_ar: 'تعلم كيفية التفويض بفعالية لتطوير فرقك',
      category: 'management',
      duration: '2 jours',
      level: 'Intermédiaire',
      participants: 33,
      rating: 4.6,
      price: '899 DA',
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Identifier les tâches à déléguer', 'Accompagner la montée en compétences', 'Contrôler sans micro-manager'],
      currency: 'DZD'
    },
    // Finance & Comptabilité
    {
      id: "6",
      title: 'Analyse financière et budgétaire',
      title_ar: 'التحليل المالي والميزانياتي',
      description: 'Maîtrisez les outils d\'analyse financière pour piloter votre activité',
      description_ar: 'إتقان أدوات التحليل المالي لقيادة نشاطك',
      category: 'finance',
      duration: '3 jours',
      level: 'Intermédiaire',
      participants: 23,
      rating: 4.6,
      price: '1399 DA',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Lire et analyser les états financiers', 'Construire un budget prévisionnel', 'Utiliser les ratios financiers'],
      currency: 'DZD'
    },
    {
      id: "7",
      title: 'Contrôle de gestion opérationnel',
      title_ar: 'الرقابة على التسيير التشغيلي',
      description: 'Optimisez la performance de votre organisation avec les outils de contrôle de gestion',
      description_ar: 'تحسين أداء مؤسستك باستخدام أدوات مراقبة التسيير',
      category: 'finance',
      duration: '4 jours',
      level: 'Avancé',
      participants: 19,
      rating: 4.7,
      price: '1699 DA',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Mettre en place un système de contrôle', 'Analyser les écarts budgétaires', 'Optimiser la rentabilité'],
      currency: 'DZD'
    },
    {
      id: 24,
      title: 'Fiscalité des entreprises',
      description: 'Maîtrisez les obligations fiscales et optimisez votre fiscalité',
      category: 'finance',
      duration: '3 jours',
      level: 'Avancé',
      participants: 18,
      rating: 4.5,
      price: '1499 DA',
      image: 'https://images.unsplash.com/photo-1554224154-26032fced8bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Connaître les obligations fiscales', 'Optimiser la charge fiscale', 'Gérer les contrôles fiscaux'],
      currency: 'DZD'
    },
    {
      id: 25,
      title: 'Trésorerie et financement',
      description: 'Gérez efficacement la trésorerie et les besoins de financement',
      category: 'finance',
      duration: '2 jours',
      level: 'Intermédiaire',
      participants: 24,
      rating: 4.6,
      price: '999 DA',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Prévoir les besoins de trésorerie', 'Négocier avec les banques', 'Optimiser les placements'],
      currency: 'DZD'
    },
    // Logistique & Supply Chain
    {
      id: 8,
      title: 'Gestion des achats & approvisionnements',
      description: 'Réduisez vos coûts et sécurisez votre supply chain',
      category: 'logistique',
      duration: '4 jours',
      level: 'Tous niveaux',
      participants: 35,
      rating: 4.8,
      price: '1299 DA',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Optimiser le processus achats', 'Négocier avec les fournisseurs', 'Gérer les risques supply chain'],
      popular: true,
      currency: 'DZD'
    },
    {
      id: 9,
      title: 'Techniques d\'inventaires physiques',
      description: 'Optimisez vos processus de contrôle et valorisation des stocks',
      category: 'logistique',
      duration: '2 jours',
      level: 'Avancé',
      participants: 22,
      rating: 4.7,
      price: '699 DA',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Organiser un inventaire physique', 'Analyser les écarts de stock', 'Optimiser la valorisation'],
      currency: 'DZD'
    },
    {
      id: 22,
      title: 'Transport et distribution',
      description: 'Optimisez vos opérations de transport et de livraison',
      category: 'logistique',
      duration: '3 jours',
      level: 'Intermédiaire',
      participants: 28,
      rating: 4.6,
      price: '1099 DA',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Planifier les tournées', 'Optimiser les coûts transport', 'Gérer la relation transporteurs'],
      currency: 'DZD'
    },
    {
      id: 23,
      title: 'Lean Manufacturing et amélioration continue',
      description: 'Éliminez les gaspillages et améliorez votre productivité',
      category: 'logistique',
      duration: '4 jours',
      level: 'Avancé',
      participants: 20,
      rating: 4.8,
      price: '1599 DA',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Appliquer les principes Lean', 'Mettre en place le 5S', 'Conduire des projets Kaizen'],
      currency: 'DZD'
    },
    // Digital & IA
    {
      id: "10",
      title: 'Intelligence Artificielle pour les entreprises',
      title_ar: 'الذكاء الاصطناعي للمؤسسات',
      description: 'Découvrez comment l\'IA peut transformer votre business',
      description_ar: 'اكتشف كيف يمكن للذكاء الاصطناعي تحويل عملك',
      category: 'digital',
      duration: '2 jours',
      level: 'Débutant',
      participants: 38,
      rating: 4.9,
      price: '999 DA',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Comprendre les enjeux de l\'IA', 'Identifier les cas d\'usage', 'Mettre en place une stratégie IA'],
      currency: 'DZD'
    },
    {
      id: "11",
      title: 'Transformation digitale',
      title_ar: 'التحول الرقمي',
      description: 'Accompagnez votre organisation dans sa transformation numérique',
      description_ar: 'رافق مؤسستك في تحولها الرقمي',
      category: 'digital',
      duration: '3 jours',
      level: 'Intermédiaire',
      participants: 29,
      rating: 4.6,
      price: '1199 DA',
      image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Élaborer une stratégie digitale', 'Conduire le changement', 'Mesurer la performance digitale'],
      currency: 'DZD'
    },
    {
      id: 12,
      title: 'Marketing Digital et Réseaux Sociaux',
      description: 'Maîtrisez les outils du marketing digital moderne',
      category: 'digital',
      duration: '3 jours',
      level: 'Intermédiaire',
      participants: 45,
      rating: 4.7,
      price: '1099 DA',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Créer une stratégie social media', 'Optimiser le ROI digital', 'Analyser les performances'],
      currency: 'DZD'
    },
    {
      id: 13,
      title: 'Cybersécurité pour les entreprises',
      description: 'Protégez votre organisation contre les cybermenaces',
      category: 'digital',
      duration: '2 jours',
      level: 'Avancé',
      participants: 25,
      rating: 4.8,
      price: '1399 DA',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Identifier les risques cyber', 'Mettre en place des protections', 'Gérer les incidents'],
      currency: 'DZD'
    },
    // Ressources Humaines
    {
      id: 14,
      title: 'Recrutement et sélection',
      description: 'Optimisez vos processus de recrutement pour attirer les meilleurs talents',
      category: 'rh',
      duration: '2 jours',
      level: 'Intermédiaire',
      participants: 32,
      rating: 4.6,
      price: '899 DA',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Définir les profils de poste', 'Conduire des entretiens efficaces', 'Évaluer les candidats'],
      currency: 'DZD'
    },
    {
      id: 15,
      title: 'Gestion des conflits en entreprise',
      description: 'Apprenez à gérer et résoudre les conflits au travail',
      category: 'rh',
      duration: '2 jours',
      level: 'Intermédiaire',
      participants: 28,
      rating: 4.7,
      price: '799 DA',
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Identifier les sources de conflit', 'Techniques de médiation', 'Prévenir les conflits'],
      currency: 'DZD'
    },
    {
      id: 16,
      title: 'Formation des formateurs',
      description: 'Développez vos compétences pédagogiques et d\'animation',
      category: 'rh',
      duration: '3 jours',
      level: 'Tous niveaux',
      participants: 35,
      rating: 4.8,
      price: '1199 DA',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Concevoir un programme de formation', 'Animer avec impact', 'Évaluer les apprentissages'],
      currency: 'DZD'
    },
    {
      id: 17,
      title: 'Droit du travail et législation sociale',
      description: 'Maîtrisez le cadre juridique des relations de travail',
      category: 'rh',
      duration: '3 jours',
      level: 'Avancé',
      participants: 22,
      rating: 4.5,
      price: '1299 DA',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Connaître la législation', 'Gérer les procédures disciplinaires', 'Éviter les contentieux'],
      currency: 'DZD'
    },
    // Soft Skills
    {
      id: 18,
      title: 'Communication interpersonnelle',
      description: 'Améliorez votre communication pour des relations plus efficaces',
      category: 'soft-skills',
      duration: '2 jours',
      level: 'Tous niveaux',
      participants: 42,
      rating: 4.8,
      price: '699 DA',
      image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Développer l\'écoute active', 'Gérer les émotions', 'Communiquer avec assertivité'],
      currency: 'DZD'
    },
    {
      id: 19,
      title: 'Gestion du stress et bien-être au travail',
      description: 'Apprenez à gérer le stress pour améliorer votre performance',
      category: 'soft-skills',
      duration: '2 jours',
      level: 'Tous niveaux',
      participants: 38,
      rating: 4.7,
      price: '599 DA',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Identifier les sources de stress', 'Techniques de relaxation', 'Équilibre vie pro/perso'],
      currency: 'DZD'
    },
    {
      id: 20,
      title: 'Créativité et innovation',
      description: 'Développez votre créativité pour innover dans votre travail',
      category: 'soft-skills',
      duration: '2 jours',
      level: 'Intermédiaire',
      participants: 30,
      rating: 4.6,
      price: '799 DA',
      image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Stimuler la créativité', 'Méthodes d\'innovation', 'Mettre en œuvre des idées'],
      currency: 'DZD'
    },
    {
      id: 21,
      title: 'Prise de parole en public',
      description: 'Maîtrisez l\'art de la présentation et de la prise de parole',
      category: 'soft-skills',
      duration: '2 jours',
      level: 'Débutant',
      participants: 25,
      rating: 4.9,
      price: '899 DA',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      objectives: ['Vaincre le trac', 'Structurer son discours', 'Captiver son audience'],
      popular: true,
      currency: 'DZD'
    }
  ];

  // Use popular formations from Supabase or filter from all formations
  // Filter popular formations based on language
  const filteredPopularFormations = popularFormations.length > 0 
    ? (language === 'ar'
        ? popularFormations.filter(f => f.title_ar || f.content_ar)
        : popularFormations.filter(f => f.title_fr || f.title)
      )
    : [];

  const displayPopularFormations = filteredPopularFormations.length > 0
    ? filteredPopularFormations.map(formation => ({
        id: formation.id,
        title: language === 'ar' 
          ? (formation.title_ar || extractFromHtml(formation.content_ar, 'h1') || '') 
          : (formation.title_fr || formation.title),
        description: language === 'ar' 
          ? (formation.description_ar || extractFromHtml(formation.content_ar, 'desc') || '') 
          : (formation.description_fr || formation.description),
        category: formation.category?.slug || 'general',
        duration: formation.duration,
        level: formation.level,
        participants: formation.current_participants || 0,
        rating: formation.rating || 0,
        price: `${formation.price} DA`,
        image: formation.image_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        objectives: formation.objectives || [],
        popular: formation.is_popular,
        slug: formation.slug
      }))
    // Fallback: if no popular formations, use random sample from all formations
    : (() => {
        const pool = formations.length > 0 ? formations : [];
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 8);
        return shuffled;
      })();

  // Smart keyword-based search function (same as Hero)
  const searchFormationsByKeywords = (query: string, formationsList: typeof formations): typeof formations => {
    if (!query || !formationsList.length) return formationsList;

    const normalize = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };

    const getKeywords = (str: string): string[] => {
      return normalize(str).split(/\s+/).filter(w => w.length > 2);
    };

    const searchQueryNormalized = normalize(query);
    const searchKeywords = getKeywords(query);

    return formationsList.filter(formation => {
      const searchableText = normalize(
        `${formation.title} ${formation.description || ''} ${formation.category || ''}`
      );
      const titleKeywords = getKeywords(formation.title);

      // Exact match
      if (searchableText === searchQueryNormalized) return true;

      // Starts with
      if (searchableText.startsWith(searchQueryNormalized)) return true;

      // Contains
      if (searchableText.includes(searchQueryNormalized)) return true;

      // Keyword matching
      const matchingKeywords = searchKeywords.filter(sk => 
        titleKeywords.some(tk => tk === sk || tk.includes(sk) || sk.includes(tk))
      );
      if (matchingKeywords.length > 0) return true;

      // Partial word matching
      const partialMatches = searchKeywords.filter(sk => 
        titleKeywords.some(tk => tk.startsWith(sk) || sk.startsWith(tk))
      );
      return partialMatches.length > 0;
    });
  };

  // Apply search filter
  const displayedFormations = useMemo(() => {
    if (searchTerm.trim().length >= 2) {
      return searchFormationsByKeywords(searchTerm.trim(), formations);
    }
    return formations;
  }, [searchTerm, formations]);

  const getFormationsByCategory = (categoryId: string) => {
    return displayedFormations.filter(formation => formation.category === categoryId);
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

  const getLevelLabel = (level: string) => {
    if (language === 'ar') {
      switch (level) {
        case 'Débutant': return 'مبتدئ';
        case 'Intermédiaire': return 'متوسط';
        case 'Avancé': return 'متقدم';
        case 'Tous niveaux': return 'hidden';
        default: return level;
      }
    }
    return level;
  };

  const seoData = useMemo(() => ({
    title: language === 'ar' 
      ? 'الدورات التدريبية | BCOS - مركز التكوين والاستشارات' 
      : 'Nos Formations | BCOS - Centre de Formation & Conseil',
    description: language === 'ar'
      ? 'اكتشف مجموعتنا الواسعة من الدورات التدريبية في الجزائر. برامج معتمدة في الإدارة، المالية، اللوجستيك، والمهارات الرقمية.'
      : 'Découvrez notre large éventail de formations professionnelles en Algérie. Programmes certifiants en management, finance, logistique et digital.',
    schemaData: generateLocalBusinessSchema(language),
    canonical: `https://bcos-dz.com/${language}/formations`
  }), [language]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language} />
      <main className="pb-16">
        {/* Hero Section */}
        <section className="py-14 sm:py-20 lg:py-28 relative min-h-[50vh] sm:min-h-[60vh] flex items-center">

          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.7)' }} />
          
          {/* Content */}
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white mb-4 leading-tight">
                {translations.heroTitle}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 leading-relaxed">
                {translations.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <EditableLink 
                  contentKey="formations_monthly_program" 
                  defaultUrl="#" 
                  pageKey="formations"
                >
                  <Button size="default" className="text-sm sm:text-base px-5 sm:px-8 bg-white text-primary hover:bg-white/90 shadow-xl font-semibold w-full sm:w-auto">
                    {translations.catalogBtn}
                  </Button>
                </EditableLink>
              </div>
            </div>
          </div>
        </section>

        {/* Search Results */}
        {searchTerm.trim().length >= 2 && (
          <section className="py-12 lg:py-16 bg-white border-b">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-2">
                  {language === 'ar' 
                    ? `نتائج البحث عن "${searchTerm}"`
                    : `Résultats de recherche pour "${searchTerm}"`}
                </h2>
                <p className="text-muted-foreground">
                  {displayedFormations.length} {displayedFormations.length > 1 
                    ? (language === 'ar' ? 'نتائج' : 'résultats trouvés')
                    : (language === 'ar' ? 'نتيجة' : 'résultat trouvé')}
                </p>
              </div>
              
              {displayedFormations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedFormations.map((formation) => (
                    <Card key={formation.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                      <div className="relative">
                        <img
                          src={formation.image}
                          alt={formation.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {formation.popular && (
                          <Badge className={`absolute ${language === 'ar' ? 'top-4 left-4' : 'top-4 right-4'} bg-red-500 text-white`}>
                            {translations.popular}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="flex-1">
                        <div className="flex items-center justify-end mb-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                            <span className="text-sm font-medium">{formation.rating}</span>
                          </div>
                        </div>
                        <CardTitle className="text-sm lg:text-base line-clamp-2">{formation.title}</CardTitle>
                        <div className="h-0" />
                      </CardHeader>
                      <CardContent className="pt-0 mt-auto">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formation.duration}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {formation.participants}
                            </div>
                          </div>
                          
                          <div>
                            <Button size="sm" variant="outline" className="text-xs w-full text-white border-none bg-bcos-lime hover:bg-bcos-lime/90 font-bold shadow-md transition-all active:scale-[0.98]" asChild>
                              <Link to={`${langPrefix}/formation/${formation.slug || formation.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                {translations.details}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {language === 'ar' 
                      ? 'لا توجد نتائج للبحث'
                      : 'Aucun résultat trouvé'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}



        {/* Categories with Carousels */}
        {searchTerm.trim().length < 2 && categories.map((category) => {
          const categoryFormations = getFormationsByCategory(category.id);
          
          if (categoryFormations.length === 0) return null;
          
          return (
            <section key={category.id} className="py-6 lg:py-10 border-b border-gray-100 last:border-b-0">
              <div className="container mx-auto px-4 lg:px-8">
                {/* Category Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.1)' }}>
                      <category.icon className="w-5 h-5" style={{ color: '#253b74' }} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground leading-tight">
                        {category.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {categoryFormations.length} {categoryFormations.length > 1 ? translations.formationsAvailablePlural : translations.formationsAvailable}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`${langPrefix}/formations/category/${category.id}`}
                    className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap flex-shrink-0"
                    style={{ color: '#253b74' }}
                  >
                    {translations.seeAll}
                    <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </Link>
                </div>

                {/* Category Carousel */}
                <div className="relative px-0 sm:px-10">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-4 py-4">
                    {categoryFormations.map((formation) => (
                      <CarouselItem key={formation.id} className="pl-4 pb-2 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <Card className="hover:shadow-lg transition-transform hover:scale-[1.02] h-full flex flex-col">
                          <div className="relative">
                            <img
                              src={formation.image}
                              alt={formation.title}
                              className="w-full h-28 sm:h-36 object-cover rounded-t-lg"
                            />
                            {formation.popular && (
                              <Badge className={`absolute top-2 ${language === 'ar' ? 'left-2' : 'right-2'} bg-red-500 text-white text-[10px] px-1.5 py-0.5`}>
                                {translations.popular}
                              </Badge>
                            )}

                          </div>
                          <CardHeader className="p-2.5 pb-1 flex-1">
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs font-medium">{formation.rating || '4.8'}</span>
                              {formation.duration && (
                                <span className="flex items-center gap-0.5 text-[11px] text-gray-400 ml-auto">
                                  <Clock className="w-3 h-3" />
                                  {formation.duration}
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-xs sm:text-sm line-clamp-2 leading-snug font-semibold">{formation.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-2.5 pt-1 mt-auto space-y-1.5">
                            <Button size="sm" variant="outline" className="w-full text-[11px] h-7 px-2 text-white border-none bg-bcos-lime hover:bg-bcos-lime/90 font-bold shadow-sm transition-all active:scale-[0.98]" asChild>
                              <Link to={`${langPrefix}/formation/${formation.slug || formation.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                {translations.details}
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4 sm:-left-10 hidden sm:flex z-10" />
                  <CarouselNext className="-right-4 sm:-right-10 hidden sm:flex z-10" />
                </Carousel>
                </div>
              </div>
            </section>
          );
        })}

        {/* ── Stats Banner ── */}
        <section className="py-10 lg:py-14" style={{ background: 'linear-gradient(135deg, #1a2d5a 0%, #253b74 50%, #1e3a6e 100%)' }}>
          <div className="container mx-auto px-4 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-white mb-2">
                {translations.statsTitle}
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                {translations.statsSubtitle}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Stat 1 — Formations */}
              <FormationStatCard
                value={90}
                suffix="+"
                label={translations.statsFormations}
                delay={0}
                accentColor="#c8e847"
              />
              {/* Stat 2 — Participants */}
              <FormationStatCard
                value={30000}
                suffix="+"
                label={translations.statsParticipants}
                delay={150}
                accentColor="#5ba3f5"
              />
              {/* Stat 3 — Rating */}
              <FormationStatCard
                value={4.8}
                suffix="/5"
                isDecimal
                label={translations.statsRating}
                delay={300}
                accentColor="#f59e0b"
              />
              {/* Stat 4 — Domains */}
              <FormationStatCard
                value={categories.length || 6}
                suffix=""
                label={translations.statsDomains}
                delay={450}
                accentColor="#a78bfa"
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Formations;
