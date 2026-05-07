import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabaseClient';
import { 
  Search,
  Eye,
  Phone,
  Mail,
  Building,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Globe,
  Save,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface EventRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  source: string;
  language_preference: string;
  request_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const EventRequests = () => {
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notesDraft, setNotesDraft] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<{ [key: string]: boolean }>({});

  const statusOptions = [
    { value: 'new', label: 'Nouveau', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    { value: 'contacted', label: 'Contacté', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'confirmed', label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'in_progress', label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: Clock },
    { value: 'completed', label: 'Terminé', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
  ];

  useEffect(() => {
    loadEventRequests();
  }, []);

  const loadEventRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading event requests:', error);
        toast.error('Erreur lors du chargement des demandes');
        return;
      }
      
      setEventRequests(data || []);
    } catch (error: any) {
      console.error('Error loading event requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...eventRequests];

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const fullName = (r.full_name || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const company = (r.company || '').toLowerCase();
        
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               company.includes(searchLower);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [eventRequests, searchTerm, statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('event_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Statut mis à jour');
      loadEventRequests();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async (id: string) => {
    try {
      setSavingNotes({ ...savingNotes, [id]: true });
      const notes = notesDraft[id] || '';
      
      const { error } = await supabase
        .from('event_requests')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Notes sauvegardées');
      setEditingNotes(null);
      loadEventRequests();
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingNotes({ ...savingNotes, [id]: false });
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_requests')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Demande supprimée');
      loadEventRequests();
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return null;
    
    const Icon = option.icon;
    return (
      <Badge className={option.color}>
        <Icon className="w-3 h-3 mr-1" />
        {option.label}
      </Badge>
    );
  };

  const stats = {
    total: eventRequests.length,
    new: eventRequests.filter(r => r.status === 'new').length,
    contacted: eventRequests.filter(r => r.status === 'contacted').length,
    confirmed: eventRequests.filter(r => r.status === 'confirmed').length,
    in_progress: eventRequests.filter(r => r.status === 'in_progress').length,
    completed: eventRequests.filter(r => r.status === 'completed').length,
    cancelled: eventRequests.filter(r => r.status === 'cancelled').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Demandes d'Événements</h1>
          <p className="text-muted-foreground">
            Gérez toutes les demandes d'organisation d'événements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Nouveaux</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.new}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confirmés</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.confirmed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>En cours</CardDescription>
              <CardTitle className="text-3xl text-purple-600">{stats.in_progress}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, email, téléphone, entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune demande trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.full_name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.phone}</TableCell>
                        <TableCell>{request.company}</TableCell>
                        <TableCell>
                          <Select
                            value={request.status}
                            onValueChange={(value) => updateStatus(request.id, value)}
                            disabled={updating}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setNotesDraft({ ...notesDraft, [request.id]: request.notes || '' });
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la demande</DialogTitle>
              <DialogDescription>
                Informations complètes sur la demande d'organisation d'événement
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom complet</Label>
                    <p className="text-sm font-medium">{selectedRequest.full_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm font-medium">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <p className="text-sm font-medium">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <Label>Entreprise</Label>
                    <p className="text-sm font-medium">{selectedRequest.company}</p>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <p className="text-sm font-medium">{selectedRequest.source}</p>
                  </div>
                  <div>
                    <Label>Langue</Label>
                    <p className="text-sm font-medium">
                      {selectedRequest.language_preference === 'ar' ? 'العربية' : 'Français'}
                    </p>
                  </div>
                  <div>
                    <Label>Date de création</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedRequest.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  {editingNotes === selectedRequest.id ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={notesDraft[selectedRequest.id] || ''}
                        onChange={(e) => setNotesDraft({ ...notesDraft, [selectedRequest.id]: e.target.value })}
                        rows={4}
                        placeholder="Ajoutez des notes sur cette demande..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveNotes(selectedRequest.id)}
                          disabled={savingNotes[selectedRequest.id]}
                        >
                          {savingNotes[selectedRequest.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Sauvegarder
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNotes(null);
                            setNotesDraft({ ...notesDraft, [selectedRequest.id]: selectedRequest.notes || '' });
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground min-h-[60px] p-3 bg-gray-50 rounded-md">
                        {selectedRequest.notes || 'Aucune note'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setEditingNotes(selectedRequest.id);
                          setNotesDraft({ ...notesDraft, [selectedRequest.id]: selectedRequest.notes || '' });
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {selectedRequest.notes ? 'Modifier les notes' : 'Ajouter des notes'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default EventRequests;


