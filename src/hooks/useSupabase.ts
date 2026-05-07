import { useState, useEffect } from 'react';
import { SupabaseService } from '@/lib/supabase';
import type { 
  Formation, 
  Category, 
  BlogArticle, 
  BlogCategory, 
  ClientReference, 
  GalleryImage,
  User
} from '../../supabase-config';

// Hook for formations
export const useFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getFormations();
        setFormations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFormations();
  }, []);

  return { formations, loading, error };
};

// Hook for popular formations
export const usePopularFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularFormations = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getPopularFormations();
        setFormations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularFormations();
  }, []);

  return { formations, loading, error };
};

// Hook for formations by category
export const useFormationsByCategory = (categoryId?: string) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;

    const fetchFormationsByCategory = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getFormationsByCategory(categoryId);
        setFormations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFormationsByCategory();
  }, [categoryId]);

  return { formations, loading, error };
};

// Hook for categories
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getCategories();
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Hook for blog articles
export const useBlogArticles = (language?: 'fr' | 'ar') => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogArticles = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getBlogArticles(language);
        setArticles(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogArticles();
  }, [language]);

  return { articles, loading, error };
};

// Hook for featured blog articles
export const useFeaturedBlogArticles = (language?: 'fr' | 'ar') => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedBlogArticles = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getFeaturedBlogArticles(language);
        setArticles(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBlogArticles();
  }, [language]);

  return { articles, loading, error };
};

// Hook for blog categories
export const useBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogCategories = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getBlogCategories();
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogCategories();
  }, []);

  return { categories, loading, error };
};

// Hook for client references
export const useClientReferences = () => {
  const [references, setReferences] = useState<ClientReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientReferences = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getClientReferences();
        setReferences(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClientReferences();
  }, []);

  return { references, loading, error };
};

// Hook for featured client references
export const useFeaturedClientReferences = () => {
  const [references, setReferences] = useState<ClientReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedClientReferences = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getFeaturedClientReferences();
        setReferences(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedClientReferences();
  }, []);

  return { references, loading, error };
};

// Hook for gallery images
export const useGalleryImages = (category?: string) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getGalleryImages(category);
        setImages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [category]);

  return { images, loading, error };
};

// Hook for trainer images
export const useTrainerImages = () => {
  return useGalleryImages('trainers');
};

// Hook for scheduled formations (Agenda)
export const useScheduledFormations = (startDate?: string, endDate?: string) => {
  const [scheduledFormations, setScheduledFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduledFormations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await SupabaseService.getScheduledFormations(startDate, endDate);
        setScheduledFormations(data || []);
      } catch (err: any) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching scheduled formations:', err);
        // Don't show error if table doesn't exist - it's expected before migration
        if (err?.code === 'PGRST205' || errorMessage.includes('Could not find the table')) {
          console.warn('Table scheduled_formations does not exist. Migration required.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledFormations();
  }, [startDate, endDate]);

  return { scheduledFormations, loading, error };
};

// Hook for upcoming scheduled formations
export const useUpcomingScheduledFormations = (limit: number = 12) => {
  const [scheduledFormations, setScheduledFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getUpcomingScheduledFormations(limit);
        setScheduledFormations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, [limit]);

  return { scheduledFormations, loading, error };
};

// Hook for users
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getUsers();
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
};

// Hook for admin formations
export const useAdminFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getAllFormationsForAdmin();
        setFormations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFormations();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getAllFormationsForAdmin();
      setFormations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { formations, loading, error, refetch };
};

// Hook for newsletter subscription
export const useNewsletterSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subscribe = async (email: string, source = 'website') => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await SupabaseService.subscribeToNewsletter(email, source);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error, success };
};

// Hook for contact form submission
export const useContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitMessage = async (messageData: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await SupabaseService.createContactMessage(messageData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { submitMessage, loading, error, success };
};

// Hook for consultation form submission
export const useConsultationForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitConsultation = async (consultationData: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await SupabaseService.createConsultation(consultationData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { submitConsultation, loading, error, success };
};
