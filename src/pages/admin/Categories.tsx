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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/components/admin/AdminLayout';
import { SupabaseService } from '@/lib/supabase';
import { useCategories } from '@/hooks/useSupabase';
import { AIService } from '@/lib/aiService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Loader2,
  Languages,
  Eye,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '../../../supabase-config';

const Categories = () => {
  const { categories: initialCategories, loading: categoriesLoading } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    name_fr: '',
    name_ar: '',
    slug: '',
    description: '',
    description_fr: '',
    description_ar: '',
    icon: '',
    color: '#3b82f6',
    display_order: 0,
  });

  useEffect(() => {
    if (initialCategories) {
      const sorted = [...initialCategories].sort((a, b) => 
        (a.display_order || 0) - (b.display_order || 0)
      );
      setCategories(sorted);
    }
  }, [initialCategories]);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      name_fr: '',
      name_ar: '',
      slug: '',
      description: '',
      description_fr: '',
      description_ar: '',
      icon: '',
      color: '#3b82f6',
      display_order: categories.length,
    });
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      name_fr: category.name_fr || category.name || '',
      name_ar: category.name_ar || '',
      slug: category.slug || '',
      description: category.description || '',
      description_fr: category.description_fr || category.description || '',
      description_ar: category.description_ar || '',
      icon: category.icon || '',
      color: category.color || '#3b82f6',
      display_order: category.display_order || 0,
    });
    setIsFormOpen(true);
  };

  const handleAIGenerate = async () => {
    if (!formData.name_fr.trim()) {
      toast.error('Veuillez entrer le nom en français d\'abord');
      return;
    }

    try {
      setIsAIGenerating(true);
      const details = await AIService.generateCategoryDetails(formData.name_fr);
      
      setFormData(prev => ({
        ...prev,
        name_ar: details.name_ar,
        slug: details.slug,
        icon: details.icon,
        description_fr: details.description_fr,
        description_ar: details.description_ar
      }));
      
      toast.success('Détails générés avec succès par l\'IA');
    } catch (error: any) {
      console.error('AI Generation error:', error);
      toast.error('Échec de la génération par l\'IA');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSaveCategory = async () => {
    try {
      setLoading(true);

      if (!formData.name_fr.trim() && !formData.name.trim()) {
        toast.error('Le nom français est requis');
        return;
      }

      const categoryData = {
        ...formData,
        name: formData.name_fr || formData.name,
        slug: formData.slug || generateSlug(formData.name_fr || formData.name),
        description: formData.description_fr || formData.description,
      };

      if (editingCategory) {
        await SupabaseService.updateCategory(editingCategory.id, categoryData);
        toast.success('Catégorie mise à jour avec succès');
      } else {
        await SupabaseService.createCategory(categoryData);
        toast.success('Catégorie créée avec succès');
      }

      setIsFormOpen(false);
      window.location.reload(); // Refresh to reload categories
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      setLoading(true);
      await SupabaseService.deleteCategory(deletingCategory.id);
      toast.success('Catégorie supprimée avec succès');
      setIsDeleteOpen(false);
      setDeletingCategory(null);
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    const [moved] = newCategories.splice(currentIndex, 1);
    newCategories.splice(newIndex, 0, moved);

    // Update display_order for all categories
    const updates = newCategories.map((cat, index) => ({
      id: cat.id,
      display_order: index,
    }));

    try {
      await SupabaseService.updateCategoryOrder(updates);
      setCategories(newCategories);
      toast.success('Ordre mis à jour');
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  if (categoriesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestion des Catégories / إدارة الفئات
            </h1>
            <p className="text-gray-600 mt-1">
              Créez et gérez les catégories de formations / أنشئ وأدر فئات التكوينات
            </p>
          </div>
          <Button onClick={handleCreateCategory} className="bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Catégorie / فئة جديدة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Catégories / قائمة الفئات</CardTitle>
            <CardDescription>
              {categories.length} catégorie(s) au total / {categories.length} فئة في المجموع
              {categories.filter(c => !c.name_ar).length > 0 && (
                <span className="ml-2 text-orange-600">
                  • {categories.filter(c => !c.name_ar).length} بدون ترجمة عربية
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Ordre</TableHead>
                  <TableHead>Nom / الاسم (FR/AR)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Couleur</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveCategory(category, 'up')}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        )}
                        {index < categories.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveCategory(category, 'down')}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <span>{category.name_fr || category.name}</span>
                          {!category.name_ar && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              <Languages className="w-3 h-3 mr-1" />
                              بدون ترجمة
                            </Badge>
                          )}
                        </div>
                        {category.name_ar ? (
                          <div className="text-sm text-gray-600 font-medium" dir="rtl">
                            {category.name_ar}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic" dir="rtl">
                            لا توجد ترجمة عربية
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <Badge style={{ backgroundColor: category.color, color: 'white' }}>
                          {category.color}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {category.description_fr || category.description ? (
                          <div className="text-sm text-gray-700">
                            {category.description_fr || category.description}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—Aucune description</span>
                        )}
                        {category.description_ar ? (
                          <div className="text-sm text-gray-600" dir="rtl">
                            {category.description_ar}
                          </div>
                        ) : (category.description_fr || category.description) ? (
                          <div className="text-xs text-orange-600 italic" dir="rtl">
                            بدون ترجمة عربية
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-200"
                          style={{ backgroundColor: category.color }}
                        />
                        <Badge style={{ backgroundColor: category.color, color: 'white' }}>
                          {category.color}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(category)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Modifier la Catégorie / تعديل الفئة' : 'Nouvelle Catégorie / فئة جديدة'}
              </DialogTitle>
              <DialogDescription>
                Créez ou modifiez une catégorie avec support bilingue (FR/AR)
                <br />
                أنشئ أو عدّل فئة مع دعم ثنائي اللغة (فرنسي/عربي)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-end p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                <Button 
                  onClick={handleAIGenerate} 
                  disabled={isAIGenerating || !formData.name_fr.trim()}
                  variant="outline"
                  className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-9"
                >
                  {isAIGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Générer avec l'IA / توليد بالذكاء الاصطناعي
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_fr">Nom (Français) *</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      name_fr: e.target.value,
                      name: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value),
                    }));
                  }}
                  placeholder="Nom de la catégorie"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_ar" className="flex items-center gap-2">
                  Nom (عربي) *
                  {!formData.name_ar && editingCategory && (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      <Languages className="w-3 h-3 mr-1" />
                      ترجمة مطلوبة
                    </Badge>
                  )}
                </Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="اسم الفئة بالعربية"
                  dir="rtl"
                  className={!formData.name_ar && editingCategory ? 'border-orange-300' : ''}
                />
                {!formData.name_ar && editingCategory && (
                  <p className="text-xs text-orange-600">يُنصح بإضافة الترجمة العربية</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="categorie-slug"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icône</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="icon-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_fr">Description (FR)</Label>
                <Input
                  id="description_fr"
                  value={formData.description_fr}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_fr: e.target.value }))}
                  placeholder="Description en français"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ar" className="flex items-center gap-2">
                  Description (عربي)
                  {formData.description_fr && !formData.description_ar && (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      <Languages className="w-3 h-3 mr-1" />
                      ترجمة مطلوبة
                    </Badge>
                  )}
                </Label>
                <Input
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="الوصف بالعربية"
                  dir="rtl"
                  className={formData.description_fr && !formData.description_ar ? 'border-orange-300' : ''}
                />
                {formData.description_fr && !formData.description_ar && (
                  <p className="text-xs text-orange-600">يُنصح بإضافة الترجمة العربية للوصف</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={loading}>
                Annuler / إلغاء
              </Button>
              <Button onClick={handleSaveCategory} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement... / جاري الحفظ...
                  </>
                ) : (
                  'Enregistrer / حفظ'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la catégorie ? / حذف الفئة؟</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la catégorie "{deletingCategory?.name_fr || deletingCategory?.name}" ?
                <br />
                هل أنت متأكد من حذف الفئة "{deletingCategory?.name_ar || deletingCategory?.name_fr || deletingCategory?.name}"؟
                <br />
                <strong>Cette action est irréversible. / هذا الإجراء لا يمكن التراجع عنه.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler / إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer / حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Categories;




