import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building,
  Star,
  Globe,
  Calendar,
  Users,
  Loader2,
  Save,
  X,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { ClientReference } from '../../../supabase-config';
import MediaPicker from '@/components/admin/MediaPicker';

const References = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [references, setReferences] = useState<ClientReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<ClientReference | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'quick' | 'full'>('quick');
  const [uploadingBatch, setUploadingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  
  // Quick add form data (simplified)
  const [quickAddData, setQuickAddData] = useState({
    company_name: '',
    logo_url: ''
  });
  
  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    category: '',
    description: '',
    website_url: '',
    links: [] as string[],
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    project_date: '',
    duration: '',
    participants: 0,
    rating: 5,
    status: 'completed' as 'completed' | 'in_progress' | 'planned',
    testimonial: '',
    is_featured: false
  });

  // Load references from Supabase
  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      setLoading(true);
      console.log('Loading references from Supabase...');
      
      const { data, error } = await supabase
        .from('client_references')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setReferences(data || []);
      console.log('References loaded:', data || []);
    } catch (error: any) {
      console.error('Error loading references:', error);
      toast.error('Erreur lors du chargement des références: ' + (error.message || 'Unknown error'));
      // Fallback to empty array if there's an error
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReference = () => {
    setEditingReference(null);
    setFormData({
      company_name: '',
      logo_url: '',
      category: '',
      description: '',
      website_url: '',
      links: [] as string[],
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      project_date: '',
      duration: '',
      participants: 0,
      rating: 5,
      status: 'completed',
      testimonial: '',
      is_featured: false
    });
    setIsFormOpen(true);
  };

  const handleEditReference = (reference: ClientReference) => {
    setEditingReference(reference);
    setFormData({
      company_name: reference.company_name,
      logo_url: reference.logo_url || '',
      category: reference.category,
      description: reference.description,
      website_url: reference.website_url || '',
      links: Array.isArray(reference.links) ? reference.links : [],
      contact_person: reference.contact_person || '',
      contact_email: reference.contact_email || '',
      contact_phone: reference.contact_phone || '',
      project_date: reference.project_date || '',
      duration: reference.duration || '',
      participants: reference.participants || 0,
      rating: reference.rating,
      status: reference.status,
      testimonial: reference.testimonial || '',
      is_featured: reference.is_featured
    });
    setIsFormOpen(true);
  };

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  const handleUpdateLink = (index: number, value: string) => {
    setFormData((prev) => {
      const nextLinks = [...prev.links];
      nextLinks[index] = value;
      return { ...prev, links: nextLinks };
    });
  };

  const handleRemoveLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, linkIndex) => linkIndex !== index)
    }));
  };

  const handleSaveReference = async () => {
    if (!formData.company_name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      return;
    }

    try {
      setSaving(true);

      const normalizedLinks = formData.links
        .map((link) => link.trim())
        .filter((link) => link.length > 0);
      
      const referenceData = {
        ...formData,
        links: normalizedLinks,
        updated_at: new Date().toISOString()
      };

      if (editingReference) {
        const { data, error } = await supabase
          .from('client_references')
          .update(referenceData)
          .eq('id', editingReference.id)
          .select();
        
        if (error) throw error;
        toast.success('Référence mise à jour avec succès');
      } else {
        const { data, error } = await supabase
          .from('client_references')
          .insert([{
            ...referenceData,
            created_at: new Date().toISOString()
          }])
          .select();
        
        if (error) throw error;
        toast.success('Référence créée avec succès');
      }

      setIsFormOpen(false);
      loadReferences();
    } catch (error: any) {
      console.error('Error saving reference:', error);
      toast.error('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReference = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette référence ?')) return;
    
    try {
      const { error } = await supabase
        .from('client_references')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Référence supprimée avec succès');
      loadReferences();
      setSelectedReferences(new Set());
    } catch (error: any) {
      console.error('Error deleting reference:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Bulk delete selected references
  const handleBulkDelete = async () => {
    if (selectedReferences.size === 0) {
      toast.error('Veuillez sélectionner au moins une référence à supprimer');
      return;
    }

    const count = selectedReferences.size;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} référence(s) ?`)) return;

    try {
      setDeleting(true);
      const ids = Array.from(selectedReferences);
      
      const { error } = await supabase
        .from('client_references')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      toast.success(`${count} référence(s) supprimée(s) avec succès`);
      setSelectedReferences(new Set());
      loadReferences();
    } catch (error: any) {
      console.error('Error bulk deleting references:', error);
      toast.error('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setDeleting(false);
    }
  };

  // Toggle reference selection
  const toggleReferenceSelection = (id: string) => {
    setSelectedReferences(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all visible references
  const handleSelectAll = () => {
    if (selectedReferences.size === filteredReferences.length) {
      setSelectedReferences(new Set());
    } else {
      setSelectedReferences(new Set(filteredReferences.map(ref => ref.id)));
    }
  };

  // Quick add reference by link (logo URL + company name only)
  const handleQuickAdd = async () => {
    if (!quickAddData.company_name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      return;
    }
    
    if (!quickAddData.logo_url.trim()) {
      toast.error('L\'URL du logo est requise');
      return;
    }

    // Validate URL format
    try {
      new URL(quickAddData.logo_url);
    } catch {
      toast.error('Veuillez entrer une URL valide pour le logo');
      return;
    }

    try {
      setSaving(true);
      
      const referenceData = {
        company_name: quickAddData.company_name.trim(),
        logo_url: quickAddData.logo_url.trim(),
        category: 'General',
        description: `Référence client: ${quickAddData.company_name.trim()}`,
        rating: 5,
        status: 'completed' as const,
        is_featured: true, // Make it featured so it shows in the public component
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to get the current user session first
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from('client_references')
        .insert([referenceData])
        .select();
      
      if (error) {
        // If RLS error, provide helpful message
        if (error.code === '42501' || error.message.includes('row-level security')) {
          toast.error('Erreur de permissions: Veuillez vous assurer que vous êtes connecté en tant qu\'administrateur. Les politiques de sécurité (RLS) peuvent bloquer cette opération.');
          console.error('RLS Error - User session:', session);
        }
        throw error;
      }
      
      toast.success('Référence ajoutée avec succès !');
      setIsQuickAddOpen(false);
      setQuickAddData({ company_name: '', logo_url: '' });
      loadReferences();
    } catch (error: any) {
      console.error('Error adding quick reference:', error);
      if (error.code !== '42501') {
        toast.error('Erreur lors de l\'ajout: ' + (error.message || 'Erreur inconnue'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadingBatch(true);
    setBatchProgress(0);
    setLoading(true);
    let successCount = 0;
    
    try {
      const filesToUpload = Array.from(fileList);
      const total = filesToUpload.length;
      toast.info(`Téléchargement de ${total} logo(s)...`);
      
      for (let i = 0; i < total; i++) {
        const file = filesToUpload[i];
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');
        formData.append('folder', 'bcos/references');

        const clResponse = await fetch(`https://api.cloudinary.com/v1_1/de88x1rlt/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const clData = await clResponse.json();
        if (clData.error) throw new Error(clData.error.message);

        const imageUrl = clData.secure_url;
        
        // Remove extension for company name
        const companyName = file.name.split('.')[0].replace(/[-_]/g, ' ');

        // Add to client_references
        const referenceData = {
          company_name: companyName,
          logo_url: imageUrl,
          category: 'General',
          description: `Référence ajoutée en lot: ${companyName}`,
          rating: 5,
          status: 'completed' as const,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('client_references').insert([referenceData]);
        
        if (!error) successCount++;
        
        // Update Progress
        setBatchProgress(Math.round(((i + 1) / total) * 100));
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} Logo(s) téléchargé(s) et ajouté(s) comme références avec succès!`);
        loadReferences();
      }
    } catch (error: any) {
      console.error('Batch upload error:', error);
      toast.error("Erreur lors du téléchargement par lot.");
    } finally {
      setLoading(false);
      setUploadingBatch(false);
      setTimeout(() => setBatchProgress(0), 1000);
      if (event.target) event.target.value = '';
    }
  };

  const filteredReferences = references.filter(reference => {
    const matchesSearch = reference.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reference.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reference.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });



  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Banking': return 'bg-blue-100 text-blue-800';
      case 'Telecommunications': return 'bg-orange-100 text-orange-800';
      case 'Retail': return 'bg-green-100 text-green-800';
      case 'Automotive': return 'bg-yellow-100 text-yellow-800';
      case 'Technology': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">References Management</h1>
            <p className="text-gray-600 mt-1">Manage client references and testimonials</p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadReferences}
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            
            {/* Batch Add Multiple Images Directly */}
            <div className="relative flex flex-col gap-2">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleBatchUpload} 
                className="hidden" 
                id="batch-references-upload" 
              />
              <Button 
                variant="outline" 
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                onClick={() => document.getElementById('batch-references-upload')?.click()}
                disabled={loading || uploadingBatch}
              >
                {uploadingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading ({batchProgress}%)
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Multiple Logos
                  </>
                )}
              </Button>
              {uploadingBatch && (
                <Progress value={batchProgress} className="h-1.5 w-full bg-blue-100" />
              )}
            </div>
            
            {/* Quick Add Dialog - Simple form for logo link */}
            <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  onClick={() => {
                    setQuickAddData({ company_name: '', logo_url: '' });
                    setIsQuickAddOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add by Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Quick Add Reference</DialogTitle>
                  <DialogDescription>
                    Add a reference quickly by providing just the company name and logo URL. It will be automatically featured.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Company Name *
                    </label>
                    <Input 
                      placeholder="e.g., Company Name" 
                      value={quickAddData.company_name}
                      onChange={(e) => setQuickAddData({...quickAddData, company_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Logo URL *
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://example.com/logo.png" 
                        value={quickAddData.logo_url}
                        onChange={(e) => setQuickAddData({...quickAddData, logo_url: e.target.value})}
                      />
                      <Button type="button" variant="outline" onClick={() => { setMediaTarget('quick'); setIsMediaPickerOpen(true); }}>
                        Media
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the full URL to the company logo image
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={() => setIsQuickAddOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleQuickAdd} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Add Reference
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Full Add Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={handleCreateReference}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Full Reference
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingReference ? 'Edit Reference' : 'Add New Reference'}</DialogTitle>
                  <DialogDescription>
                    {editingReference ? 'Edit existing client reference' : 'Add a new client reference to showcase your success stories.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Company Name" 
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    />
                    <select 
                      className="p-2 border rounded-md"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      <option value="Banking">Banking</option>
                      <option value="Telecommunications">Telecommunications</option>
                      <option value="Retail">Retail</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Technology">Technology</option>
                    </select>
                  </div>
                  <Textarea 
                    placeholder="Project Description" 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Website URL" 
                      value={formData.website_url}
                      onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Logo URL" 
                        value={formData.logo_url}
                        onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                      />
                      <Button type="button" variant="outline" onClick={() => { setMediaTarget('full'); setIsMediaPickerOpen(true); }}>
                        Media
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Reference Links</p>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                    {formData.links.length === 0 ? (
                      <p className="text-xs text-gray-500">No links added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.links.map((link, index) => (
                          <div key={`reference-link-${index}`} className="flex gap-2">
                            <Input
                              placeholder="https://example.com"
                              value={link}
                              onChange={(e) => handleUpdateLink(index, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveLink(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Contact Person" 
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    />
                    <Input 
                      placeholder="Email" 
                      type="email" 
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input 
                      placeholder="Phone" 
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    />
                    <Input 
                      placeholder="Duration" 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    />
                    <Input 
                      placeholder="Participants" 
                      type="number" 
                      value={formData.participants || ''}
                      onChange={(e) => setFormData({...formData, participants: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <Input 
                    type="date" 
                    placeholder="Project Date" 
                    value={formData.project_date}
                    onChange={(e) => setFormData({...formData, project_date: e.target.value})}
                  />
                  <Textarea 
                    placeholder="Client Testimonial" 
                    rows={3} 
                    value={formData.testimonial}
                    onChange={(e) => setFormData({...formData, testimonial: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      className="p-2 border rounded-md"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="">Project Status</option>
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="planned">Planned</option>
                    </select>
                    <select 
                      className="p-2 border rounded-md"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                    >
                      <option value="">Rating</option>
                      <option value="5">5 Stars</option>
                      <option value="4.9">4.9 Stars</option>
                      <option value="4.8">4.8 Stars</option>
                      <option value="4.7">4.7 Stars</option>
                      <option value="4.5">4.5 Stars</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="is_featured" 
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="is_featured" className="text-sm text-gray-700">
                      Featured Reference
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveReference} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingReference ? 'Update Reference' : 'Add Reference'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Client References</CardTitle>
            <CardDescription>Manage all client references and success stories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search references..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                className="px-3 py-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="banking">Banking</option>
                <option value="telecommunications">Telecommunications</option>
                <option value="retail">Retail</option>
                <option value="automotive">Automotive</option>
                <option value="technology">Technology</option>
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading references...</span>
              </div>
            )}

            {/* Bulk Actions */}
            {!loading && filteredReferences.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectedReferences.size === filteredReferences.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedReferences.size === filteredReferences.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedReferences.size > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedReferences.size} référence(s) sélectionnée(s)
                    </span>
                  )}
                </div>
                {selectedReferences.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedReferences.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* References Grid */}
            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredReferences.map((reference) => {
                  const primaryWebsiteUrl = reference.website_url?.trim();
                  const additionalLinks = Array.isArray(reference.links) ? reference.links : [];
                  const cleanedAdditionalLinks = additionalLinks
                    .map((link) => link.trim())
                    .filter((link) => link.length > 0 && link !== primaryWebsiteUrl);
                  const referenceLinks = [
                    ...(primaryWebsiteUrl ? [primaryWebsiteUrl] : []),
                    ...Array.from(new Set(cleanedAdditionalLinks))
                  ];
                  const hasPrimaryWebsite = Boolean(primaryWebsiteUrl);

                  const isSelected = selectedReferences.has(reference.id);
                  
                  return (
                    <Card 
                      key={reference.id} 
                      className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleReferenceSelection(reference.id)}
                              className="mt-1 flex-shrink-0"
                              type="button"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-primary" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            {reference.logo_url ? (
                              <img
                                src={reference.logo_url}
                                alt={`${reference.company_name} logo`}
                                className="w-16 h-10 object-contain bg-gray-50 rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-10 bg-gray-100 rounded border flex items-center justify-center">
                                <Building className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">{reference.company_name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getCategoryColor(reference.category)} variant="secondary">
                                  {reference.category}
                                </Badge>
                                <Badge className={getStatusColor(reference.status)} variant="secondary">
                                  {reference.status === 'completed' ? 'Completed' : reference.status === 'in_progress' ? 'In Progress' : 'Planned'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {reference.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300" variant="secondary">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 mr-1 fill-current" />
                              <span className="text-sm font-medium">{reference.rating}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {reference.description}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{reference.project_date || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{reference.participants || 0} participants</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <p><strong>Duration:</strong> {reference.duration || 'N/A'}</p>
                            <p><strong>Contact:</strong> {reference.contact_person || 'N/A'}</p>
                            <p><strong>Email:</strong> {reference.contact_email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {reference.contact_phone || 'N/A'}</p>
                          </div>

                          {reference.testimonial && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm italic text-gray-700">
                                "{reference.testimonial}"
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center space-x-2">
                              {referenceLinks.map((link, index) => (
                                <Button key={`${reference.id}-link-${index}`} variant="outline" size="sm" asChild>
                                  <a href={link} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-4 h-4 mr-1" />
                                    {hasPrimaryWebsite && index === 0 ? 'Website' : `Link ${hasPrimaryWebsite ? index : index + 1}`}
                                  </a>
                                </Button>
                              ))}
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditReference(reference)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteReference(reference.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && filteredReferences.length === 0 && (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No references found matching your criteria.</p>
                <Button className="mt-4" onClick={handleCreateReference}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Reference
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{references.length}</p>
                  <p className="text-sm text-gray-600">Total References</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{references.reduce((sum, ref) => sum + (ref.participants || 0), 0)}</p>
                  <p className="text-sm text-gray-600">Total Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {(references.reduce((sum, ref) => sum + ref.rating, 0) / references.length).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{references.filter(ref => ref.status === 'completed').length}</p>
                  <p className="text-sm text-gray-600">Completed Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <MediaPicker 
          open={isMediaPickerOpen} 
          onOpenChange={setIsMediaPickerOpen}
          onSelect={(url) => {
            if (mediaTarget === 'quick') {
              setQuickAddData({...quickAddData, logo_url: url});
            } else {
              setFormData({...formData, logo_url: url});
            }
          }}
          preferredType="companies"
        />
      </div>
    </AdminLayout>
  );
};

export default References;









