import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Building,
  Calendar,
  Loader2,
  MessageSquare
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { toast } from 'sonner';

interface Enrollment {
  id: string;
  formation_id: string;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  experience_level: string;
  motivation?: string;
  preferred_date?: string;
  how_did_you_hear: string;
  special_requirements?: string;
  status: string;
  lead_status: string;
  commercial_notes?: string;
  contact_date?: string;
  follow_up_date?: string;
  lead_source: string;
  enrollment_date: string;
  formation?: {
    title: string;
    slug: string;
    price: number;
    currency: string;
  };
}

const Enrollments = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Lead status options
  const leadStatusOptions = [
    { value: 'nouveau', label: 'Nouveau', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    { value: 'confirme', label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'a_confirme', label: 'À confirmer', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'nos_repond_pas', label: 'Ne répond pas', color: 'bg-orange-100 text-orange-800', icon: XCircle },
    { value: 'pas_interest', label: 'Pas intéressé', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  const statusOptions = [
    { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmé', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' }
  ];

  // Load enrollments
  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        setLoading(true);
        const data = await SimpleSupabaseService.getAllEnrollments();
        setEnrollments(data || []);
      } catch (error) {
        console.error('Error loading enrollments:', error);
        toast.error('Erreur lors du chargement des inscriptions');
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, []);

  // Filter enrollments
  useEffect(() => {
    let filtered = enrollments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(enrollment =>
        enrollment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.formation?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }

    // Lead status filter
    if (leadStatusFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.lead_status === leadStatusFilter);
    }

    setFilteredEnrollments(filtered);
  }, [enrollments, searchTerm, statusFilter, leadStatusFilter]);

  const getLeadStatusConfig = (status: string) => {
    return leadStatusOptions.find(option => option.value === status) || leadStatusOptions[0];
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEnrollment = async (updates: any) => {
    if (!selectedEnrollment) return;

    try {
      setUpdating(true);
      await SimpleSupabaseService.updateEnrollmentStatus(selectedEnrollment.id, updates);
      
      // Update local state
      setEnrollments(prev => 
        prev.map(enrollment => 
          enrollment.id === selectedEnrollment.id 
            ? { ...enrollment, ...updates }
            : enrollment
        )
      );

      toast.success('Inscription mise à jour avec succès');
      setIsEditDialogOpen(false);
      setSelectedEnrollment(null);
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) return;

    try {
      await SimpleSupabaseService.deleteEnrollment(id);
      setEnrollments(prev => prev.filter(enrollment => enrollment.id !== id));
      toast.success('Inscription supprimée avec succès');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    // Convert DA to DZD (Algerian Dinar ISO 4217 code)
    const currencyCode = currency === 'DA' ? 'DZD' : currency;
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode
      }).format(price);
    } catch (error) {
      // Fallback: just show number with currency text
      return `${price.toLocaleString('fr-FR')} ${currency}`;
    }
  };

  // Statistics
  const stats = {
    total: enrollments.length,
    nouveau: enrollments.filter(e => e.lead_status === 'nouveau').length,
    confirme: enrollments.filter(e => e.lead_status === 'confirme').length,
    pending: enrollments.filter(e => e.status === 'pending').length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement des inscriptions...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Inscriptions</h1>
            <p className="text-gray-600 mt-1">Gérez les inscriptions et le suivi commercial</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Nouveaux</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.nouveau}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.confirme}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Inscriptions</CardTitle>
            <CardDescription>Gérez et suivez toutes les inscriptions aux formations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, email, entreprise ou formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Statut inscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Statut commercial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les leads</SelectItem>
                  {leadStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enrollments Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut Lead</TableHead>
                    <TableHead>Statut Inscription</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment) => {
                    const leadConfig = getLeadStatusConfig(enrollment.lead_status);
                    const statusConfig = getStatusConfig(enrollment.status);
                    const IconComponent = leadConfig.icon;

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.full_name}</div>
                            {enrollment.company && (
                              <div className="text-sm text-gray-500">{enrollment.company}</div>
                            )}
                            {enrollment.position && (
                              <div className="text-xs text-gray-400">{enrollment.position}</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.formation?.title || 'Formation supprimée'}</div>
                            {enrollment.formation?.price && (
                              <div className="text-sm text-gray-500">
                                {formatPrice(enrollment.formation.price, enrollment.formation.currency)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1" />
                              {enrollment.email}
                            </div>
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1" />
                              {enrollment.phone}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={leadConfig.color} variant="secondary">
                            <IconComponent className="w-3 h-3 mr-1" />
                            {leadConfig.label}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={statusConfig.color} variant="secondary">
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(enrollment.enrollment_date)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEnrollment(enrollment)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteEnrollment(enrollment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
                <p className="text-gray-400">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'inscription</DialogTitle>
              <DialogDescription>
                Mise à jour du statut commercial et des notes pour {selectedEnrollment?.full_name}
              </DialogDescription>
            </DialogHeader>

            {selectedEnrollment && (
              <EnrollmentEditForm
                enrollment={selectedEnrollment}
                onUpdate={handleUpdateEnrollment}
                updating={updating}
                leadStatusOptions={leadStatusOptions}
                statusOptions={statusOptions}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

// Edit Form Component
const EnrollmentEditForm = ({ 
  enrollment, 
  onUpdate, 
  updating, 
  leadStatusOptions, 
  statusOptions 
}: {
  enrollment: Enrollment;
  onUpdate: (updates: any) => void;
  updating: boolean;
  leadStatusOptions: any[];
  statusOptions: any[];
}) => {
  const [formData, setFormData] = useState({
    lead_status: enrollment.lead_status,
    status: enrollment.status,
    commercial_notes: enrollment.commercial_notes || '',
    contact_date: enrollment.contact_date ? enrollment.contact_date.split('T')[0] : '',
    follow_up_date: enrollment.follow_up_date ? enrollment.follow_up_date.split('T')[0] : ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates = {
      ...formData,
      contact_date: formData.contact_date ? new Date(formData.contact_date).toISOString() : null,
      follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null
    };

    onUpdate(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Statut Commercial</Label>
          <Select 
            value={formData.lead_status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, lead_status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leadStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut Inscription</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de contact</Label>
          <Input
            type="date"
            value={formData.contact_date}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_date: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Date de suivi</Label>
          <Input
            type="date"
            value={formData.follow_up_date}
            onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes commerciales</Label>
        <Textarea
          value={formData.commercial_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, commercial_notes: e.target.value }))}
          placeholder="Ajoutez vos notes sur le contact avec ce prospect..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={updating}
          className="bg-accent hover:bg-accent/90"
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            'Mettre à jour'
          )}
        </Button>
      </div>
    </form>
  );
};

export default Enrollments;




