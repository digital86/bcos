// Supabase Configuration
export const supabaseConfig = {
  url: 'https://ffflrykazordaryhwrlr.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmxyeWthem9yZGFyeWh3cmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzA0MzYsImV4cCI6MjA3ODUwNjQzNn0.go1MuwHFoJ-hJzQ7aIo3NXhfxoG08WRIeGm6oIbOwTo',
  projectId: 'ffflrykazordaryhwrlr'
};

// Database Schema Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  role: 'student' | 'trainer' | 'admin';
  status: 'active' | 'inactive';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  created_at: string;
  updated_at: string;
  // Bilingual fields
  name_fr?: string;
  name_ar?: string;
  description_fr?: string;
  description_ar?: string;
  display_order?: number;
}

export interface FormationCategory {
  id: string;
  formation_id: string;
  category_id: string;
  category?: Category;
  created_at: string;
}

export interface Formation {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  category_id?: string;
  category?: Category;
  categories?: Category[]; // Multiple categories support
  formation_categories?: FormationCategory[]; // Junction table data
  duration: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';
  price: number;
  currency: string;
  max_participants: number;
  current_participants: number;
  rating: number;
  image_url?: string;
  objectives?: string[];
  prerequisites?: string;
  trainer_id?: string;
  trainer?: User;
  start_date?: string;
  end_date?: string;
  location?: string;
  is_online: boolean;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Bilingual French fields
  title_fr?: string;
  description_fr?: string;
  content_fr?: string;
  objectives_fr?: string[];
  prerequisites_fr?: string;
  program_fr?: string;
  target_audience_fr?: string;
  // Bilingual Arabic fields
  title_ar?: string;
  description_ar?: string;
  content_ar?: string;
  objectives_ar?: string[];
  prerequisites_ar?: string;
  program_ar?: string;
  target_audience_ar?: string;
  // Enhanced pricing fields
  price_ht?: number;
  price_ttc?: number;
  reference?: string;
  tags?: string[];
  is_published?: boolean;
  cover_image_url?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  name_fr?: string;
  name_ar?: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id?: string;
  category?: BlogCategory;
  author_id?: string;
  author?: User;
  formation_id?: string;
  formation?: Formation;
  image_url?: string;
  tags?: string[];
  views: number;
  comments_count: number;
  read_time: number;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  language?: 'fr' | 'ar';
}

export interface ClientReference {
  id: string;
  company_name: string;
  logo_url?: string;
  category: string;
  description: string;
  website_url?: string;
  links?: string[];
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  project_date?: string;
  duration?: string;
  participants?: number;
  rating: number;
  status: 'completed' | 'in_progress' | 'planned';
  testimonial?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  message?: string;
  status: 'pending' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  alt_text?: string;
  url: string;
  category: string;
  file_size?: number;
  dimensions?: string;
  format?: string;
  status: 'active' | 'inactive';
  upload_date: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  reply?: string;
  replied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at?: string;
  source: string;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value?: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'json' | 'url' | 'email';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Statistic {
  id: string;
  key: string;
  value: string;
  label_fr: string;
  label_ar?: string;
  icon_name?: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  formation_id: string;
  course_id?: string;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  experience_level?: string;
  motivation?: string;
  preferred_date?: string;
  how_did_you_hear?: string;
  special_requirements?: string;
  status: 'new' | 'to_confirm' | 'confirmed' | 'cancelled' | 'pending' | 'completed';
  lead_status?: 'nouveau' | 'confirme' | 'a_confirme' | 'nos_repond_pas' | 'pas_interest';
  lead_source?: string;
  source?: string;
  language_preference?: 'fr' | 'ar';
  notes?: string;
  commercial_notes?: string;
  contact_date?: string;
  follow_up_date?: string;
  enrollment_date: string;
  amount_paid?: number;
  created_at: string;
  updated_at: string;
  formation?: {
    id: string;
    title: string;
    title_fr?: string;
    title_ar?: string;
    price?: number;
    price_ttc?: number;
    currency?: string;
  };
}

export interface LandingPage {
  id: string;
  formation_id: string;
  language: 'fr' | 'ar';
  title: string;
  meta_description?: string;
  hero_content?: string;
  features?: any;
  testimonials?: any;
  cta_text?: string;
  seo_keywords?: string[];
  is_active: boolean;
  generated_at: string;
  created_at: string;
  updated_at: string;
}


