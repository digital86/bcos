import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { SupabaseService } from '@/lib/supabase';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon, 
  Search,
  Loader2,
  Settings2,
  Tag
} from 'lucide-react';
import { optimizeImage } from '@/utils/imageUtils';

interface MediaFile {
  id: string;
  title: string;
  url: string;
  category: string;
  upload_date: string;
}

const CLOUD_NAME = 'de88x1rlt';
const UPLOAD_PRESET = 'ml_default';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'trainers', label: 'Trainers' },
  { value: 'courses', label: 'Courses' },
  { value: 'companies', label: 'Companies' },
  { value: 'actualites', label: 'Actualités/News' }
];

const MediaManagement = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState('all');
  const [uploadType, setUploadType] = useState('general');
  
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getGalleryImages(viewType === 'all' ? undefined : viewType);
      
      if (data) {
        setFiles(data.map((f: any) => ({
          id: f.id,
          title: f.title || f.name || 'Unnamed',
          url: f.url,
          category: f.category || 'general',
          upload_date: f.upload_date
        })));
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files from library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [viewType]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const filesToUpload = Array.from(fileList);
      setUploading(true);
      setUploadProgress(0);
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentUploadingFile(file.name);
        
        try {
          // Optimize image before upload: Convert to WebP and compress
          const optimizedDataUrl = await optimizeImage(URL.createObjectURL(file), { 
            quality: 0.6, 
            maxWidth: 1200 
          });

          const formData = new FormData();
          formData.append('file', optimizedDataUrl);
          formData.append('upload_preset', UPLOAD_PRESET);
          formData.append('folder', `bcos/${uploadType}`);

          const clResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
          });

          const clData = await clResponse.json();
          if (clData.error) throw new Error(clData.error.message);

          const imageUrl = clData.secure_url;

          await SupabaseService.addGalleryImage({
            title: file.name,
            url: imageUrl,
            category: uploadType,
            status: 'active'
          });
          
          successCount++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          failCount++;
        }
        
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} image(s)`);
        fetchFiles();
      }
      
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} image(s)`);
      }
    } catch (error: any) {
      console.error('Error during batch upload:', error);
      toast.error('Upload process failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentUploadingFile('');
      if (event.target) event.target.value = '';
    }
  };

  const handleOpenEdit = (file: MediaFile) => {
    setEditingFile(file);
    setEditTitle(file.title);
    setEditCategory(file.category);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingFile) return;
    try {
      setIsSaving(true);
      await SupabaseService.updateGalleryImage(editingFile.id, {
        title: editTitle,
        category: editCategory
      });
      
      toast.success('Image updated successfully');
      setIsEditDialogOpen(false);
      fetchFiles();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this from library? (Cloudinary file remains)')) return;
    try {
      await SupabaseService.deleteGalleryImage(id);
      toast.success('Removed from library');
      setFiles(files.filter(f => f.id !== id));
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const filteredFiles = files.filter(file => 
    file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library (Cloudinary)</h1>
            <p className="text-gray-500 text-sm">Organize and categorize your visual assets</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              className="h-10 px-3 rounded-md border bg-white text-sm"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              disabled={uploading}
            >
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select
              className="h-10 px-3 rounded-md border bg-white text-sm"
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              disabled={loading}
            >
              <option value="all">Show All</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <Input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept="image/*"
              multiple
            />
            <Button asChild disabled={uploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload Images'}
              </label>
            </Button>
          </div>
        </div>

        {uploading && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="font-bold text-slate-700">Uploading: {currentUploadingFile}</span>
                  </div>
                  <span className="font-bold text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm border-none shadow-none focus-visible:ring-0"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No images found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="group relative border border-slate-100 rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                      <img src={file.url} alt={file.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <Button size="icon" variant="secondary" onClick={() => copyToClipboard(file.url)} className="rounded-full shadow-lg h-9 w-9" title="Copy URL">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => handleOpenEdit(file)} className="rounded-full shadow-lg h-9 w-9" title="Edit Category/Title">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" asChild className="rounded-full shadow-lg h-9 w-9">
                          <a href={file.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(file.id)} className="rounded-full shadow-lg h-9 w-9" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="absolute top-3 left-3">
                         <Badge className="bg-white/90 backdrop-blur text-slate-900 border-none font-bold text-[10px] uppercase tracking-tighter shadow-sm">
                            {file.category}
                         </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-sm font-bold text-slate-900 truncate">{file.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(file.upload_date).toLocaleDateString()}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Edit Image Details
              </DialogTitle>
              <DialogDescription>
                Update the metadata for this image to keep your library organized.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Image Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</label>
                <select 
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-full px-8">Cancel</Button>
              <Button onClick={handleUpdate} disabled={isSaving} className="rounded-full px-8">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
             <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="text-sm text-slate-600 leading-relaxed font-medium">
             Use the <Settings2 className="inline w-4 h-4 mx-1" /> icon on any image to update its title or move it to a different category.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MediaManagement;
