import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Bot, Clock, Search, ChevronRight, Loader2, X } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const Messages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadChatStatus();
    loadConversations();
  }, []);

  const loadChatStatus = async () => {
    const status = await SupabaseService.getChatStatus();
    setIsChatEnabled(status);
  };

  const handleToggleChat = async () => {
    setUpdatingStatus(true);
    const newStatus = !isChatEnabled;
    const success = await SupabaseService.setChatStatus(newStatus);
    if (success) {
      setIsChatEnabled(newStatus);
    }
    setUpdatingStatus(false);
  };

  useEffect(() => {
    if (selectedSession) {
      loadChatHistory(selectedSession);
    }
  }, [selectedSession]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getAllConversations();
      if (!data || data.length === 0) {
        console.log('No conversations found in database');
      }
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations from Supabase:', error);
      alert('Erreur lors du chargement des conversations. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    try {
      const data = await SupabaseService.getChatHistory(sessionId);
      setCurrentChat(data || []);
    } catch (error) {
      console.error('Error loading chat:', error);
      alert('Erreur lors du chargement de l\'historique.');
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.session_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Conversations ChatBot</h1>
              <p className="text-gray-600 mt-1">Gérez le chatbot و سجل المحادثات</p>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <span className={`text-sm font-bold ${isChatEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {isChatEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <Button 
                onClick={handleToggleChat} 
                disabled={updatingStatus}
                variant={isChatEnabled ? "default" : "outline"}
                className={`w-20 h-8 rounded-full p-0 transition-all ${isChatEnabled ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (isChatEnabled ? 'ON' : 'OFF')}
              </Button>
            </div>
          </div>
          <Button onClick={loadConversations} variant="outline" className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
          {/* Sidebar: Conversations List */}
          <Card className="md:col-span-4 flex flex-col h-full overflow-hidden">
            <CardHeader className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Chargement...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Aucune conversation</div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.session_id}
                      onClick={() => setSelectedSession(conv.session_id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors ${
                        selectedSession === conv.session_id ? 'bg-blue-50 border-r-4 border-primary' : ''
                      }`}
                    >
                      <div className="bg-gray-100 p-2 rounded-full mt-1">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-mono text-gray-400 truncate max-w-[100px]">
                            {conv.session_id.split('-')[0]}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{conv.content}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 self-center" />
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Main: Chat View */}
          <Card className="md:col-span-8 flex flex-col h-full overflow-hidden">
            {selectedSession ? (
              <>
                <CardHeader className="p-4 border-b bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full border shadow-sm">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Discussion #{selectedSession.split('-')[0]}</CardTitle>
                        <CardDescription className="text-xs">ID Session: {selectedSession}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Terminée
                    </Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {currentChat.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white text-gray-600'
                          }`}>
                            {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            <div className={`p-3 rounded-2xl shadow-sm border ${
                              msg.sender === 'user' 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-gray-50 text-gray-800 rounded-tl-none border-gray-100'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 px-1">
                              <Clock className="w-3 h-3" />
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-gray-500">Sélectionnez une discussion</h3>
                <p className="text-sm max-w-xs mt-2">Cliquez sur une conversation dans la liste de gauche pour voir l'historique complet des messages.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Messages;



