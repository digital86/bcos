import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useFormations } from '@/hooks/useSupabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  MapPin,
  Users,
  Upload,
  FileJson,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { Formation } from '../../../supabase-config';
import { AIService, type AgendaImportData } from '@/lib/aiService';
import { Textarea } from '@/components/ui/textarea';

interface FormationSuggestion {
  id: string;
  title: string;
  score: number;
}

interface MappingItem {
  index: number;
  original: AgendaImportData['scheduled_formations'][0];
  status: 'exact' | 'fuzzy' | 'not_found';
  selectedFormationId: string | 'new' | 'skip' | 'fuzzy_unresolved';
  suggestions: FormationSuggestion[];
}

interface ScheduledFormation {
  id: string;
  formation_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  location?: string;
  is_online: boolean;
  max_participants?: number;
  current_participants: number;
  is_active: boolean;
  notes?: string;
  formation?: Formation;
}

const AgendaManagement = () => {
  const { formations } = useFormations();
  const [scheduledFormations, setScheduledFormations] = useState<ScheduledFormation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAIAnalyzeOpen, setIsAIAnalyzeOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledFormation | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduledFormation | null>(null);
  const [importJson, setImportJson] = useState('');
  const [importImage, setImportImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [mappingItems, setMappingItems] = useState<MappingItem[]>([]);
  
  const [formData, setFormData] = useState({
    formation_id: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    end_time: '17:00',
    location: '',
    is_online: false,
    max_participants: '',
    notes: '',
  });

  useEffect(() => {
    loadScheduledFormations();
  }, [currentMonth]);

  const loadScheduledFormations = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('scheduled_formations')
        .select(`
          *,
          formation:formations(*)
        `)
        .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
        .lte('scheduled_date', endOfMonth.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          toast.error(
            'Le tableau scheduled_formations n\'existe pas. Veuillez exécuter la migration SQL dans Supabase.',
            { duration: 10000 }
          );
          console.error('Migration required! Please run: migrations/007_create_scheduled_formations.sql');
          return;
        }
        throw error;
      }
      setScheduledFormations(data || []);
    } catch (error: any) {
      console.error('Error loading scheduled formations:', error);
      toast.error(
        error.message || 'Erreur lors du chargement des formations programmées',
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    const today = new Date();
    setFormData({
      formation_id: '',
      scheduled_date: today.toISOString().split('T')[0],
      scheduled_time: '09:00',
      end_time: '17:00',
      location: '',
      is_online: false,
      max_participants: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduledFormation) => {
    setEditingSchedule(schedule);
    setFormData({
      formation_id: schedule.formation_id,
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time || '09:00',
      end_time: schedule.end_time || '17:00',
      location: schedule.location || '',
      is_online: schedule.is_online || false,
      max_participants: schedule.max_participants?.toString() || '',
      notes: schedule.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleDeleteSchedule = (schedule: ScheduledFormation) => {
    setDeletingSchedule(schedule);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const scheduleData = {
        formation_id: formData.formation_id,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        end_time: formData.end_time,
        location: formData.location || null,
        is_online: formData.is_online,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        notes: formData.notes || null,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('scheduled_formations')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success('Formation programmée mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('scheduled_formations')
          .insert([scheduleData]);

        if (error) throw error;
        toast.success('Formation programmée créée avec succès');
      }

      setIsFormOpen(false);
      loadScheduledFormations();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSchedule) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('scheduled_formations')
        .delete()
        .eq('id', deletingSchedule.id);

      if (error) throw error;
      toast.success('Formation programmée supprimée avec succès');
      setIsDeleteOpen(false);
      loadScheduledFormations();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getScheduledForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledFormations.filter(s => s.scheduled_date === dateStr && s.is_active);
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Fuzzy matching function to find similar formations
  const findFormationByFuzzyMatch = (searchTitle: string): { id: string; title: string; score: number } | null => {
    if (!searchTitle || !formations.length) return null;

    const normalize = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };

    const getWords = (str: string): string[] => {
      return normalize(str).split(/\s+/).filter(w => w.length > 2);
    };

    const calculateSimilarity = (str1: string, str2: string): number => {
      const normalized1 = normalize(str1);
      const normalized2 = normalize(str2);

      // Exact match
      if (normalized1 === normalized2) return 1.0;

      // Contains match
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.8;
      }

      // Word-based matching
      const words1 = getWords(normalized1);
      const words2 = getWords(normalized2);
      
      if (words1.length === 0 || words2.length === 0) return 0;

      // Count matching words
      const matchingWords = words1.filter(w1 => 
        words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
      );

      const wordScore = matchingWords.length / Math.max(words1.length, words2.length);

      // Levenshtein-like similarity for remaining characters
      const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
      const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
      const editDistance = calculateEditDistance(longer, shorter);
      const charScore = 1 - (editDistance / longer.length);

      // Combine scores (weight words more)
      return (wordScore * 0.7) + (charScore * 0.3);
    };

    const calculateEditDistance = (str1: string, str2: string): number => {
      const matrix: number[][] = [];
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[str2.length][str1.length];
    };

    // Search in all title fields
    const matches = formations.map(formation => {
      const titles = [
        formation.title_fr,
        formation.title_ar,
        formation.title,
        formation.slug
      ].filter(Boolean) as string[];

      let bestScore = 0;
      for (const title of titles) {
        const score = calculateSimilarity(searchTitle, title);
        if (score > bestScore) {
          bestScore = score;
        }
      }

      return {
        id: formation.id,
        title: formation.title_fr || formation.title || '',
        score: bestScore
      };
    });

    // Sort by score and return best match if score > 0.4
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches[0];

    if (bestMatch && bestMatch.score >= 0.4) {
      return bestMatch;
    }

    return null;
  };

  const getFormationSuggestions = (searchTitle: string): FormationSuggestion[] => {
    if (!searchTitle || !formations.length) return [];
    
    const normalize = (str: string): string => {
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    };
    const getWords = (str: string): string[] => normalize(str).split(/\s+/).filter(w => w.length > 2);

    const calculateSimilarity = (str1: string, str2: string): number => {
      const norm1 = normalize(str1); const norm2 = normalize(str2);
      if (norm1 === norm2) return 1.0;
      if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
      const w1 = getWords(norm1); const w2 = getWords(norm2);
      if (w1.length === 0 || w2.length === 0) return 0;
      const matchingWords = w1.filter(word1 => w2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1)));
      return matchingWords.length / Math.max(w1.length, w2.length); 
    };

    const matches = formations.map(formation => {
      const titles = [formation.title_fr, formation.title_ar, formation.title, formation.slug].filter(Boolean) as string[];
      let bestScore = 0;
      for (const title of titles) {
        const score = calculateSimilarity(searchTitle, title);
        if (score > bestScore) bestScore = score;
      }
      return { id: formation.id, title: formation.title_fr || formation.title || '', score: bestScore };
    });

    matches.sort((a, b) => b.score - a.score);
    return matches.filter(m => m.score > 0.2).slice(0, 5);
  };

  const handleImportJson = async () => {
    try {
      if (!importJson.trim()) {
        toast.error('Veuillez coller le JSON à importer');
        return;
      }

      const data: AgendaImportData = JSON.parse(importJson);
      
      if (!data.scheduled_formations || !Array.isArray(data.scheduled_formations)) {
        toast.error('Format JSON invalide. Vérifiez le format.');
        return;
      }

      const mappedItems: MappingItem[] = data.scheduled_formations.map((item, idx) => {
        let exactId = '';
        if (item.formation_slug) {
          const f = formations.find(f => f.slug === item.formation_slug);
          if (f) exactId = f.id;
        }

        let suggestions: FormationSuggestion[] = [];
        if (!exactId && item.formation_title) {
          suggestions = getFormationSuggestions(item.formation_title);
        }

        let status: 'exact' | 'fuzzy' | 'not_found' = 'not_found';
        let selected: string = 'skip';

        if (exactId) {
          status = 'exact';
          selected = exactId;
        } else if (suggestions.length > 0 && suggestions[0].score > 0.8) {
          status = 'exact';
          selected = suggestions[0].id;
        } else if (suggestions.length > 0 && suggestions[0].score > 0.4) {
          status = 'fuzzy';
          selected = 'fuzzy_unresolved';
        } else {
          status = 'not_found';
          selected = 'new';
        }

        return {
          index: idx,
          original: item,
          status,
          selectedFormationId: selected,
          suggestions
        };
      });

      setMappingItems(mappedItems);
      setIsImportOpen(false);
      setIsMappingOpen(true);
    } catch (error: any) {
      console.error('Error importing JSON:', error);
      toast.error(`Erreur lors de l'import: ${error.message || 'Format JSON invalide'}`);
    }
  };

  const handleConfirmMapping = async () => {
    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const item of mappingItems) {
        if (item.selectedFormationId === 'skip' || item.selectedFormationId === 'fuzzy_unresolved') {
          continue;
        }

        let finalFormationId = item.selectedFormationId;

        if (finalFormationId === 'new') {
          const slug = item.original.formation_title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          const { data: newCourse, error: createError } = await supabase
            .from('formations')
            .insert({
              title_fr: item.original.formation_title,
              title: item.original.formation_title,
              slug: slug + '-' + Date.now().toString().substring(8),
              description: 'À compléter',
              description_fr: 'À compléter',
              duration: 'À définir',
              is_published: false,
              is_active: false,
            })
            .select()
            .single();

          if (createError) {
             console.error("Error creating new formation:", createError);
             errorCount++;
             continue;
          }
          finalFormationId = newCourse.id;
        }

        const { error: scheduleError } = await supabase
          .from('scheduled_formations')
          .insert({
              formation_id: finalFormationId,
              scheduled_date: item.original.scheduled_date,
              scheduled_time: item.original.scheduled_time || '09:00',
              end_time: item.original.end_time || '17:00',
              location: item.original.location || null,
              is_online: item.original.is_online || false,
              max_participants: item.original.max_participants || null,
              notes: item.original.notes || null,
              is_active: true,
          });

        if (scheduleError) {
          console.error("Error scheduling:", scheduleError);
          errorCount++;
        } else {
          successCount++;
        }
      }
      
      toast.success(`${successCount} formation(s) importée(s) avec succès`);
      if (errorCount > 0) toast.error(`${errorCount} erreur(s) lors de l'import`);

      setIsMappingOpen(false);
      setImportJson('');
      loadScheduledFormations();
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!importImage) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    try {
      setIsAnalyzing(true);
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const base64 = await AIService.imageToBase64(importImage);
      const result = await AIService.analyzeAgendaImage(base64, month, year);
      
      // Set the JSON result in import dialog
      setImportJson(JSON.stringify(result, null, 2));
      setIsAIAnalyzeOpen(false);
      setIsImportOpen(true);
      toast.success('Image analysée avec succès ! Vérifiez et confirmez l\'import.');
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      toast.error(`Erreur lors de l'analyse: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const days = getDaysInMonth();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion de l'Agenda</h1>
            <p className="text-gray-600 mt-1">Planifiez les formations par mois</p>
          </div>
          <div className="flex-shrink-0 flex gap-2 flex-wrap">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImportOpen(true)}>
              <FileJson className="w-4 h-4 mr-2" />
              Importer JSON
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAIAnalyzeOpen(true)}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Analyser Image (AI)
            </Button>
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={handleCreateSchedule}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une formation
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-xl">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </CardTitle>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                Aujourd'hui
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {dayNames.map(day => (
                  <div key={day} className="text-center font-semibold text-gray-700 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                  const scheduled = getScheduledForDay(day || 0);
                  const isToday = day && 
                    new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] border rounded-lg p-2
                        ${day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {scheduled.slice(0, 2).map(schedule => (
                              <div
                                key={schedule.id}
                                className="text-xs bg-primary/10 text-primary p-1 rounded cursor-pointer hover:bg-primary/20"
                                onClick={() => handleEditSchedule(schedule)}
                              >
                                <div className="font-medium truncate">
                                  {schedule.formation?.title_fr || schedule.formation?.title || 'Formation'}
                                </div>
                                <div className="text-primary/70">
                                  {schedule.scheduled_time} - {schedule.end_time}
                                </div>
                              </div>
                            ))}
                            {scheduled.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{scheduled.length - 2} autres
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* List View */}
        <Card>
          <CardHeader>
            <CardTitle>Formations programmées - {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</CardTitle>
            <CardDescription>Liste de toutes les formations programmées ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : scheduledFormations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune formation programmée ce mois</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledFormations.map(schedule => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {schedule.formation?.title_fr || schedule.formation?.title || 'Formation'}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(schedule.scheduled_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {schedule.scheduled_time} - {schedule.end_time}
                        </div>
                        {schedule.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {schedule.location}
                          </div>
                        )}
                        {schedule.is_online && (
                          <Badge variant="secondary">En ligne</Badge>
                        )}
                        {schedule.max_participants && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {schedule.current_participants || 0}/{schedule.max_participants}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditSchedule(schedule)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteSchedule(schedule)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Modifier la formation programmée' : 'Ajouter une formation programmée'}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule ? 'Modifiez les détails de la formation programmée' : 'Planifiez une nouvelle formation'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="formation_id">Formation *</Label>
                <Select
                  value={formData.formation_id}
                  onValueChange={(value) => setFormData({ ...formData, formation_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {formations.map(formation => (
                      <SelectItem key={formation.id} value={formation.id}>
                        {formation.title_fr || formation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Heure de début *</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="end_time">Heure de fin *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">Participants max</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Lieu de la formation"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_online"
                  checked={formData.is_online}
                  onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_online">Formation en ligne</Label>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !formData.formation_id || !formData.scheduled_date}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingSchedule ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La formation programmée sera supprimée définitivement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import JSON Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importer depuis JSON</DialogTitle>
              <DialogDescription>
                Collez le JSON contenant les formations programmées. Format attendu:
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{`{
  "month": 12,
  "year": 2025,
  "scheduled_formations": [
    {
      "formation_title": "Titre de la formation",
      "formation_slug": "slug-formation",
      "scheduled_date": "2025-12-15",
      "scheduled_time": "09:00",
      "end_time": "17:00",
      "location": "Lieu",
      "is_online": false,
      "max_participants": 20
    }
  ]
}`}
              </pre>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="json-input">JSON à importer</Label>
                <Textarea
                  id="json-input"
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Collez le JSON ici..."
                  className="font-mono text-sm min-h-[300px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setImportJson('');
                setIsImportOpen(false);
              }}>
                Annuler
              </Button>
              <Button onClick={handleImportJson} disabled={loading || !importJson.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  'Importer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Image Analysis Dialog */}
        <Dialog open={isAIAnalyzeOpen} onOpenChange={setIsAIAnalyzeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Analyser Image avec AI</DialogTitle>
              <DialogDescription>
                Téléchargez une image de l'agenda (calendrier) et l'IA extraira automatiquement les formations programmées.
                Mois analysé: {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-input">Image de l'agenda</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImportImage(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {importImage && (
                    <span className="text-sm text-gray-600">{importImage.name}</span>
                  )}
                </div>
                {importImage && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(importImage)}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setImportImage(null);
                setIsAIAnalyzeOpen(false);
              }}>
                Annuler
              </Button>
              <Button onClick={handleAnalyzeImage} disabled={isAnalyzing || !importImage}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Mapping Dialog (Programme Analyzer) */}
        <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analyseur de Programme - Validation</DialogTitle>
              <DialogDescription>
                Certaines formations n'ont pas de correspondance exacte. Veuillez les associer ou les créer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {mappingItems.map((item, idx) => (
                <div key={idx} className={`border p-4 rounded-lg flex flex-col md:flex-row md:items-center gap-4 ${item.selectedFormationId === 'fuzzy_unresolved' ? 'border-amber-300 bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" title={item.original.formation_title}>
                      {item.original.formation_title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.original.scheduled_date} à {item.original.scheduled_time}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[250px]">
                    <Select
                      value={item.selectedFormationId}
                      onValueChange={(val) => {
                        const newItems = [...mappingItems];
                        newItems[idx].selectedFormationId = val;
                        setMappingItems(newItems);
                      }}
                    >
                      <SelectTrigger className={
                        item.selectedFormationId === 'fuzzy_unresolved' ? 'border-amber-500 bg-white' : 
                        item.selectedFormationId === 'skip' ? 'border-gray-300 bg-white' : 'border-green-500 bg-white'
                      }>
                        <SelectValue placeholder="Sélectionner une action..." />
                      </SelectTrigger>
                      <SelectContent>
                        {item.status === 'fuzzy' && <SelectItem value="fuzzy_unresolved" disabled>⚠️ À Vérifier</SelectItem>}
                        <SelectItem value="skip">Ignorer</SelectItem>
                        <SelectItem value="new">Créer comme Nouvelle Formation</SelectItem>
                        {item.suggestions.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            Associer: {s.title} ({(s.score * 100).toFixed(0)}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-8 flex justify-center flex-shrink-0">
                    {item.selectedFormationId === 'skip' ? (
                      <Trash2 className="w-5 h-5 text-gray-400" />
                    ) : item.selectedFormationId === 'new' ? (
                      <Plus className="w-5 h-5 text-blue-500" />
                    ) : item.selectedFormationId === 'fuzzy_unresolved' ? (
                      <HelpCircle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsMappingOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleConfirmMapping} disabled={loading || mappingItems.some(i => i.selectedFormationId === 'fuzzy_unresolved')}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirmer l'importation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AgendaManagement;

