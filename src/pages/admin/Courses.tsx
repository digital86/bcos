import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  Filter,
  MoreHorizontal,
  Clock,
  Star,
  MapPin,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCategories } from '@/hooks/useSupabase';
import { SupabaseService } from '@/lib/supabase';
import CourseForm from '@/components/admin/CourseForm';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Formation } from '../../../supabase-config';

const Courses = () => {
  const [courses, setCourses] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Formation | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Formation | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { categories } = useCategories();

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getAllFormationsForAdmin();
        setCourses(data || []);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [refreshTrigger]);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category?.slug === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && course.is_active) ||
                         (selectedStatus === 'inactive' && !course.is_active) ||
                         (selectedStatus === 'popular' && course.is_popular);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const handleEditCourse = (course: Formation) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;

    try {
      await SupabaseService.deleteFormation(deletingCourse.id);
      setRefreshTrigger(prev => prev + 1);
      setDeletingCourse(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Erreur lors de la suppression du cours');
    }
  };

  const handleSaveCourse = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const getCategoryColor = (categorySlug?: string) => {
    switch (categorySlug) {
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'finance': return 'bg-yellow-100 text-yellow-800';
      case 'logistique': return 'bg-purple-100 text-purple-800';
      case 'rh': return 'bg-pink-100 text-pink-800';
      case 'digital': return 'bg-indigo-100 text-indigo-800';
      case 'soft-skills': return 'bg-orange-100 text-orange-800';
      case 'qualite': return 'bg-emerald-100 text-emerald-800';
      case 'securite': return 'bg-red-100 text-red-800';
      case 'communication': return 'bg-violet-100 text-violet-800';
      case 'innovation': return 'bg-amber-100 text-amber-800';
      case 'gestion-projet': return 'bg-sky-100 text-sky-800';
      case 'developpement-personnel': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    // Convert DA to DZD (Algerian Dinar ISO 4217 code)
    const currencyCode = currency === 'DA' ? 'DZD' : currency;
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode
      }).format(price);
    } catch (error) {
      // Fallback: just show number with currency text
      return `${price.toLocaleString('fr-FR')} ${currency}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Cours</h1>
            <p className="text-gray-600 mt-1">Créez et gérez les formations</p>
          </div>
          <div className="flex-shrink-0">
            <Button 
              onClick={handleCreateCourse}
              className="bg-accent hover:bg-accent/90 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Cours
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cours</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cours Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Populaires</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_popular).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + (c.current_participants || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Cours</CardTitle>
            <CardDescription>Gérez tous vos cours de formation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher des cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="popular">Populaires</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Chargement des cours...</span>
              </div>
            ) : (
              <>
                {/* Courses Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                      <CardHeader className="flex-shrink-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className={getCategoryColor(course.category?.slug)} variant="secondary">
                            {course.category?.name || 'Sans catégorie'}
                          </Badge>
                          <div className="flex gap-1">
                            {course.is_popular && (
                              <Badge className="bg-red-100 text-red-800" variant="secondary">
                                <Star className="w-3 h-3 mr-1" />
                                Populaire
                              </Badge>
                            )}
                            <Badge 
                              className={course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} 
                              variant="secondary"
                            >
                              {course.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col">
                        {course.image_url && (
                          <img 
                            src={course.image_url} 
                            alt={course.title}
                            className="w-full h-32 object-cover rounded-md mb-4"
                          />
                        )}
                        
                        <div className="space-y-3 flex-1">
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{course.current_participants || 0}/{course.max_participants}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span>{formatPrice(course.price, course.currency)}</span>
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-2" />
                              <span>{course.level}</span>
                            </div>
                          </div>

                          {course.start_date && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>Début: {formatDate(course.start_date)}</span>
                            </div>
                          )}

                          {course.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="truncate">{course.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between mt-auto">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/formation/${course.slug}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingCourse(course)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun cours trouvé</p>
                    <p className="text-gray-400">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Course Form Dialog */}
        <CourseForm
          course={editingCourse}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCourse(null);
          }}
          onSave={handleSaveCourse}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le cours "{deletingCourse?.title}" ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCourse}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Courses;