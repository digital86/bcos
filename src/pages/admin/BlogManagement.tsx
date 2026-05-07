import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  Tag,
  Languages,
  Loader2,
  ExternalLink,
  FileText
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SupabaseService } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import type { BlogArticle } from '../../../supabase-config';

const BlogManagement = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'fr' | 'ar'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<BlogArticle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    slug: '',
    image_url: '',
    tags: [] as string[],
    is_published: false,
    is_featured: false,
    language: 'fr' as 'fr' | 'ar'
  });

  // Load articles
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getAllBlogArticlesForAdmin();
        setArticles(data || []);
      } catch (error) {
        console.error('Error loading articles:', error);
        toast.error('Erreur lors du chargement des articles');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [refreshTrigger]);

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = selectedLanguage === 'all' || article.language === selectedLanguage;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'published' && article.is_published) ||
                         (selectedStatus === 'draft' && !article.is_published);
    return matchesSearch && matchesLanguage && matchesStatus;
  });

  const handleEdit = (article: BlogArticle) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content || '',
      slug: article.slug,
      image_url: article.image_url || '',
      tags: article.tags || [],
      is_published: article.is_published,
      is_featured: article.is_featured,
      language: article.language || 'fr'
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingArticle) return;

    if (!editForm.title || !editForm.content) {
      toast.error('Le titre et le contenu sont obligatoires');
      return;
    }

    try {
      await SupabaseService.updateBlogArticle(editingArticle.id, {
        title: editForm.title,
        excerpt: editForm.excerpt,
        content: editForm.content,
        slug: editForm.slug,
        image_url: editForm.image_url,
        tags: editForm.tags,
        is_published: editForm.is_published,
        is_featured: editForm.is_featured,
        language: editForm.language
      });

      toast.success('Article mis à jour avec succès');
      setIsEditDialogOpen(false);
      setEditingArticle(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Error updating article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;

    try {
      await SupabaseService.deleteBlogArticle(deletingArticle.id);
      toast.success('Article supprimé avec succès');
      setDeletingArticle(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Error deleting article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case 'fr': return 'FR';
      case 'ar': return 'AR';
      default: return 'FR';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Gestion des Articles de Blog
            </h1>
            <p className="text-gray-600 mt-1">Gérez vos articles de blog en français et en arabe</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Articles</p>
                  <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Publiés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {articles.filter(a => a.is_published).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Languages className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Français</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {articles.filter(a => a.language === 'fr').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Languages className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Arabe</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {articles.filter(a => a.language === 'ar').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as 'all' | 'fr' | 'ar')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les langues</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">Arabe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as 'all' | 'published' | 'draft')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="published">Publiés</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun article trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {article.title}
                            </h3>
                            <Badge variant={article.language === 'ar' ? 'secondary' : 'default'}>
                              {getLanguageLabel(article.language)}
                            </Badge>
                            {article.is_featured && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                À la une
                              </Badge>
                            )}
                            {article.is_published ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Publié
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                Brouillon
                              </Badge>
                            )}
                          </div>
                          {article.excerpt && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(article.published_at || article.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.read_time} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {article.views} vues
                            </div>
                            {article.category && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {article.category.name}
                              </div>
                            )}
                            {article.formation && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Formation liée
                              </div>
                            )}
                          </div>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {article.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {article.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{article.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `/${article.language || 'fr'}/blog/${article.slug}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingArticle(article)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'article</DialogTitle>
              <DialogDescription>
                Modifiez les détails de l'article de blog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select
                    value={editForm.language}
                    onValueChange={(v) => setEditForm({ ...editForm, language: v as 'fr' | 'ar' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ar">Arabe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    placeholder="article-slug"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Titre de l'article"
                />
              </div>
              <div className="space-y-2">
                <Label>Extrait</Label>
                <Textarea
                  value={editForm.excerpt}
                  onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                  placeholder="Résumé de l'article"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu *</Label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Contenu de l'article (HTML)"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>URL de l'image</Label>
                <Input
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (séparés par des virgules)</Label>
                <Input
                  value={editForm.tags.join(', ')}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                  })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={editForm.is_published}
                    onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_published">Publié</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={editForm.is_featured}
                    onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_featured">À la une</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingArticle} onOpenChange={(open) => !open && setDeletingArticle(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'article "{deletingArticle?.title}" ? Cette action est irréversible.
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
      </div>
    </AdminLayout>
  );
};

export default BlogManagement;

