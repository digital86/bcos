import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, Loader2, Save, X, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import type { SiteSetting, Statistic } from '../../../supabase-config';

const Settings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [deletingSetting, setDeletingSetting] = useState<SiteSetting | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Statistics management
  const [isStatsFormOpen, setIsStatsFormOpen] = useState(false);
  const [editingStatistic, setEditingStatistic] = useState<Statistic | null>(null);
  const [deletingStatistic, setDeletingStatistic] = useState<Statistic | null>(null);
  const [savingStatistic, setSavingStatistic] = useState(false);
  
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    type: 'text' as 'text' | 'number' | 'boolean' | 'json' | 'url' | 'email',
    is_public: false,
  });

  const [statFormData, setStatFormData] = useState({
    key: '',
    value: '',
    label_fr: '',
    label_ar: '',
    icon_name: '',
    is_visible: true,
    display_order: 0,
  });

  useEffect(() => {
    loadSettings();
    loadStatistics();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Use direct Supabase query to bypass RLS if needed
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key', { ascending: true });
      
      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('statistics')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setStatistics(data || []);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  const handleCreate = () => {
    setEditingSetting(null);
    setFormData({
      key: '',
      value: '',
      description: '',
      type: 'text',
      is_public: false,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (setting: SiteSetting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value || '',
      description: setting.description || '',
      type: setting.type,
      is_public: setting.is_public,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.key.trim()) {
      toast.error('La clé est requise');
      return;
    }

    try {
      setSaving(true);

      if (editingSetting) {
        const { data, error } = await supabase
          .from('site_settings')
          .update({
            value: formData.value,
            description: formData.description,
            type: formData.type,
            is_public: formData.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSetting.id)
          .select();
        
        if (error) throw error;
        toast.success('Paramètre mis à jour');
      } else {
        // Check if key already exists
        const existing = settings.find(s => s.key === formData.key.trim());
        if (existing) {
          toast.error('Cette clé existe déjà');
          return;
        }
        
        const { data, error } = await supabase
          .from('site_settings')
          .insert([{
            key: formData.key.trim(),
            value: formData.value,
            description: formData.description,
            type: formData.type,
            is_public: formData.is_public,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
        
        if (error) throw error;
        toast.success('Paramètre créé');
      }

      setIsFormOpen(false);
      loadSettings();
    } catch (error: any) {
      console.error('Error saving setting:', error);
      toast.error('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSetting) return;

    try {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('id', deletingSetting.id);
      
      if (error) throw error;
      toast.success('Paramètre supprimé');
      setDeletingSetting(null);
      loadSettings();
    } catch (error: any) {
      console.error('Error deleting setting:', error);
      toast.error('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    }
  };

  // Statistics handlers
  const handleStatisticCreate = () => {
    setEditingStatistic(null);
    setStatFormData({
      key: '',
      value: '',
      label_fr: '',
      label_ar: '',
      icon_name: '',
      is_visible: true,
      display_order: statistics.length,
    });
    setIsStatsFormOpen(true);
  };

  const handleStatisticEdit = (statistic: Statistic) => {
    setEditingStatistic(statistic);
    setStatFormData({
      key: statistic.key,
      value: statistic.value,
      label_fr: statistic.label_fr,
      label_ar: statistic.label_ar || '',
      icon_name: statistic.icon_name || '',
      is_visible: statistic.is_visible,
      display_order: statistic.display_order,
    });
    setIsStatsFormOpen(true);
  };

  const handleStatisticSave = async () => {
    if (!statFormData.key.trim() || !statFormData.value.trim()) {
      toast.error('Les champs Clé et Valeur sont requis');
      return;
    }

    try {
      setSavingStatistic(true);

      if (editingStatistic) {
        const { error } = await supabase
          .from('statistics')
          .update({
            value: statFormData.value,
            label_fr: statFormData.label_fr,
            label_ar: statFormData.label_ar || null,
            icon_name: statFormData.icon_name || null,
            is_visible: statFormData.is_visible,
            display_order: statFormData.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStatistic.id);
        
        if (error) throw error;
        toast.success('Statistique mise à jour');
      } else {
        // Check if key already exists
        const existing = statistics.find(s => s.key === statFormData.key.trim());
        if (existing) {
          toast.error('Cette clé existe déjà');
          return;
        }
        
        const { error } = await supabase
          .from('statistics')
          .insert([{
            key: statFormData.key.trim(),
            value: statFormData.value,
            label_fr: statFormData.label_fr,
            label_ar: statFormData.label_ar || null,
            icon_name: statFormData.icon_name || null,
            is_visible: statFormData.is_visible,
            display_order: statFormData.display_order,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
        toast.success('Statistique ajoutée');
      }
      
      setIsStatsFormOpen(false);
      setEditingStatistic(null);
      loadStatistics();
    } catch (error: any) {
      console.error('Error saving statistic:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSavingStatistic(false);
    }
  };

  const handleStatisticDelete = async () => {
    if (!deletingStatistic) return;
    
    try {
      setSavingStatistic(true);
      const { error } = await supabase
        .from('statistics')
        .delete()
        .eq('id', deletingStatistic.id);
      
      if (error) throw error;
      toast.success('Statistique supprimée');
      loadStatistics();
      setDeletingStatistic(null);
    } catch (error: any) {
      console.error('Error deleting statistic:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSavingStatistic(false);
    }
  };

  const handleToggleVisibility = async (statistic: Statistic) => {
    try {
      const { error } = await supabase
        .from('statistics')
        .update({
          is_visible: !statistic.is_visible,
          updated_at: new Date().toISOString()
        })
        .eq('id', statistic.id);
      
      if (error) throw error;
      toast.success(`Statistique ${!statistic.is_visible ? 'affichée' : 'masquée'}`);
      loadStatistics();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleOrderChange = async (statistic: Statistic, direction: 'up' | 'down') => {
    const currentIndex = statistics.findIndex(s => s.id === statistic.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= statistics.length) return;

    const targetStatistic = statistics[newIndex];
    
    try {
      // Swap display_order values
      await supabase
        .from('statistics')
        .update({
          display_order: targetStatistic.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', statistic.id);
      
      await supabase
        .from('statistics')
        .update({
          display_order: statistic.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetStatistic.id);
      
      loadStatistics();
    } catch (error: any) {
      console.error('Error changing order:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const getValueDisplay = (setting: SiteSetting) => {
    if (setting.type === 'boolean') {
      return setting.value === 'true' || setting.value === '1' ? 'Oui' : 'Non';
    }
    if (setting.type === 'json') {
      try {
        return JSON.stringify(JSON.parse(setting.value || '{}'), null, 2);
      } catch {
        return setting.value || '';
      }
    }
    return setting.value || '—';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres du site</h1>
            <p className="text-gray-600 mt-1">Gérez les paramètres de configuration du site</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un paramètre
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des paramètres</CardTitle>
            <CardDescription>
              {settings.length} paramètre(s) configuré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Public</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={getValueDisplay(setting)}>
                          {getValueDisplay(setting)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {setting.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {setting.description || '—'}
                      </TableCell>
                      <TableCell>
                        {setting.is_public ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Public
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Privé
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingSetting(setting)}
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

              {settings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Aucun paramètre configuré</p>
                  <Button onClick={handleCreate} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter le premier paramètre
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSetting ? 'Modifier le paramètre' : 'Nouveau paramètre'}
              </DialogTitle>
              <DialogDescription>
                {editingSetting 
                  ? 'Modifiez les informations du paramètre'
                  : 'Ajoutez un nouveau paramètre de configuration'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Clé *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="ex: site_name"
                  disabled={!!editingSetting}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingSetting 
                    ? 'La clé ne peut pas être modifiée'
                    : 'Identifiant unique du paramètre (ne peut pas être modifié après création)'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texte</SelectItem>
                    <SelectItem value="number">Nombre</SelectItem>
                    <SelectItem value="boolean">Booléen</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Valeur</Label>
                {formData.type === 'boolean' ? (
                  <Select
                    value={formData.value}
                    onValueChange={(value) => setFormData({ ...formData, value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
                ) : formData.type === 'json' ? (
                  <Textarea
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                ) : (
                  <Input
                    id="value"
                    type={formData.type === 'number' ? 'number' : formData.type === 'email' ? 'email' : 'text'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={
                      formData.type === 'url' ? 'https://example.com' :
                      formData.type === 'email' ? 'email@example.com' :
                      'Valeur du paramètre'
                    }
                  />
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du paramètre"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="is_public" className="cursor-pointer">
                  Paramètre public (accessible depuis le frontend)
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingSetting ? 'Mettre à jour' : 'Créer'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingSetting} onOpenChange={() => setDeletingSetting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le paramètre</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le paramètre "{deletingSetting?.key}" ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Statistics Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Statistiques du site</h2>
              <p className="text-gray-600 mt-1">Modifiez uniquement les valeurs (nombres) des statistiques affichées sur la page Formations</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des statistiques</CardTitle>
              <CardDescription>
                {statistics.length} statistique(s) configurée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordre</TableHead>
                      <TableHead>Clé</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Label (FR)</TableHead>
                      <TableHead>Label (AR)</TableHead>
                      <TableHead>Icône</TableHead>
                      <TableHead>Visible</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.map((statistic, index) => (
                      <TableRow key={statistic.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOrderChange(statistic, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              {statistic.display_order}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOrderChange(statistic, 'down')}
                              disabled={index === statistics.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{statistic.key}</TableCell>
                        <TableCell className="font-semibold">{statistic.value}</TableCell>
                        <TableCell>{statistic.label_fr}</TableCell>
                        <TableCell>{statistic.label_ar || '—'}</TableCell>
                        <TableCell>
                          {statistic.icon_name ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {statistic.icon_name}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVisibility(statistic)}
                            className={statistic.is_visible ? 'text-green-600' : 'text-gray-400'}
                          >
                            {statistic.is_visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatisticEdit(statistic)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingStatistic(statistic)}
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

                {statistics.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Aucune statistique configurée</p>
                    <p className="text-sm text-gray-400 mt-2">Appliquez la migration pour créer les statistiques par défaut</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Create/Edit Dialog */}
          <Dialog open={isStatsFormOpen} onOpenChange={setIsStatsFormOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Modifier la valeur de la statistique
                </DialogTitle>
                <DialogDescription>
                  Modifiez uniquement la valeur (nombre) de la statistique. Les labels et autres paramètres sont fixes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="stat-key">Clé</Label>
                  <Input
                    id="stat-key"
                    value={statFormData.key}
                    disabled
                    className="font-mono bg-gray-50 cursor-not-allowed"
                    placeholder="ex: formations_count"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La clé est fixe et ne peut pas être modifiée
                  </p>
                </div>

                <div>
                  <Label htmlFor="stat-value">Valeur *</Label>
                  <Input
                    id="stat-value"
                    value={statFormData.value}
                    onChange={(e) => setStatFormData({ ...statFormData, value: e.target.value })}
                    placeholder="ex: 22+"
                  />
                </div>

                <div>
                  <Label htmlFor="stat-label-fr">Label (Français)</Label>
                  <Input
                    id="stat-label-fr"
                    value={statFormData.label_fr}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                    placeholder="ex: Formations disponibles"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce label est fixe et ne peut pas être modifié
                  </p>
                </div>

                <div>
                  <Label htmlFor="stat-label-ar">Label (Arabe)</Label>
                  <Input
                    id="stat-label-ar"
                    value={statFormData.label_ar}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                    placeholder="ex: الدورات المتاحة"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce label est fixe et ne peut pas être modifié
                  </p>
                </div>

                <div>
                  <Label htmlFor="stat-icon">Nom de l'icône (Lucide React)</Label>
                  <Input
                    id="stat-icon"
                    value={statFormData.icon_name}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                    placeholder="ex: BookOpen, Users, Star"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    L'icône est fixe et ne peut pas être modifiée
                  </p>
                </div>

                <div>
                  <Label htmlFor="stat-order">Ordre d'affichage</Label>
                  <Input
                    id="stat-order"
                    type="number"
                    value={statFormData.display_order}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez les flèches dans le tableau pour changer l'ordre
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="stat-visible"
                    checked={statFormData.is_visible}
                    onChange={(e) => setStatFormData({ ...statFormData, is_visible: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <Label htmlFor="stat-visible" className="cursor-pointer">
                    Afficher sur la page publique
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsStatsFormOpen(false)}
                    disabled={savingStatistic}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleStatisticSave} disabled={savingStatistic}>
                    {savingStatistic ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingStatistic ? 'Mettre à jour' : 'Créer'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Statistics Delete Confirmation */}
          <AlertDialog open={!!deletingStatistic} onOpenChange={() => setDeletingStatistic(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la statistique</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer la statistique "{deletingStatistic?.key}" ?
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleStatisticDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;

