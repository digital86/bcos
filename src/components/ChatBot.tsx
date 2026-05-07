import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { AIService } from '@/lib/aiService';
import { SupabaseService } from '@/lib/supabase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre conseiller BCOS. Comment puis-je vous orienter aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check Global Status from Supabase
    const checkStatus = async () => {
      const status = await SupabaseService.getChatStatus();
      setIsChatEnabled(status);
    };
    checkStatus();

    if (localStorage.getItem('chat_dismissed') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    let sId = localStorage.getItem('chat_session_id');
    if (!sId) {
      sId = crypto.randomUUID();
      localStorage.setItem('chat_session_id', sId);
    }
    setSessionId(sId);

    const initChat = async () => {
      // Load history
      const history = await SupabaseService.getChatHistory(sId);
      if (history && history.length > 0) {
        setMessages(history.map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.content
        })));
      }

      // Load Knowledge Base
      const kb = await SupabaseService.getKnowledgeBase();
      setKnowledgeBase(kb);
    };
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await SupabaseService.saveChatMessage({ session_id: sessionId, sender: 'user', content: userMessage });
      
      const aiResponse = await AIService.getChatResponse(newMessages, knowledgeBase);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      await SupabaseService.saveChatMessage({ session_id: sessionId, sender: 'bot', content: aiResponse });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur technique s'est produite. Revenez vers moi dans un instant." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChatEnabled || isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none group">
      {!isOpen && (
        <button 
          onClick={() => {
            setIsDismissed(true);
            localStorage.setItem('chat_dismissed', 'true');
          }}
          className="bg-white/95 hover:bg-red-50 text-gray-400 hover:text-red-500 p-1.5 rounded-full shadow-xl mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto border border-gray-100 flex items-center justify-center scale-90 group-hover:scale-100"
          title="Masquer l'assistant"
        >
          <X size={14} />
        </button>
      )}

      {isOpen && (
        <Card className="w-[380px] sm:w-[420px] h-[600px] mb-6 shadow-2xl flex flex-col overflow-hidden border-none bg-white/95 backdrop-blur-xl animate-in zoom-in-95 slide-in-from-bottom-10 fade-in duration-500 pointer-events-auto rounded-3xl">
          <CardHeader className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white py-6 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                  <Sparkles size={22} className="text-cyan-100" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight">Conseiller BCOS</CardTitle>
                  <p className="text-indigo-100 text-[11px] font-medium uppercase tracking-widest mt-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse" />
                    Support Intelligent
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scrollbar-thin scrollbar-thumb-indigo-100">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-${m.role === 'user' ? 'right' : 'left'}-4 duration-500`}
              >
                <div 
                  className={`max-w-[85%] p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none ring-1 ring-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3 ring-1 ring-slate-100">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[12px] text-slate-400 font-medium">BCOS réfléchit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <footer className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-center bg-slate-50/80 p-2 rounded-2xl ring-1 ring-slate-200 transition-all focus-within:ring-indigo-400 focus-within:bg-white focus-within:shadow-lg group">
              <Input
                placeholder="Comment pouvons-nous vous aider ?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="border-none bg-transparent focus-visible:ring-0 placeholder:text-slate-400 text-slate-700 h-10 px-3"
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="rounded-xl shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-md transform active:scale-90 transition-transform"
              >
                <Send size={18} />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span className="opacity-50">Powered by</span>
              <span className="text-indigo-500/80">BCOS Enterprise AI</span>
            </div>
          </footer>
        </Card>
      )}

      <Button
        size="icon"
        className={`w-16 h-16 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 hover:scale-110 active:scale-95 pointer-events-auto ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={32} /> : (
          <div className="relative">
            <MessageCircle size={32} />
            <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full border-2 border-indigo-700 animate-ping" />
          </div>
        )}
      </Button>
    </div>
  );
};
