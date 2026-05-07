import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Image as ImageIcon, File } from 'lucide-react';
import { toast } from 'sonner';
import { SupabaseService } from '@/lib/supabase';

interface MediaFile {
  id: string;
  title: string;
  url: string;
  category: string;
  upload_date: string;
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  preferredType?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ open, onOpenChange, onSelect, preferredType }) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getGalleryImages();
      
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
      toast.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const isImage = (fileName: string) => {
    return true; // Mostly images in gallery
  };

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split files into preferred and others
  const preferredFiles = preferredType ? filteredFiles.filter(f => f.category === preferredType) : [];
  const otherFiles = preferredType ? filteredFiles.filter(f => f.category !== preferredType) : filteredFiles;

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  const renderFileGrid = (items: MediaFile[]) => {
    if (items.length === 0) return <div className="text-gray-500 text-sm py-4">No files found</div>;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((file) => (
          <div
            key={file.id}
            className="group relative border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-primary"
            onClick={() => handleSelect(file.url)}
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
              <img
                src={file.url}
                alt={file.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="default" className="shadow-lg">
                  Select
                </Button>
              </div>
            </div>

            <div className="p-2 bg-white">
              <p className="text-xs font-medium text-gray-900 truncate" title={file.title}>
                {file.title}
              </p>
              <p className="text-[10px] text-gray-500 truncate" title={file.category}>
                {file.category}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col rounded-3xl">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            Choose an image or file from your library
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm rounded-xl"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {preferredType && preferredFiles.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest border-b pb-2">
                    {preferredType} Media
                  </h3>
                  {renderFileGrid(preferredFiles)}
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-bold mb-3 text-slate-400 uppercase tracking-widest border-b pb-2">
                  {preferredType && preferredFiles.length > 0 ? "All Library" : "General Media"}
                </h3>
                {renderFileGrid(otherFiles)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPicker;
