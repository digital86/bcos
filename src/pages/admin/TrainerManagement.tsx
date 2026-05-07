import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SupabaseService } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Upload, 
  Loader2,
  X
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MediaPicker from '@/components/admin/MediaPicker';

const TrainerManagement = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '', // Used for specialty/bio
    avatar_url: '',
    status: 'active' as 'active' | 'inactive'
  });

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const allUsers = await SupabaseService.getUsers();
      const trainerList = allUsers?.filter(user => user.role === 'trainer') || [];
      setTrainers(trainerList);
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      toast.error('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleOpenAdd = () => {
    setEditingTrainer(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      company: '',
      avatar_url: '',
      status: 'active'
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (trainer: any) => {
    setEditingTrainer(trainer);
    setFormData({
      full_name: trainer.full_name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      company: trainer.company || '',
      avatar_url: trainer.avatar_url || '',
      status: trainer.status || 'active'
    });
    setIsOpen(true);
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      setUploading(true);
      const file = fileList[0];
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'trainers');

      const response = await fetch('/api/upload.php', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ ...formData, avatar_url: data.file.url });
        toast.success('Avatar uploaded');
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTrainer) {
        await SupabaseService.updateUser(editingTrainer.id, {
          ...formData,
          updated_at: new Date().toISOString()
        });
        toast.success('Trainer updated');
      } else {
        await SupabaseService.createUser({
          ...formData,
          role: 'trainer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        toast.success('Trainer added');
      }
      setIsOpen(false);
      fetchTrainers();
    } catch (error: any) {
      console.error('Error saving trainer:', error);
      toast.error('Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trainer?')) return;
    try {
      await SupabaseService.deleteUser(id);
      toast.success('Trainer deleted');
      fetchTrainers();
    } catch (error: any) {
      console.error('Error deleting trainer:', error);
      toast.error('Delete failed');
    }
  };

  const filteredTrainers = trainers.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trainer Management</h1>
            <p className="text-gray-500 text-sm">Add and manage trainers and their profile photos</p>
          </div>
          
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trainer
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search trainers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTrainers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No trainers found
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTrainers.map((trainer) => (
                  <Card key={trainer.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {trainer.avatar_url ? (
                        <img 
                          src={trainer.avatar_url} 
                          alt={trainer.full_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                          <User className="w-16 h-16" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={trainer.status === 'active' ? 'default' : 'secondary'}>
                          {trainer.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg truncate">{trainer.full_name}</h3>
                      <p className="text-sm text-primary font-medium mb-3 truncate">{trainer.company || 'Certified Trainer'}</p>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{trainer.email}</span>
                        </div>
                        {trainer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{trainer.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(trainer)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(trainer.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTrainer ? 'Edit Trainer' : 'Add Trainer'}</DialogTitle>
              <DialogDescription>
                Fill in trainer details and upload a profile photo. Files are stored on Hostinger.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20 flex items-center justify-center">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    {formData.avatar_url && (
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, avatar_url: ''})}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsMediaPickerOpen(true)}
                  >
                    Select from Media
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Full name</label>
                <Input 
                  required 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="name@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+213..."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Specialty / Short bio</label>
                <Input 
                  value={formData.company} 
                  onChange={(e) => setFormData({...formData, company: e.target.value})} 
                  placeholder="e.g. Project Management Expert"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={uploading}>
                  {editingTrainer ? 'Save changes' : 'Add trainer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <MediaPicker 
          open={isMediaPickerOpen} 
          onOpenChange={setIsMediaPickerOpen}
          onSelect={(url) => setFormData({...formData, avatar_url: url})}
          preferredType="trainers"
        />
      </div>
    </AdminLayout>
  );
};

export default TrainerManagement;
