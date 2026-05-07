import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit2, Save, X, Eye, Settings, Check } from 'lucide-react';
import { toast } from 'sonner';

interface VisualEditorContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  isAdmin: boolean;
}

const VisualEditorContext = createContext<VisualEditorContextType | undefined>(undefined);

export const VisualEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token === 'demo-token') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    // If URL contains /editor, try to enable edit mode
    if (location.pathname.includes('/editor')) {
      if (localStorage.getItem('adminToken') === 'demo-token') {
        setIsEditMode(true);
      }
    } else {
      setIsEditMode(false);
    }
  }, [location.pathname]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const showEditorUI = isAdmin || location.pathname.includes('/editor');

  return (
    <VisualEditorContext.Provider value={{ isEditMode, toggleEditMode, isAdmin }}>
      {children}
      {showEditorUI && (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-2">
          {isEditMode && (
             <div className="bg-slate-900 text-white px-4 py-2 rounded-xl shadow-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                Visual Editor Active
             </div>
          )}
          <Button 
            onClick={toggleEditMode}
            className={`rounded-full shadow-2xl h-14 w-14 transition-all duration-500 hover:scale-110 ${isEditMode ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isEditMode ? <Check className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
          </Button>
        </div>
      )}
    </VisualEditorContext.Provider>
  );
};

export const useVisualEditor = () => {
  const context = useContext(VisualEditorContext);
  if (context === undefined) {
    throw new Error('useVisualEditor must be used within a VisualEditorProvider');
  }
  return context;
};
