import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SupabaseService } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Edit, Image as ImageIcon, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import MediaPicker from '@/components/admin/MediaPicker';

type CompanyEvent = {
  id: string;
  title?: string;
  title_fr?: string;
  title_ar?: string;
  description?: string;
  description_fr?: string;
  description_ar?: string;
  slug?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  image_url?: string;
  gallery_images?: string[];
  tags?: string[];
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

const ActualiteManagement = () => {
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'main' | 'gallery'>('main');
  const [importingFB, setImportingFB] = useState(false);
  const [fbLink, setFbLink] = useState('');
  const [form, setForm] = useState<Partial<CompanyEvent>>({
    title_fr: '',
    title_ar: '',
    description_fr: '',
    description_ar: '',
    event_date: '',
    event_time: '',
    location: '',
    image_url: '',
    gallery_images: [],
    is_published: true,
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getCompanyEvents(true);
      setEvents(data || []);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setForm({
      title_fr: '',
      title_ar: '',
      description_fr: '',
      description_ar: '',
      event_date: '',
      event_time: '',
      location: '',
      image_url: '',
      gallery_images: [],
      is_published: true,
    });
    setEditing(null);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
      };
      if (editing) {
        await SupabaseService.updateCompanyEvent(editing.id, payload);
        toast.success('Événement mis à jour');
      } else {
        await SupabaseService.createCompanyEvent(payload);
        toast.success('Événement créé');
      }
      setOpen(false);
      resetForm();
      loadEvents();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await SupabaseService.deleteCompanyEvent(id);
      toast.success('Événement supprimé');
      loadEvents();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  const createDemo = async () => {
    try {
      setSeeding(true);
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      await SupabaseService.createCompanyEvent({
        title_fr: 'BCOS Événementiel: Journée Portes Ouvertes',
        title_ar: 'فعالية BCOS: الأبواب المفتوحة',
        description_fr: 'Découvrez nos formations, nos formateurs et nos offres e-learning lors d’une journée exceptionnelle. Networking, démonstrations et ateliers.',
        description_ar: 'اكتشفوا دوراتنا ومدربينا وعروض التعلم الإلكتروني في يوم مميز. تواصل، عروض توضيحية وورشات.',
        event_date: dateStr,
        event_time: '09:00-17:00',
        location: 'Alger, Hydra',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
        is_published: true,
        tags: ['BCOS', 'Événement', 'Portes ouvertes']
      });
      toast.success('Actualité démo créée');
      loadEvents();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création de la démo');
    } finally {
      setSeeding(false);
    }
  };

  const handleImportFB = async () => {
    if (!fbLink) {
      toast.error('Veuillez entrer un lien Facebook');
      return;
    }
    try {
      setImportingFB(true);
      let rawLink = fbLink.trim();
      
      // Si l'utilisateur colle le code iframe
      if (rawLink.startsWith('<iframe')) {
        const srcMatch = rawLink.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
          rawLink = srcMatch[1];
        }
      }

      // Si le lien est déjà un lien plugin avec "href=" dedans
      let finalFbUrl = rawLink;
      if (rawLink.includes('plugins/post.php')) {
        try {
          const urlObj = new URL(rawLink.replace(/&amp;/g, '&'));
          finalFbUrl = urlObj.searchParams.get('href') || rawLink;
        } catch (e) {
          // Fallback parsing
        }
      }

      const pluginUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(finalFbUrl)}&show_text=true`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(pluginUrl)}`;
      const response = await fetch(proxyUrl);
      const htmlText = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // 1. Extraire le texte complet
      const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent);
      let fullText = paragraphs.join('\n\n');

      if (!fullText) {
        const descMatch = htmlText.match(/<meta name="description" content="([^"]+)"/);
        if (descMatch) {
            const txt = document.createElement("textarea");
            txt.innerHTML = descMatch[1];
            fullText = txt.value;
        }
      }

      // 2. Extraire la date, l'heure et toutes les images
      let dateStr = '';
      let timeStr = '';
      const imagesSet = new Set<string>();

      const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
      scripts.forEach(script => {
        try {
          const content = script.textContent || '';
          const lines = content.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            const json = JSON.parse(line);
            
            if (json.dateCreated) {
              const dateObj = new Date(json.dateCreated);
              if (!dateStr && !isNaN(dateObj.getTime())) {
                dateStr = dateObj.toISOString().slice(0, 10);
                timeStr = dateObj.toTimeString().slice(0, 5);
              }
            }
            if (json.image && Array.isArray(json.image)) {
              json.image.forEach((img: any) => {
                if (img.contentUrl) imagesSet.add(img.contentUrl);
              });
            } else if (json.image && typeof json.image === 'string') {
                imagesSet.add(json.image);
            }
          }
        } catch(e) {}
      });

      // Fallback images extraction
      if (imagesSet.size === 0) {
        const imgTags = Array.from(doc.querySelectorAll('img'));
        imgTags.forEach(img => {
            if (img.src && img.src.includes('scontent')) {
                imagesSet.add(img.src);
            }
        });
      }

      const imagesArray = Array.from(imagesSet);
      
      setForm((f) => ({
        ...f,
        description_fr: fullText || f.description_fr,
        description_ar: fullText || f.description_ar,
        event_date: dateStr || f.event_date,
        event_time: timeStr || f.event_time,
        image_url: imagesArray[0] || f.image_url,
        gallery_images: imagesArray.slice(1).length > 0 ? imagesArray.slice(1) : f.gallery_images,
      }));

      toast.success('Données importées avec succès');
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'importation");
    } finally {
      setImportingFB(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Actualité</h1>
            <p className="text-muted-foreground">Gérer les activités et événements de l’entreprise</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={createDemo} disabled={seeding}>
              {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Créer démo
            </Button>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Événements</CardTitle>
            <CardDescription>Tous les événements</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre (FR)</TableHead>
                      <TableHead>Titre (AR)</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Publié</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-medium">{ev.title_fr || ev.title}</TableCell>
                        <TableCell>{ev.title_ar || ''}</TableCell>
                        <TableCell>
                          {ev.event_date
                            ? new Date(ev.event_date).toLocaleDateString('fr-FR')
                            : ''}
                        </TableCell>
                        <TableCell>{ev.location || ''}</TableCell>
                        <TableCell>{ev.is_published ? 'Oui' : 'Non'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Voir FR"
                              onClick={() => window.open(`/fr/actualite/${ev.slug || ev.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Voir AR"
                              onClick={() => window.open(`/ar/actualite/${ev.slug || ev.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(ev);
                                setForm({
                                  title_fr: ev.title_fr || '',
                                  title_ar: ev.title_ar || '',
                                  description_fr: ev.description_fr || '',
                                  description_ar: ev.description_ar || '',
                                  event_date: ev.event_date || '',
                                  event_time: ev.event_time || '',
                                  location: ev.location || '',
                                  image_url: ev.image_url || '',
                                  gallery_images: ev.gallery_images || [],
                                  is_published: !!ev.is_published,
                                });
                                setOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => onDelete(ev.id)}
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier' : 'Ajouter'} un événement</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2 mb-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <Label>Importer depuis Facebook</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://www.facebook.com/..." 
                    value={fbLink}
                    onChange={(e) => setFbLink(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={handleImportFB} disabled={importingFB}>
                    {importingFB ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Importer
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Importe automatiquement le titre, la description et l'image à partir d'un lien (ex: Facebook).</p>
              </div>
              <div>
                <Label>Titre (FR)</Label>
                <Input
                  value={form.title_fr || ''}
                  onChange={(e) => setForm((f) => ({ ...f, title_fr: e.target.value }))}
                />
              </div>
              <div>
                <Label>Titre (AR)</Label>
                <Input
                  value={form.title_ar || ''}
                  onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Description (FR)</Label>
                <Textarea
                  value={form.description_fr || ''}
                  onChange={(e) => setForm((f) => ({ ...f, description_fr: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Description (AR)</Label>
                <Textarea
                  value={form.description_ar || ''}
                  onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.event_date || ''}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  placeholder="08:30-10:00"
                  value={form.event_time || ''}
                  onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Lieu</Label>
                <Input
                  value={form.location || ''}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label>Image Principale</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.image_url || ''}
                      onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                      placeholder="URL de l'image principale"
                    />
                    <Button type="button" variant="outline" onClick={() => { setMediaPickerTarget('main'); setMediaPickerOpen(true); }}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Médiathèque
                    </Button>
                  </div>
                  {form.image_url && (
                    <div className="mt-2 relative w-64 aspect-video rounded-lg overflow-hidden border">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Galerie d'images (Optionnel)</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setMediaPickerTarget('gallery'); setMediaPickerOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter à la galerie
                    </Button>
                  </div>
                  {form.gallery_images && form.gallery_images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {form.gallery_images.map((img, i) => (
                        <div key={i} className="relative aspect-square border rounded-lg overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setForm(f => ({ ...f, gallery_images: f.gallery_images?.filter((_, idx) => idx !== i) }))}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Switch
                  checked={!!form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                />
                <Label>Publié</Label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <MediaPicker
          open={mediaPickerOpen}
          onOpenChange={setMediaPickerOpen}
          onSelect={(url) => {
            if (mediaPickerTarget === 'main') {
              setForm((f) => ({ ...f, image_url: url }));
            } else {
              setForm((f) => ({ ...f, gallery_images: [...(f.gallery_images || []), url] }));
            }
          }}
          preferredType="actualites"
        />
      </div>
    </AdminLayout>
  );
};

export default ActualiteManagement;
