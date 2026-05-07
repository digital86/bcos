import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import AdminLayout from '@/components/admin/AdminLayout';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Loader2,
  Globe,
  Save,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { Enrollment } from '../../../supabase-config';
import { Checkbox } from '@/components/ui/checkbox';

const EnrollmentsCRM = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [savingNotes, setSavingNotes] = useState<{ [key: string]: boolean }>({});
  const [notesDraft, setNotesDraft] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState<{ [key: string]: number | null }>({});
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState<{ [key: string]: boolean }>({});

  const statusOptions = [
    { value: 'pending', label: 'Nouveau / En attente', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    { value: 'confirmed', label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'completed', label: 'Terminé', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
  ];

  // Unified status options
  const unifiedStatusOptions = [
    { value: 'nouveau', label: 'Nouveau', color: 'bg-blue-100 text-blue-800' },
    { value: 'confirme', label: 'Confirmé', color: 'bg-green-100 text-green-800' },
    { value: 'a_confirme', label: 'À confirmer', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'nos_repond_pas', label: 'Ne répond pas', color: 'bg-orange-100 text-orange-800' },
    { value: 'pas_interest', label: 'Pas intéressé', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: 'Terminé', color: 'bg-purple-100 text-purple-800' },
    { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' },
  ];

  // Helper function to get unified status from enrollment
  const getUnifiedStatus = (enrollment: any) => {
    const status = (enrollment.status || '').toLowerCase();
    const leadStatus = (enrollment.lead_status || '').toLowerCase();
    
    // Priority: completed and cancelled status override everything
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    
    // Then check lead_status first (it has priority over status)
    if (leadStatus === 'a_confirme') return 'a_confirme';
    if (leadStatus === 'nos_repond_pas') return 'nos_repond_pas';
    if (leadStatus === 'pas_interest') return 'pas_interest';
    if (leadStatus === 'confirme') return 'confirme';
    if (leadStatus === 'nouveau') return 'nouveau';
    
    // If no lead_status, check status
    if (status === 'confirmed') return 'confirme';
    if (status === 'pending' || status === 'new') return 'nouveau';
    
    const result = leadStatus || status || 'nouveau';
    console.log('getUnifiedStatus for enrollment:', enrollment.id, 'status:', status, 'leadStatus:', leadStatus, 'result:', result);
    return result;
  };

  // Helper function to get unified status label
  const getUnifiedStatusLabel = (enrollment: any) => {
    const unifiedStatus = getUnifiedStatus(enrollment);
    const option = unifiedStatusOptions.find(opt => opt.value === unifiedStatus);
    return option?.label || unifiedStatus;
  };

  // Helper function to get unified status color
  const getUnifiedStatusColor = (enrollment: any) => {
    const unifiedStatus = getUnifiedStatus(enrollment);
    const option = unifiedStatusOptions.find(opt => opt.value === unifiedStatus);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  // Combined filter options for "Statut de l'inscription" (not used anymore, kept for reference)
  // Note: leadStatusOptions was removed and replaced with unifiedStatusOptions
  // const allStatusFilterOptions = [
  //   ...unifiedStatusOptions.map(opt => ({ ...opt, type: 'unified' as const })),
  // ];

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await SimpleSupabaseService.getAllEnrollments();
      setEnrollments(data || []);
    } catch (error: any) {
      console.error('Error loading enrollments:', error);
      toast.error('Erreur lors du chargement des inscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...enrollments]; // Create a copy to avoid mutating original

    // Search filter - check multiple fields
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(e => {
        const fullName = (e.full_name || '').toLowerCase();
        const email = (e.email || '').toLowerCase();
        const phone = (e.phone || '').toLowerCase();
        const company = (e.company || '').toLowerCase();
        
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               company.includes(searchLower);
      });
    }

    // Status filter - unified status checking
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => {
        const enrollment = e as any;
        const status = (enrollment.status || '').toLowerCase();
        const leadStatus = (enrollment.lead_status || '').toLowerCase();
        const statusFilterLower = statusFilter.toLowerCase();
        
        // Unified status mapping
        switch (statusFilterLower) {
          case 'nouveau':
            return status === 'pending' || status === 'new' || leadStatus === 'nouveau';
          case 'confirme':
            return status === 'confirmed' || leadStatus === 'confirme';
          case 'a_confirme':
            return leadStatus === 'a_confirme';
          case 'nos_repond_pas':
            return leadStatus === 'nos_repond_pas';
          case 'pas_interest':
            return leadStatus === 'pas_interest';
          case 'completed':
            return status === 'completed';
          case 'cancelled':
            return status === 'cancelled';
          default:
            return status === statusFilterLower || leadStatus === statusFilterLower;
        }
      });
    }

    // Source filter - check both source and lead_source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(e => {
        const enrollment = e as any;
        const source = (enrollment.source || enrollment.lead_source || '').toLowerCase();
        const sourceFilterLower = sourceFilter.toLowerCase();
        
        // Handle multiple source values
        if (sourceFilterLower === 'email' || sourceFilterLower === 'mail') {
          return source === 'email' || source === 'mail';
        }
        return source === sourceFilterLower;
      });
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(e => {
        const lang = (e.language_preference || 'fr').toLowerCase();
        return lang === languageFilter.toLowerCase();
      });
    }

    setFilteredEnrollments(filtered);
  }, [enrollments, searchTerm, statusFilter, sourceFilter, languageFilter]);

  const handleViewDetails = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedEnrollment) return;

    try {
      setUpdating(true);
      await SimpleSupabaseService.updateEnrollmentStatus(selectedEnrollment.id, { status });
      toast.success('Statut mis à jour');
      loadEnrollments();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateLeadStatus = async (leadStatus: string) => {
    if (!selectedEnrollment) return;

    try {
      setUpdating(true);
      await SimpleSupabaseService.updateEnrollmentStatus(selectedEnrollment.id, { lead_status: leadStatus });
      toast.success('Statut lead mis à jour');
      loadEnrollments();
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateLeadStatusForEnrollment = async (enrollmentId: string, leadStatus: string) => {
    try {
      setUpdating(true);
      await SimpleSupabaseService.updateEnrollmentStatus(enrollmentId, { lead_status: leadStatus });
      toast.success('Statut mis à jour');
      // Update local state immediately for better UX
      setEnrollments(prev => 
        prev.map(e => 
          e.id === enrollmentId ? { ...e, lead_status: leadStatus } : e
        )
      );
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast.error('Erreur lors de la mise à jour');
      // Reload to get correct state
      loadEnrollments();
    } finally {
      setUpdating(false);
    }
  };

  const proceedInvoiceGeneration = async (enrollmentsList: any[]) => {
    try {
      const companyName = enrollmentsList[0].company || enrollmentsList[0].full_name || 'Client BCOS';
      const items = enrollmentsList.map(e => ({
        description: `Formation: ${e.formation ? (e.formation.title_fr || e.formation.title) : 'Général'} - Participant: ${e.full_name}`,
        quantity: 1,
        price: e.amount_paid !== null && e.amount_paid !== undefined ? Number(e.amount_paid) : Number(e.formation?.price_ttc || e.formation?.price || 0)
      }));
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxRate = 19;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      const payload = {
        invoice_number: `FA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        client_name: companyName,
        client_email: enrollmentsList[0].email || '',
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tax_rate: taxRate,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items
      };

      const { data, error } = await supabase.from('invoices').insert([payload]);
      if (error && error.code !== '42P01') throw error; // Ignore if table doesn't exist yet
      if (error && error.code === '42P01') {
        toast.error("Veuillez configurer SQL Dashboard en premier pour activer la facturation.");
        return;
      }
      
      toast('Facture générée avec succès !', {
        action: {
          label: 'Voir Facturation',
          onClick: () => navigate('/admin/facturation')
        }
      });
      setSelectedRowIds(new Set());
    } catch (err) {
      console.error('Error generating invoice:', err);
      toast.error('Erreur de création de la facture.');
    }
  };

  const handleBulkGenerateInvoice = async () => {
    if (selectedRowIds.size === 0) return;
    const selectedEnrollments = filteredEnrollments.filter(e => selectedRowIds.has(e.id));
    await proceedInvoiceGeneration(selectedEnrollments);
  };

  const handleUpdateUnifiedStatus = async (enrollmentId: string, updates: any) => {
    try {
      setUpdating(true);
      console.log('Updating enrollment:', enrollmentId, 'with updates:', updates);
      
      // Update local state immediately for optimistic UI
      setEnrollments(prev => {
        return prev.map(e => {
          if (e.id === enrollmentId) {
            // Create a completely new object to ensure React detects the change
            const newEnrollment = {
              ...e,
              ...updates,
              lead_status: updates.lead_status !== undefined ? updates.lead_status : (e as any).lead_status,
              status: updates.status !== undefined ? updates.status : e.status,
            };
            console.log('Updated enrollment in state:', newEnrollment);
            console.log('lead_status:', newEnrollment.lead_status, 'status:', newEnrollment.status);
            return newEnrollment;
          }
          return e;
        });
      });
      
      await SimpleSupabaseService.updateEnrollmentStatus(enrollmentId, updates);
      toast.success('Statut mis à jour');

      // Auto-generate invoice if marked as completed
      if (updates.status === 'completed' || updates.lead_status === 'completed') {
        const enrollmentObj = enrollments.find(e => e.id === enrollmentId);
        if (enrollmentObj) {
           await proceedInvoiceGeneration([enrollmentObj]);
        }
      }

    } catch (error: any) {
      console.error('Error updating unified status:', error);
      toast.error('Erreur lors de la mise à jour');
      // Reload to get correct state on error
      loadEnrollments();
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedEnrollment) return;

    try {
      setUpdating(true);
      await SimpleSupabaseService.updateEnrollmentStatus(selectedEnrollment.id, { commercial_notes: notes });
      toast.success('Notes mises à jour');
      loadEnrollments();
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotesForEnrollment = async (enrollmentId: string, notes: string) => {
    try {
      setSavingNotes(prev => ({ ...prev, [enrollmentId]: true }));
      await SimpleSupabaseService.updateEnrollmentStatus(enrollmentId, { commercial_notes: notes });
      toast.success('Notes mises à jour');
      // Update local state
      setEnrollments(prev => 
        prev.map(e => 
          e.id === enrollmentId 
            ? { ...e, commercial_notes: notes }
            : e
        )
      );
      // Clear draft and hide save button
      setNotesDraft(prev => {
        const newDraft = { ...prev };
        delete newDraft[enrollmentId];
        return newDraft;
      });
      setEditingNotes(null);
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast.error('Erreur lors de la mise à jour');
      // Reload to get correct state
      loadEnrollments();
    } finally {
      setSavingNotes(prev => {
        const newSaving = { ...prev };
        delete newSaving[enrollmentId];
        return newSaving;
      });
    }
  };

  const handleSaveNotes = (enrollmentId: string) => {
    const notes = notesDraft[enrollmentId] !== undefined 
      ? notesDraft[enrollmentId] 
      : enrollments.find(e => e.id === enrollmentId)?.commercial_notes || '';
    handleUpdateNotesForEnrollment(enrollmentId, notes);
  };

  const handleUpdateAmountForEnrollment = async (enrollmentId: string, amount: number | null) => {
    try {
      setSavingAmount(prev => ({ ...prev, [enrollmentId]: true }));
      await SimpleSupabaseService.updateEnrollmentStatus(enrollmentId, { amount_paid: amount });
      toast.success('Montant mis à jour');
      // Update local state
      setEnrollments(prev => 
        prev.map(e => 
          e.id === enrollmentId 
            ? { ...e, amount_paid: amount }
            : e
        )
      );
      // Clear draft
      setAmountDraft(prev => {
        const newDraft = { ...prev };
        delete newDraft[enrollmentId];
        return newDraft;
      });
      setEditingAmount(null);
    } catch (error: any) {
      console.error('Error updating amount:', error);
      toast.error('Erreur lors de la mise à jour');
      loadEnrollments();
    } finally {
      setSavingAmount(prev => {
        const newSaving = { ...prev };
        delete newSaving[enrollmentId];
        return newSaving;
      });
    }
  };

  const handleSaveAmount = (enrollmentId: string) => {
    const amount = amountDraft[enrollmentId] !== undefined 
      ? amountDraft[enrollmentId] 
      : (enrollments.find(e => e.id === enrollmentId) as any)?.amount_paid || null;
    handleUpdateAmountForEnrollment(enrollmentId, amount);
  };

  const formatPrice = (amount: number | null | undefined, currency: string = 'DZD') => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'DA' ? 'DZD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const stats = {
    total: enrollments.length,
    new: enrollments.filter(e => e.status === 'pending' || e.status === 'new').length,
    confirmed: enrollments.filter(e => e.status === 'confirmed').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM - Inscriptions</h1>
          <p className="text-gray-600 mt-1">Gérez les inscriptions et le suivi commercial</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Nouveaux</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Inscriptions</CardTitle>
            <CardDescription>
              {filteredEnrollments.length} inscription(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Statut de l'inscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                  <SelectItem value="a_confirme">À confirmer</SelectItem>
                  <SelectItem value="nos_repond_pas">Ne répond pas</SelectItem>
                  <SelectItem value="pas_interest">Pas intéressé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                  <SelectItem value="boost">Boost</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="mail">Email</SelectItem>
                </SelectContent>
              </Select>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les langues</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedRowIds.size > 0 && (
                <Button 
                  onClick={handleBulkGenerateInvoice}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto flex items-center shadow-md animate-in slide-in-from-bottom border-none"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Facturer le groupe ({selectedRowIds.size})
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedRowIds.size === filteredEnrollments.length && filteredEnrollments.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRowIds(new Set(filteredEnrollments.map(e => e.id)));
                          } else {
                            setSelectedRowIds(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut de l'inscription</TableHead>
                    <TableHead>Montant payé</TableHead>
                    <TableHead>Notes commerciales</TableHead>
                    <TableHead>Langue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment) => {
                    const statusConfig = getStatusConfig(enrollment.status);
                    const IconComponent = statusConfig.icon;

                    return (
                      <TableRow key={enrollment.id} className={selectedRowIds.has(enrollment.id) ? "bg-purple-50/50" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRowIds.has(enrollment.id)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedRowIds);
                              if (checked) newSet.add(enrollment.id);
                              else newSet.delete(enrollment.id);
                              setSelectedRowIds(newSet);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{enrollment.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {enrollment.company || <span className="text-gray-400 italic">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {enrollment.formation 
                              ? (enrollment.formation.title_fr || enrollment.formation.title_ar || enrollment.formation.title)
                              : enrollment.formation_id || 'Formation supprimée'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                            {enrollment.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1 text-muted-foreground" />
                            {enrollment.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={getUnifiedStatus(enrollment)}
                            onValueChange={(value) => {
                              // Update both lead_status and status based on unified value
                              const updates: any = {};
                              if (['nouveau', 'confirme', 'a_confirme', 'nos_repond_pas', 'pas_interest'].includes(value)) {
                                updates.lead_status = value;
                                if (value === 'confirme') {
                                  updates.status = 'confirmed';
                                } else if (value === 'nouveau') {
                                  updates.status = 'pending';
                                } else {
                                  // For a_confirme, nos_repond_pas, pas_interest: keep status as pending or confirmed
                                  // Don't override if it's already completed/cancelled
                                  const currentStatus = (enrollment.status || '').toLowerCase();
                                  if (currentStatus !== 'completed' && currentStatus !== 'cancelled') {
                                    updates.status = 'pending';
                                  }
                                }
                              } else if (value === 'completed') {
                                updates.status = 'completed';
                                updates.lead_status = 'confirme';
                              } else if (value === 'cancelled') {
                                updates.status = 'cancelled';
                                updates.lead_status = 'pas_interest';
                              }
                              handleUpdateUnifiedStatus(enrollment.id, updates);
                            }}
                            disabled={updating}
                          >
                            <SelectTrigger className={`w-[180px] h-8 text-xs ${getUnifiedStatusColor(enrollment)} border-transparent`}>
                              <SelectValue>
                                {getUnifiedStatusLabel(enrollment)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {unifiedStatusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      opt.value === 'nouveau' ? 'bg-blue-500' :
                                      opt.value === 'confirme' ? 'bg-green-500' :
                                      opt.value === 'a_confirme' ? 'bg-yellow-500' :
                                      opt.value === 'nos_repond_pas' ? 'bg-orange-500' :
                                      opt.value === 'pas_interest' ? 'bg-red-500' :
                                      opt.value === 'completed' ? 'bg-purple-500' :
                                      opt.value === 'cancelled' ? 'bg-red-500' :
                                      'bg-gray-500'
                                    }`}></div>
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Input
                              type="number"
                              value={amountDraft[enrollment.id] !== undefined 
                                ? amountDraft[enrollment.id] || '' 
                                : (enrollment as any).amount_paid || ''}
                              onChange={(e) => {
                                const newValue = e.target.value === '' ? null : parseFloat(e.target.value);
                                setAmountDraft(prev => ({
                                  ...prev,
                                  [enrollment.id]: newValue
                                }));
                              }}
                              onFocus={() => {
                                setEditingAmount(enrollment.id);
                                if (amountDraft[enrollment.id] === undefined) {
                                  setAmountDraft(prev => ({
                                    ...prev,
                                    [enrollment.id]: (enrollment as any).amount_paid || null
                                  }));
                                }
                              }}
                              onBlur={(e) => {
                                setTimeout(() => {
                                  if (!savingAmount[enrollment.id]) {
                                    setEditingAmount(null);
                                    const currentValue = amountDraft[enrollment.id] !== undefined 
                                      ? amountDraft[enrollment.id] 
                                      : (enrollment as any).amount_paid || null;
                                    if (currentValue === ((enrollment as any).amount_paid || null)) {
                                      setAmountDraft(prev => {
                                        const newDraft = { ...prev };
                                        delete newDraft[enrollment.id];
                                        return newDraft;
                                      });
                                    }
                                  }
                                }, 200);
                              }}
                              placeholder={enrollment.formation?.price_ttc 
                                ? formatPrice(enrollment.formation.price_ttc, enrollment.formation.currency)
                                : '0'}
                              className="w-[120px] text-sm"
                              disabled={updating || savingAmount[enrollment.id]}
                              step="0.01"
                              min="0"
                            />
                            {editingAmount === enrollment.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleSaveAmount(enrollment.id);
                                  setEditingAmount(null);
                                }}
                                disabled={updating || savingAmount[enrollment.id] || 
                                  (amountDraft[enrollment.id] === undefined || 
                                   amountDraft[enrollment.id] === ((enrollment as any).amount_paid || null))}
                                className="mt-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                }}
                              >
                                {savingAmount[enrollment.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          {!editingAmount || editingAmount !== enrollment.id ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatPrice(
                                (enrollment as any).amount_paid !== null && (enrollment as any).amount_paid !== undefined
                                  ? (enrollment as any).amount_paid
                                  : (enrollment.formation?.price_ttc || enrollment.formation?.price || 0),
                                enrollment.formation?.currency
                              )}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Textarea
                              value={notesDraft[enrollment.id] !== undefined 
                                ? notesDraft[enrollment.id] 
                                : enrollment.commercial_notes || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                // Store in draft
                                setNotesDraft(prev => ({
                                  ...prev,
                                  [enrollment.id]: newValue
                                }));
                              }}
                              onFocus={() => {
                                // Show save button when focusing on textarea
                                setEditingNotes(enrollment.id);
                                // Initialize draft if not exists
                                if (notesDraft[enrollment.id] === undefined) {
                                  setNotesDraft(prev => ({
                                    ...prev,
                                    [enrollment.id]: enrollment.commercial_notes || ''
                                  }));
                                }
                              }}
                              onBlur={(e) => {
                                // Don't hide immediately - wait a bit to allow clicking save button
                                setTimeout(() => {
                                  // Only hide if not saving
                                  if (!savingNotes[enrollment.id]) {
                                    setEditingNotes(null);
                                    // Clear draft if no changes
                                    const currentValue = notesDraft[enrollment.id] || enrollment.commercial_notes || '';
                                    if (currentValue === (enrollment.commercial_notes || '')) {
                                      setNotesDraft(prev => {
                                        const newDraft = { ...prev };
                                        delete newDraft[enrollment.id];
                                        return newDraft;
                                      });
                                    }
                                  }
                                }, 200);
                              }}
                              placeholder="Ajoutez des notes..."
                              className="min-w-[200px] max-w-[300px] text-sm resize-none"
                              rows={2}
                              disabled={updating || savingNotes[enrollment.id]}
                            />
                            {editingNotes === enrollment.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleSaveNotes(enrollment.id);
                                  setEditingNotes(null);
                                }}
                                disabled={updating || savingNotes[enrollment.id] || 
                                  (notesDraft[enrollment.id] === undefined || 
                                   notesDraft[enrollment.id] === (enrollment.commercial_notes || ''))}
                                className="mt-0"
                                onMouseDown={(e) => {
                                  // Prevent blur event when clicking save button
                                  e.preventDefault();
                                }}
                              >
                                {savingNotes[enrollment.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {enrollment.language_preference === 'ar' ? 'عربي' : 'FR'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(enrollment.enrollment_date)}</div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(enrollment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredEnrollments.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune inscription trouvée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedEnrollment && (
              <>
                <DialogHeader>
                  <DialogTitle>Détails de l'inscription</DialogTitle>
                  <DialogDescription>
                    {selectedEnrollment.full_name} - {formatDate(selectedEnrollment.enrollment_date)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations de contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Nom:</strong> {selectedEnrollment.full_name}</div>
                      <div><strong>Email:</strong> {selectedEnrollment.email}</div>
                      <div><strong>Téléphone:</strong> {selectedEnrollment.phone}</div>
                      {selectedEnrollment.company && (
                        <div><strong>Entreprise:</strong> {selectedEnrollment.company}</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status Update */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Statut de l'inscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className="text-sm font-medium mb-2">Statut Lead:</p>
                        <div className="flex gap-2 flex-wrap">
                          {unifiedStatusOptions.map(opt => {
                            const isSelected = getUnifiedStatus(selectedEnrollment) === opt.value;
                            return (
                              <Button
                                key={opt.value}
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  // Update based on unified status
                                  const updates: any = {};
                                  if (['nouveau', 'confirme', 'a_confirme', 'nos_repond_pas', 'pas_interest'].includes(opt.value)) {
                                    updates.lead_status = opt.value;
                                    if (opt.value === 'confirme') {
                                      updates.status = 'confirmed';
                                    } else if (opt.value === 'nouveau') {
                                      updates.status = 'pending';
                                    } else {
                                      // For a_confirme, nos_repond_pas, pas_interest: keep status as pending or confirmed
                                      // Don't override if it's already completed/cancelled
                                      const currentStatus = (selectedEnrollment.status || '').toLowerCase();
                                      if (currentStatus !== 'completed' && currentStatus !== 'cancelled') {
                                        updates.status = 'pending';
                                      }
                                    }
                                  } else if (opt.value === 'completed') {
                                    updates.status = 'completed';
                                    updates.lead_status = 'confirme';
                                  } else if (opt.value === 'cancelled') {
                                    updates.status = 'cancelled';
                                    updates.lead_status = 'pas_interest';
                                  }
                                  handleUpdateUnifiedStatus(selectedEnrollment.id, updates);
                                }}
                                disabled={updating}
                                className={isSelected ? opt.color : ''}
                              >
                                {opt.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes commerciales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={selectedEnrollment.commercial_notes || ''}
                        onChange={(e) => handleUpdateNotes(e.target.value)}
                        placeholder="Ajoutez vos notes..."
                        rows={5}
                        onBlur={(e) => handleUpdateNotes(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default EnrollmentsCRM;




