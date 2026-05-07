import { supabase } from './supabaseClient';

export class SimpleSupabaseService {
  // Get all formations without complex joins
  static async getAllFormationsSimple() {
    try {
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching formations:', error);
      return null;
    }
  }

  // Create a new formation with minimal data
  static async createFormationSimple(formation: {
    title: string;
    content: string;
    slug: string;
    description?: string;
    category_id?: string;
    price?: number;
    duration?: string;
    level?: string;
    is_active?: boolean;
    is_popular?: boolean;
  }) {
    try {
      const formationData = {
        title: formation.title,
        content: formation.content,
        slug: formation.slug,
        description: formation.description || `Formation sur ${formation.title}`,
        category_id: formation.category_id || null,
        price: formation.price || 0,
        currency: 'EUR',
        duration: formation.duration || '1 jour',
        level: formation.level || 'Débutant',
        max_participants: 20,
        current_participants: 0,
        is_active: formation.is_active !== false,
        is_popular: formation.is_popular || false,
        is_online: false,
        location: 'À définir',
        objectives: ['Objectif 1', 'Objectif 2', 'Objectif 3'],
        prerequisites: 'Aucun prérequis',
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        trainer_id: null,
        start_date: null,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to insert formation:', formationData);
      
      const { data, error } = await supabase
        .from('formations')
        .insert([formationData])
        .select()
        .single();
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', error.message, error.code, error.details);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating formation:', error);
      throw error;
    }
  }

  // Get categories
  static async getCategoriesSimple() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Supabase categories error:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return null;
    }
  }

  // Delete formation
  static async deleteFormationSimple(id: string) {
    try {
      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting formation:', error);
      throw error;
    }
  }

  // Get formation by slug
  static async getFormationBySlugSimple(slug: string) {
    try {
      console.log('Searching for formation with slug:', slug);
      
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Supabase formation by slug error:', error);
        console.log('Error details:', error.message, error.code);
        return null;
      }
      
      console.log('Formation found:', data);
      
      // Get category separately if category_id exists
      if (data && data.category_id) {
        console.log('Loading category for formation:', data.category_id);
        
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', data.category_id)
          .single();
        
        if (categoryData) {
          console.log('Category loaded:', categoryData);
          data.category = categoryData;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching formation by slug:', error);
      return null;
    }
  }

  // Create enrollment
  // Create event request
  static async createEventRequest(eventRequest: any) {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .insert([{
          full_name: eventRequest.full_name,
          email: eventRequest.email,
          phone: eventRequest.phone,
          company: eventRequest.company,
          status: eventRequest.status || 'new',
          source: eventRequest.source || 'website',
          language_preference: eventRequest.language_preference || 'fr',
          request_type: eventRequest.request_type || 'event_organization',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase event request error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating event request:', error);
      throw error;
    }
  }

  static async createEnrollment(enrollment: any) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([enrollment])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase enrollment error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating enrollment:', error);
      throw error;
    }
  }

  // Get all enrollments for admin
  static async getAllEnrollments() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .order('enrollment_date', { ascending: false });
      
      if (error) {
        console.error('Supabase enrollments error:', error);
        return null;
      }
      
      // Get formation details separately to avoid RLS recursion
      const enrollmentsWithDetails = await Promise.all(
        (data || []).map(async (enrollment: any) => {
          // Get formation details
          if (enrollment.formation_id) {
            try {
              const { data: formationData } = await supabase
                .from('formations')
                .select('id, title, slug, price, currency, title_fr, title_ar')
                .eq('id', enrollment.formation_id)
                .single();
              
              if (formationData) {
                enrollment.formation = formationData;
              }
            } catch (err) {
              // If formation not found or RLS error, just skip it
              console.warn('Could not load formation for enrollment:', enrollment.id, err);
            }
          }
          
          return enrollment;
        })
      );
      
      return enrollmentsWithDetails;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return null;
    }
  }

  // Update enrollment status
  static async updateEnrollmentStatus(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Supabase update enrollment error:', error);
        throw error;
      }
      
      // Return first result if exists, or null if no rows updated
      if (data && data.length > 0) {
        return data[0];
      }
      
      // If no rows updated, it might be due to RLS or row doesn't exist
      console.warn('No rows updated for enrollment:', id);
      return null;
    } catch (error) {
      console.error('Error updating enrollment:', error);
      throw error;
    }
  }

  // Delete enrollment
  static async deleteEnrollment(id: string) {
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete enrollment error:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      throw error;
    }
  }
}

export default SimpleSupabaseService;
