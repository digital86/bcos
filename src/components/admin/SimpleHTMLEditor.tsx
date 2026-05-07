import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image,
  Code,
  Eye
} from 'lucide-react';

interface SimpleHTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const SimpleHTMLEditor = ({ 
  value, 
  onChange, 
  placeholder = "Écrivez le contenu du cours en HTML...", 
  height = "400px" 
}: SimpleHTMLEditorProps) => {
  const [activeTab, setActiveTab] = useState('editor');

  const insertTag = (openTag: string, closeTag: string = '') => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = closeTag 
      ? `${openTag}${selectedText}${closeTag}`
      : `${openTag}${selectedText}`;
    
    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + openTag.length + selectedText.length + closeTag.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { 
      icon: Bold, 
      label: 'Gras', 
      action: () => insertTag('<strong>', '</strong>') 
    },
    { 
      icon: Italic, 
      label: 'Italique', 
      action: () => insertTag('<em>', '</em>') 
    },
    { 
      icon: Underline, 
      label: 'Souligné', 
      action: () => insertTag('<u>', '</u>') 
    },
    { 
      icon: List, 
      label: 'Liste', 
      action: () => insertTag('<ul>\n  <li>', '</li>\n</ul>') 
    },
    { 
      icon: ListOrdered, 
      label: 'Liste numérotée', 
      action: () => insertTag('<ol>\n  <li>', '</li>\n</ol>') 
    },
    { 
      icon: Link, 
      label: 'Lien', 
      action: () => insertTag('<a href="URL">', '</a>') 
    },
    { 
      icon: Image, 
      label: 'Image', 
      action: () => insertTag('<img src="URL" alt="Description" />') 
    },
    { 
      icon: Code, 
      label: 'Code', 
      action: () => insertTag('<code>', '</code>') 
    }
  ];

  const insertHeading = (level: number) => {
    insertTag(`<h${level}>`, `</h${level}>`);
  };

  const insertParagraph = () => {
    insertTag('<p>', '</p>');
  };

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-gray-50">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Éditeur HTML
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="m-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-gray-50">
            {/* Headings */}
            <div className="flex items-center gap-1 mr-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(1)}
                className="text-xs"
              >
                H1
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(2)}
                className="text-xs"
              >
                H2
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(3)}
                className="text-xs"
              >
                H3
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertParagraph}
                className="text-xs"
              >
                P
              </Button>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 mr-3" />

            {/* Formatting buttons */}
            {toolbarButtons.map((button, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.label}
                className="p-2"
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Editor */}
          <Textarea
            id="html-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none resize-none focus-visible:ring-0 font-mono text-sm"
            style={{ height, minHeight: height }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div 
            className="p-6 bg-white overflow-auto"
            style={{ height, minHeight: height }}
          >
            {value ? (
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-foreground
                  prose-p:text-muted-foreground
                  prose-strong:text-foreground
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground
                  prose-code:bg-muted prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                  prose-li:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>L'aperçu apparaîtra ici une fois que vous aurez ajouté du contenu HTML</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleHTMLEditor;








