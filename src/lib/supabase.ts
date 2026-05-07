import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../../supabase-config';

// Create Supabase client
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Database helper functions
export class SupabaseService {
  // Users
  static async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createUser(user: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createCategory(category: any) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCategory(id: string, updates: any) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async updateCategoryOrder(categories: { id: string; display_order: number }[]) {
    const updates = categories.map(cat => 
      supabase
        .from('categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id)
    );
    
    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      throw errors[0].error;
    }
  }

  // Formations
  static async getFormations() {
    try {
      // First, get formations without complex joins to avoid RLS issues
      // Safe select: Request columns that are guaranteed to exist or have safe fallbacks
      const { data: formationsData, error: formationsError } = await supabase
        .from('formations')
        .select('id, title, title_fr, title_ar, slug, image_url, cover_image_url, duration, rating, is_popular, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (formationsError) throw formationsError;
      if (!formationsData || formationsData.length === 0) return [];
      
      // Then, get formation_categories for all formations
      const formationIds = formationsData.map(f => f.id);
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('formation_categories')
        .select(`
          formation_id,
          category:categories(id, name, name_fr, name_ar, slug, color)
        `)
        .in('formation_id', formationIds);
      
      // Group categories by formation_id
      const categoriesByFormation: { [key: string]: any[] } = {};
      if (categoriesData && !categoriesError) {
        categoriesData.forEach((fc: any) => {
          if (fc.category) {
            if (!categoriesByFormation[fc.formation_id]) {
              categoriesByFormation[fc.formation_id] = [];
            }
            categoriesByFormation[fc.formation_id].push(fc.category);
          }
        });
      }
      
      // Also get single category for backward compatibility
      const { data: singleCategoriesData } = await supabase
        .from('formations')
        .select('id, category:categories(id, name, name_fr, name_ar, slug, color)')
        .eq('is_active', true)
        .in('id', formationIds);
      
      // Transform data to include categories array
      return formationsData.map((formation: any) => {
        const categories = categoriesByFormation[formation.id] || [];
        const singleCategory = singleCategoriesData?.find(f => f.id === formation.id)?.category;
        
        return {
          ...formation,
          categories: categories.length > 0 ? categories : (singleCategory ? [singleCategory] : []),
          category: singleCategory || categories[0] || null
        };
      });
    } catch (error) {
      console.error('Error in getFormations:', error);
      throw error;
    }
  }

  static async getFormationsByCategory(categoryId: string) {
    try {
      // 1. Get formations that have this category_id directly
      const { data: directData, error: directError } = await supabase
        .from('formations')
        .select(`
          id, title, title_fr, title_ar, slug, image_url, cover_image_url, duration, rating, is_popular, is_active, created_at,
          category:categories(id, name, name_fr, name_ar, slug, color)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true);
      
      if (directError) throw directError;

      // 2. Get formations linked via formation_categories join table
      const { data: linkedData, error: linkedError } = await supabase
        .from('formation_categories')
        .select(`
          formation:formations(
            id, title, title_fr, title_ar, slug, image_url, cover_image_url, duration, rating, is_popular, is_active, created_at,
            category:categories(id, name, name_fr, name_ar, slug, color)
          )
        `)
        .eq('category_id', categoryId);

      if (linkedError) throw linkedError;

      // Combine results and remove duplicates
      const results = [...(directData || [])];
      
      if (linkedData) {
        linkedData.forEach((ld: any) => {
          const formation = ld.formation;
          if (formation && formation.is_active) {
            if (!results.find(r => r.id === formation.id)) {
              results.push(formation);
            }
          }
        });
      }

      // Sort by creation date (newest first)
      return results.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } catch (error) {
      console.error('Error in getFormationsByCategory:', error);
      throw error;
    }
  }

  static async getPopularFormations() {
    const { data, error } = await supabase
      .from('formations')
      .select(`
        id, title, title_fr, title_ar, slug, image_url, cover_image_url, duration, rating, is_popular, is_active,
        category:categories(id, name, name_fr, name_ar, slug, color)
      `)
      .eq('is_popular', true)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(6);
    
    if (error) throw error;
    return data;
  }

  static async getFormationBySlug(slug: string) {
    const { data, error } = await supabase
      .from('formations')
      .select(`
        *,
        category:categories(id, name, name_fr, name_ar, slug, color)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createFormation(formation: any) {
    const { data, error } = await supabase
      .from('formations')
      .insert([formation])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateFormation(id: string, updates: any) {
    const { data, error } = await supabase
      .from('formations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(*),
        trainer:users(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFormation(id: string) {
    // Delete formation categories first (CASCADE should handle this, but being explicit)
    await supabase
      .from('formation_categories')
      .delete()
      .eq('formation_id', id);
    
    const { error } = await supabase
      .from('formations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Formation Categories (Multiple categories support)
  static async addFormationCategory(formationId: string, categoryId: string) {
    const { data, error } = await supabase
      .from('formation_categories')
      .insert([{
        formation_id: formationId,
        category_id: categoryId
      }])
      .select(`
        *,
        category:categories(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async removeFormationCategory(formationId: string, categoryId: string) {
    const { error } = await supabase
      .from('formation_categories')
      .delete()
      .eq('formation_id', formationId)
      .eq('category_id', categoryId);
    
    if (error) throw error;
  }

  static async setFormationCategories(formationId: string, categoryIds: string[]) {
    try {
      // Delete existing categories first
      const { error: deleteError } = await supabase
        .from('formation_categories')
        .delete()
        .eq('formation_id', formationId);
      
      if (deleteError) {
        console.error('Error deleting existing categories:', deleteError);
        throw deleteError;
      }
      
      // Insert new categories (simplified select to avoid RLS issues)
      if (categoryIds.length > 0) {
        const { data, error } = await supabase
          .from('formation_categories')
          .insert(
            categoryIds.map(categoryId => ({
              formation_id: formationId,
              category_id: categoryId
            }))
          )
          .select('*'); // Simplified - no join to avoid RLS issues
        
        if (error) {
          console.error('Error inserting categories:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        return data;
      }
      
      return [];
    } catch (error: any) {
      console.error('setFormationCategories error:', error);
      throw error;
    }
  }

  static async getFormationCategories(formationId: string) {
    const { data, error } = await supabase
      .from('formation_categories')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('formation_id', formationId);
    
    if (error) throw error;
    return data?.map((fc: any) => fc.category).filter(Boolean) || [];
  }

  static async getAllFormationsForAdmin() {
    const { data, error } = await supabase
      .from('formations')
      .select(`
        *,
        category:categories!left(id, name, name_fr, slug, color),
        formation_categories(
          id,
          category:categories(id, name, name_fr, slug, color)
        ),
        users!left(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform data to include categories array
    return data?.map((formation: any) => ({
      ...formation,
      categories: formation.formation_categories?.map((fc: any) => fc.category).filter(Boolean) || [],
      // Keep single category for backward compatibility
      category: formation.category || (formation.formation_categories?.[0]?.category || null)
    })) || [];
  }

  // Blog Categories
  static async getBlogCategories() {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Blog Articles
  static async getBlogArticles(language?: 'fr' | 'ar') {
    let query = supabase
      .from('blog_articles')
      .select(`
        id, title, excerpt, slug, image_url, tags, language, is_featured, is_published, read_time, views, published_at, created_at,
        category:blog_categories(id, name, slug),
        author:users(id, full_name, avatar_url)
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getFeaturedBlogArticles(language?: 'fr' | 'ar') {
    let query = supabase
      .from('blog_articles')
      .select(`
        *,
        category:blog_categories(*),
        author:users(*)
      `)
      .eq('is_featured', true)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(2);

    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getBlogArticlesByCategory(categoryId: string, language?: 'fr' | 'ar') {
    let query = supabase
      .from('blog_articles')
      .select(`
        *,
        category:blog_categories(*),
        author:users(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .replace(/--+/g, '-');
  }

  static estimateReadTime(content: string) {
    const words = content ? content.trim().split(/\s+/).length : 0;
    return Math.max(3, Math.ceil(words / 180));
  }

  static async createBlogArticle(article: {
    title: string;
    content: string;
    excerpt?: string;
    slug?: string;
    image_url?: string;
    tags?: string[];
    category_id?: string;
    formation_id?: string;
    language: 'fr' | 'ar';
    is_featured?: boolean;
    is_published?: boolean;
    read_time?: number;
    author_id?: string;
    published_at?: string;
  }) {
    const now = new Date().toISOString();
    let slug = article.slug || this.slugify(article.title);
    const excerpt = article.excerpt || article.content.slice(0, 240);
    const read_time = article.read_time ?? this.estimateReadTime(article.content);

    // Check if article with same slug and language already exists
    // If exists, append timestamp to make it unique
    const { data: existingArticles, error: checkError } = await supabase
      .from('blog_articles')
      .select('id')
      .eq('slug', slug)
      .eq('language', article.language)
      .limit(1);

    // If article exists, append timestamp to make it unique
    if (existingArticles && existingArticles.length > 0) {
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      slug = `${slug}-${timestamp}`;
    }

    const payload = {
      ...article,
      slug,
      excerpt,
      read_time,
      views: 0,
      comments_count: 0,
      is_featured: article.is_featured ?? false,
      is_published: article.is_published ?? true,
      published_at: article.published_at || now,
      created_at: now,
      updated_at: now,
    };

    // Insert without select first to avoid schema cache issues
    const { data: insertData, error: insertError } = await supabase
      .from('blog_articles')
      .insert([payload])
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    // Then fetch the full record with relations
    const { data, error } = await supabase
      .from('blog_articles')
      .select(`
        *,
        category:blog_categories(*),
        author:users(*),
        formation:formations(*)
      `)
      .eq('id', insertData.id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateBlogArticle(id: string, updates: Partial<{
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    image_url: string;
    tags: string[];
    category_id?: string;
    formation_id?: string;
    language?: 'fr' | 'ar';
    is_featured?: boolean;
    is_published?: boolean;
    read_time?: number;
    author_id?: string;
    published_at?: string;
  }>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('blog_articles')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        category:blog_categories(*),
        author:users(*),
        formation:formations(id, title, title_fr, title_ar, slug)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getBlogArticleBySlug(slug: string) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select(`
        *,
        category:blog_categories(*),
        author:users(*)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get all blog articles for admin (including unpublished)
  static async getAllBlogArticlesForAdmin(language?: 'fr' | 'ar') {
    let query = supabase
      .from('blog_articles')
      .select(`
        *,
        category:blog_categories(*),
        author:users(*),
        formation:formations(id, title, title_fr, title_ar, slug)
      `)
      .order('created_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  // Delete blog article
  static async deleteBlogArticle(id: string) {
    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Client References
  static async getClientReferences() {
    const { data, error } = await supabase
      .from('client_references')
      .select('*')
      .order('project_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getFeaturedClientReferences() {
    const { data, error } = await supabase
      .from('client_references')
      .select('*')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(6);
    
    if (error) throw error;
    return data;
  }

  // Gallery
  static async getGalleryImages(category?: string) {
    let query = supabase
      .from('gallery')
      .select('*')
      .eq('status', 'active')
      .order('upload_date', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getTrainerImages() {
    return this.getGalleryImages('trainers');
  }

  static async addGalleryImage(image: { title: string; url: string; category: string; status: string }) {
    const { data, error } = await supabase
      .from('gallery')
      .insert([{
        ...image,
        upload_date: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteGalleryImage(id: string) {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  static async updateGalleryImage(id: string, updates: { title?: string; category?: string; status?: string }) {
    const { data, error } = await supabase
      .from('gallery')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Consultations
  static async createConsultation(consultation: any) {
    const { data, error } = await supabase
      .from('consultations')
      .insert([consultation])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getConsultations() {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Contact Messages
  static async createContactMessage(message: any) {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getContactMessages() {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Newsletter
  static async subscribeToNewsletter(email: string, source = 'website') {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, source }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getNewsletterSubscribers() {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('status', 'active')
      .order('subscribed_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Site Settings
  static async getSiteSettings(includePrivate: boolean = false) {
    let query = supabase
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });
    
    if (!includePrivate) {
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getSiteSetting(key: string) {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .eq('is_public', true)
      .single();
    
    if (error) throw error;
    return data?.value;
  }

  static async createSiteSetting(setting: {
    key: string;
    value?: string;
    description?: string;
    type: 'text' | 'number' | 'boolean' | 'json' | 'url' | 'email';
    is_public?: boolean;
  }) {
    const { data, error } = await supabase
      .from('site_settings')
      .insert([{
        ...setting,
        is_public: setting.is_public ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  }

  static async updateSiteSetting(id: string, updates: {
    key?: string;
    value?: string;
    description?: string;
    type?: 'text' | 'number' | 'boolean' | 'json' | 'url' | 'email';
    is_public?: boolean;
  }) {
    const { data, error } = await supabase
      .from('site_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('No setting found or updated for ID:', id);
      return null;
    }
    return data[0];
  }

  static async deleteSiteSetting(id: string) {
    const { error } = await supabase
      .from('site_settings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Statistics
  static async getStatistics(includeHidden: boolean = false) {
    let query = supabase
      .from('statistics')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async createStatistic(statistic: {
    key: string;
    value: string;
    label_fr: string;
    label_ar?: string;
    icon_name?: string;
    is_visible?: boolean;
    display_order?: number;
  }) {
    const { data, error } = await supabase
      .from('statistics')
      .insert([{
        ...statistic,
        is_visible: statistic.is_visible ?? true,
        display_order: statistic.display_order ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data;
  }

  static async updateStatistic(id: string, updates: {
    key?: string;
    value?: string;
    label_fr?: string;
    label_ar?: string;
    icon_name?: string;
    is_visible?: boolean;
    display_order?: number;
  }) {
    const { data, error } = await supabase
      .from('statistics')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }

  static async deleteStatistic(id: string) {
    const { error } = await supabase
      .from('statistics')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async updateStatisticOrder(id: string, newOrder: number) {
    const { data, error } = await supabase
      .from('statistics')
      .update({
        display_order: newOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }

  static async toggleStatisticVisibility(id: string, isVisible: boolean) {
    const { data, error } = await supabase
      .from('statistics')
      .update({
        is_visible: isVisible,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }

  // Analytics
  static async trackPageView(pageData: any) {
    const { data, error } = await supabase
      .from('analytics')
      .insert([{
        page_path: pageData.path,
        user_agent: pageData.userAgent,
        referrer: pageData.referrer,
        session_id: pageData.sessionId,
        event_type: 'page_view'
      }]);
    
    if (error) console.error('Analytics tracking error:', error);
    return data;
  }

  static async trackEvent(eventData: any) {
    const { data, error } = await supabase
      .from('analytics')
      .insert([eventData]);
    
    if (error) console.error('Event tracking error:', error);
    return data;
  }

  // Storage
  static async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    return data;
  }

  static async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  static async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }

  // Enrollments
  static async createEnrollment(enrollment: any) {
    console.log('💾 Tentative de sauvegarde dans Supabase:', enrollment);
    
    // First, try simple insert without select to avoid RLS recursion
    const { error: insertError } = await supabase
      .from('enrollments')
      .insert([enrollment]);
    
    if (insertError) {
      console.error('❌ Erreur Supabase lors de l\'insertion:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
      throw insertError;
    }
    
    console.log('✅ Inscription sauvegardée avec succès (sans select)');
    
    // Return a simple success object
    return {
      id: 'saved',
      ...enrollment,
      created_at: new Date().toISOString()
    };
  }

  static async getEnrollments(filters?: {
    status?: string;
    source?: string;
    language?: string;
  }) {
    // Use simple select without joins to avoid RLS recursion
    let query = supabase
      .from('enrollments')
      .select('*')
      .order('enrollment_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.source) {
      query = query.eq('source', filters.source);
    }
    if (filters?.language) {
      query = query.eq('language_preference', filters.language);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Get formation details separately to avoid RLS recursion
    // Only if we have enrollments and need formation data
    if (data && data.length > 0) {
      // Try to get all unique formation IDs first
      const formationIds = [...new Set(data.map((e: any) => e.formation_id).filter(Boolean))];
      
      if (formationIds.length > 0) {
        try {
          // Get all formations in one query
          const { data: formationsData } = await supabase
            .from('formations')
            .select('id, title, slug, price, currency, title_fr, title_ar')
            .in('id', formationIds);
          
          // Create a map for quick lookup
          const formationsMap = new Map(
            (formationsData || []).map((f: any) => [f.id, f])
          );
          
          // Attach formation data to each enrollment
          return data.map((enrollment: any) => {
            if (enrollment.formation_id && formationsMap.has(enrollment.formation_id)) {
              enrollment.formation = formationsMap.get(enrollment.formation_id);
            }
            return enrollment;
          });
        } catch (err) {
          // If formations query fails due to RLS, return enrollments without formation data
          console.warn('Could not load formations due to RLS, returning enrollments without formation data:', err);
          return data;
        }
      }
    }
    
    return data || [];
  }

  static async updateEnrollmentStatus(id: string, updates: any) {
    const { data, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Scheduled Formations (Agenda)
  static async getScheduledFormations(startDate?: string, endDate?: string) {
    let query = supabase
      .from('scheduled_formations')
      .select(`
        *,
        formation:formations(*)
      `)
      .eq('is_active', true)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getUpcomingScheduledFormations(limit: number = 12) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('scheduled_formations')
      .select(`
        *,
        formation:formations(*)
      `)
      .eq('is_active', true)
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Company Events / Actualités
  static async getCompanyEvents(includeUnpublished: boolean = false) {
    let query = supabase
      .from('company_events')
      .select('*')
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createCompanyEvent(event: any) {
    const { data, error } = await supabase
      .from('company_events')
      .insert([{
        ...event,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateCompanyEvent(id: string, updates: any) {
    const { data, error } = await supabase
      .from('company_events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteCompanyEvent(id: string) {
    const { error } = await supabase
      .from('company_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  static async getCompanyEventById(id: string) {
    const { data, error } = await supabase
      .from('company_events')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  // Page Content Management
  static async getPageContent(pageKey: string) {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', pageKey)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      return data;
    } catch (err: any) {
      // Fallback to localStorage if table is missing (404) or other error
      console.warn(`Supabase page_content error, falling back to local storage:`, err);
      const localData = localStorage.getItem(`page_content_${pageKey}`);
      return localData ? { page_key: pageKey, content: JSON.parse(localData) } : null;
    }
  }

  static async updatePageContent(pageKey: string, content: any) {
    try {
      // Try to get existing first to decide between update and insert
      const { data: existing, error: checkError } = await supabase
        .from('page_content')
        .select('page_key')
        .eq('page_key', pageKey)
        .single();

      if (checkError && checkError.code !== 'PGRST116' && checkError.status !== 404) {
        throw checkError;
      }

      let result;
      if (existing) {
        result = await supabase
          .from('page_content')
          .update({ 
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('page_key', pageKey)
          .select()
          .single();
      } else {
        result = await supabase
          .from('page_content')
          .insert([{
            page_key: pageKey,
            content: content
          }])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data;
    } catch (err: any) {
      console.error('Failed to update Supabase content, saving to local storage only:', err);
      // Save to localStorage as a fallback
      localStorage.setItem(`page_content_${pageKey}`, JSON.stringify(content));
      return { page_key: pageKey, content };
    }
  }

  // Chat Bot Messages
  static async saveChatMessage(message: { session_id: string; sender: 'user' | 'bot'; content: string; metadata?: any }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) {
      console.warn('Chat message saving failed (Table might not exist):', error.message);
      return null;
    }
    return data;
  }

  static async getChatHistory(sessionId?: string) {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    try {
      const { data, error } = await query;
      if (error) return [];
      return data;
    } catch {
      return [];
    }
  }

  static async getAllConversations() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('session_id, sender, content, created_at')
        .order('created_at', { ascending: false });
      
      if (error) return [];

      const sessionsMap = new Map();
      data.forEach(msg => {
        if (!sessionsMap.has(msg.session_id)) {
          sessionsMap.set(msg.session_id, msg);
        }
      });

      return Array.from(sessionsMap.values());
    } catch {
      return [];
    }
  }

  static async getKnowledgeBase() {
    try {
      const { data: formations } = await supabase
        .from('formations')
        .select('title_fr, description_fr, duration, price_ttc')
        .eq('is_active', true)
        .limit(30);

      if (!formations) return '';

      return formations.map(f => 
        `- ${f.title_fr}: ${f.description_fr?.slice(0, 150)}... (${f.duration || 'N/A'}, ${f.price_ttc || 'N/A'} DZD)`
      ).join('\n');
    } catch {
      return '';
    }
  }

  static async getChatStatus() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'chatbot_enabled')
        .maybeSingle();
      
      if (error || !data) return true; // Default to true
      return data.value === 'true';
    } catch {
      return true;
    }
  }

  static async setChatStatus(enabled: boolean) {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'chatbot_enabled',
          value: String(enabled),
          type: 'boolean',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting chat status:', error);
      return false;
    }
  }
}

