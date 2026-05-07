import React, { useState, useEffect } from 'react';
import { useVisualEditor } from './VisualEditorContext';
import { SupabaseService } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import MediaPicker from './MediaPicker';

interface EditableContentProps {
  contentKey: string;
  defaultContent: string;
  pageKey?: string;
  multiline?: boolean;
  className?: string;
}

export const EditableText: React.FC<EditableContentProps> = ({ 
  contentKey, 
  defaultContent, 
  pageKey = 'global',
  multiline = false,
  className = "" 
}) => {
  const { isEditMode } = useVisualEditor();
  const [content, setContent] = useState(defaultContent);
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await SupabaseService.getPageContent(pageKey);
        if (data && data.content && data.content[contentKey]) {
          setContent(data.content[contentKey]);
          setTempContent(data.content[contentKey]);
        }
      } catch (error) {
        console.error('Error fetching editable text:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [contentKey, pageKey]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await SupabaseService.getPageContent(pageKey);
      const currentFullContent = data?.content || {};
      
      const newFullContent = {
        ...currentFullContent,
        [contentKey]: tempContent
      };

      await SupabaseService.updatePageContent(pageKey, newFullContent);
      setContent(tempContent);
      setIsEditing(false);
      toast.success('Changes saved to Supabase');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode) {
    if (isEditing) {
      return (
        <div className={`relative group ${className}`}>
          {multiline ? (
            <Textarea 
              value={tempContent} 
              onChange={(e) => setTempContent(e.target.value)}
              className="min-h-[100px] w-full"
            />
          ) : (
            <Input 
              value={tempContent} 
              onChange={(e) => setTempContent(e.target.value)}
              className="w-full"
            />
          )}
          <div className="absolute -bottom-10 right-0 flex gap-1 z-50">
            <Button size="icon" variant="default" onClick={handleSave} disabled={saving} className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="destructive" onClick={() => { setIsEditing(false); setTempContent(content); }} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div 
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:ring-2 hover:ring-primary/50 hover:bg-primary/5 rounded px-1 transition-all relative group ${className}`}
      >
        {content}
        <div className="absolute -top-6 right-0 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 uppercase font-bold tracking-tighter">
          Click to Edit
        </div>
      </div>
    );
  }

  return <span className={className}>{content}</span>;
};

interface EditableImageProps {
  contentKey: string;
  defaultUrl: string;
  pageKey?: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const EditableImage: React.FC<EditableImageProps> = ({ 
  contentKey, 
  defaultUrl, 
  pageKey = 'global',
  className = "",
  alt = "",
  style = {}
}) => {
  const { isEditMode } = useVisualEditor();
  const [url, setUrl] = useState(defaultUrl);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await SupabaseService.getPageContent(pageKey);
        if (data && data.content && data.content[contentKey]) {
          setUrl(data.content[contentKey]);
        }
      } catch (error) {
        console.error('Error fetching image content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [contentKey, pageKey]);

  const handleSelect = async (newUrl: string) => {
    try {
      const data = await SupabaseService.getPageContent(pageKey);
      const currentFullContent = data?.content || {};
      
      const newFullContent = {
        ...currentFullContent,
        [contentKey]: newUrl
      };

      await SupabaseService.updatePageContent(pageKey, newFullContent);
      setUrl(newUrl);
      toast.success('Image updated and saved');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to update image');
    }
  };

  if (isEditMode) {
    return (
      <div className="relative group inline-block w-full h-full">
        <img 
          src={url} 
          className={`${className} group-hover:opacity-75 transition-opacity`} 
          alt={alt} 
          style={style}
        />
        <Button 
          onClick={() => setIsPickerOpen(true)}
          className="absolute inset-0 m-auto h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 shadow-2xl scale-75 group-hover:scale-100 transition-all z-10"
        >
          <ImageIcon className="w-6 h-6" />
        </Button>
        <MediaPicker 
          open={isPickerOpen} 
          onOpenChange={setIsPickerOpen} 
          onSelect={handleSelect} 
        />
      </div>
    );
  }

  return <img src={url} className={className} alt={alt} style={style} />;
};

interface EditableLinkProps {
  contentKey: string;
  defaultUrl: string;
  pageKey?: string;
  className?: string;
  children: React.ReactNode;
}

export const EditableLink: React.FC<EditableLinkProps> = ({ 
  contentKey, 
  defaultUrl, 
  pageKey = 'global',
  className = "",
  children
}) => {
  const { isEditMode } = useVisualEditor();
  const [url, setUrl] = useState(defaultUrl);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await SupabaseService.getPageContent(pageKey);
        if (data && data.content && data.content[contentKey]) {
          setUrl(data.content[contentKey]);
        }
      } catch (error) {
        console.error('Error fetching link content:', error);
      }
    };
    fetchContent();
  }, [contentKey, pageKey]);

  const handleSelect = async (newUrl: string) => {
    try {
      const data = await SupabaseService.getPageContent(pageKey);
      const currentFullContent = data?.content || {};
      
      const newFullContent = {
        ...currentFullContent,
        [contentKey]: newUrl
      };

      await SupabaseService.updatePageContent(pageKey, newFullContent);
      setUrl(newUrl);
      toast.success('Link updated and saved');
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to update link');
    }
  };

  if (isEditMode) {
    return (
      <div className={`relative group inline-flex justify-center items-center ${className}`}>
        <div className="pointer-events-none opacity-50 relative z-0 flex items-center justify-center w-full">{children}</div>
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer" onClick={() => setIsPickerOpen(true)}>
          <span className="text-white text-xs font-bold px-2 py-1 bg-primary rounded">Edit Link</span>
        </div>
        <MediaPicker 
          open={isPickerOpen} 
          onOpenChange={setIsPickerOpen} 
          onSelect={handleSelect} 
        />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
};
