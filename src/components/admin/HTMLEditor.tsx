import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const HTMLEditor = ({ value, onChange, placeholder = "Écrivez le contenu du cours...", height = "400px" }: HTMLEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className="w-full">
      <style jsx global>{`
        .ql-editor {
          min-height: ${height};
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .ql-toolbar {
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-bottom: none;
          background: #f8fafc;
        }
        
        .ql-container {
          border-bottom: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-top: none;
          font-family: 'Inter', sans-serif;
        }
        
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: italic;
        }
        
        .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }
        
        .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }
        
        .ql-editor h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }
        
        .ql-editor p {
          margin: 0.5em 0;
        }
        
        .ql-editor ul, .ql-editor ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #253b74;
          margin: 1em 0;
          padding-left: 1em;
          color: #64748b;
          font-style: italic;
        }
        
        .ql-editor code {
          background: #f1f5f9;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: 'Monaco', 'Consolas', monospace;
        }
        
        .ql-editor pre {
          background: #f1f5f9;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
        }
        
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 1em 0;
        }
        
        .ql-editor a {
          color: #253b74;
          text-decoration: underline;
        }
        
        .ql-editor a:hover {
          color: #1e293b;
        }
      `}</style>
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default HTMLEditor;








