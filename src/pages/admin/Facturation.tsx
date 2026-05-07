import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Download,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  items: InvoiceItem[];
  notes: string;
}

const Facturation = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    invoice_number: `FA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    tax_rate: 19
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle case where table doesn't exist yet before user runs SQL
        if (error.code === '42P01') {
          console.log("Invoices table not created yet.");
          setInvoices([]);
          return;
        }
        throw error;
      }
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax_amount = subtotal * (taxRate / 100);
    return {
      subtotal,
      tax_amount,
      total_amount: subtotal + tax_amount
    };
  };

  const handleSaveInvoice = async () => {
    if (!currentInvoice.client_name) {
      toast.error('Le nom du client est requis');
      return;
    }
    if (!currentInvoice.items || currentInvoice.items.length === 0) {
      toast.error('Veuillez ajouter au moins un service/produit');
      return;
    }

    try {
      setSaving(true);
      const totals = calculateTotal(currentInvoice.items, currentInvoice.tax_rate || 19);
      
      const payload = {
        ...currentInvoice,
        ...totals,
        updated_at: new Date().toISOString()
      };

      if (!payload.id) {
        payload.id = crypto.randomUUID();
        const { error } = await supabase.from('invoices').insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (error) throw error;
        
        // Automatically add to accounting transactions if paid
        if (payload.status === 'paid') {
          await supabase.from('accounting_transactions').insert([{
            date: payload.issue_date,
            description: `Paiement Facture ${payload.invoice_number}`,
            amount: payload.total_amount,
            type: 'income',
            category: 'Sales',
            status: 'completed'
          }]);
        }
        toast.success('Facture créée avec succès');
      } else {
        const { error } = await supabase.from('invoices').update(payload).eq('id', payload.id);
        if (error) throw error;
        toast.success('Facture mise à jour avec succès');
      }
      setIsFormOpen(false);
      loadInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Erreur lors de la sauvegarde de la facture');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800 border-green-300">Payée</Badge>;
      case 'sent': return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Envoyée</Badge>;
      case 'overdue': return <Badge className="bg-red-100 text-red-800 border-red-300">En retard</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Annulée</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Brouillon</Badge>;
    }
  };

  const addItemRow = () => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), { description: '', quantity: 1, price: 0 }]
    }));
  };

  const updateItemRow = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setCurrentInvoice(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handlePrint = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <AdminLayout>
      <div className="print:hidden space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Facturation</h1>
            <p className="text-gray-600 mt-1">Gestion des factures et encaissements</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                setCurrentInvoice({
                  invoice_number: `FA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                  status: 'draft',
                  issue_date: new Date().toISOString().split('T')[0],
                  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  items: [{ description: 'Formation intra-entreprise', quantity: 1, price: 50000 }],
                  tax_rate: 19
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Facture
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{currentInvoice.id ? 'Éditer la facture' : 'Créer une facture'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">N° Facture</label>
                    <Input value={currentInvoice.invoice_number} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={currentInvoice.status}
                      onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as any})}
                    >
                      <option value="draft">Brouillon</option>
                      <option value="sent">Envoyée</option>
                      <option value="paid">Payée</option>
                      <option value="overdue">En retard</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <Input 
                      placeholder="Nom de l'entreprise ou client" 
                      value={currentInvoice.client_name || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, client_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Client</label>
                    <Input 
                      type="email"
                      placeholder="contact@client.com" 
                      value={currentInvoice.client_email || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, client_email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date d'émission</label>
                    <Input 
                      type="date"
                      value={currentInvoice.issue_date || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, issue_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date d'échéance</label>
                    <Input 
                      type="date"
                      value={currentInvoice.due_date || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, due_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Prestations</label>
                    <Button variant="outline" size="sm" onClick={addItemRow}>
                      <Plus className="w-4 h-4 mr-2" /> Ajouter Ligne
                    </Button>
                  </div>
                  
                  {currentInvoice.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <Input 
                        placeholder="Description" 
                        value={item.description}
                        onChange={e => updateItemRow(index, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input 
                        type="number" 
                        placeholder="Qté" 
                        value={item.quantity}
                        onChange={e => updateItemRow(index, 'quantity', parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <Input 
                        type="number" 
                        placeholder="Prix UP" 
                        value={item.price}
                        onChange={e => updateItemRow(index, 'price', parseFloat(e.target.value))}
                        className="w-32"
                      />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const newItems = [...(currentInvoice.items || [])];
                        newItems.splice(index, 1);
                        setCurrentInvoice({...currentInvoice, items: newItems});
                      }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA (%)</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8 p-1 text-right" 
                        value={currentInvoice.tax_rate} 
                        onChange={e => setCurrentInvoice({...currentInvoice, tax_rate: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 gap-2 border-t">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
                  <Button onClick={handleSaveInvoice} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Enregistrer la Facture
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Factures</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucune facture trouvée. (Exécutez le script SQL en premier!)</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">Numéro</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Montant TTC</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                        <td className="px-4 py-3">{inv.client_name}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(inv.issue_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold">{inv.total_amount?.toLocaleString()} DZD</td>
                        <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePrint(inv)}>
                              <Printer className="w-4 h-4 mr-2" /> PDF
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setCurrentInvoice(inv);
                              setIsFormOpen(true);
                            }}>
                              Éditer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Printable Invoice Section (Visible only when printing) */}
      {printingInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] px-8 pt-12 text-black">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              .print-container, .print-container * { visibility: visible; }
              .print-container { position: absolute; left: 0; top: 0; width: 100%; }
              @page { margin: 15mm; size: A4; }
            }
          `}} />
          
          <div className="print-container max-w-4xl mx-auto font-sans">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
              <div className="space-y-2">
                <img 
                  src="https://res.cloudinary.com/de88x1rlt/image/upload/v1776170249/bcos/general/BCOS-Main-Logo_nb1k5m.webp" 
                  alt="BCOS Logo" 
                  className="h-16 object-contain"
                />
                <div className="text-sm mt-4 text-gray-600">
                  <p className="font-bold text-gray-900">BCOS ALGERIA</p>
                  <p>123 Rue de l'Entreprise, Alger, Algérie</p>
                  <p>contact@bcos.dz | +213 555 12 34 56</p>
                  <p className="text-xs mt-1">RC: 1234567 | NIF: 987654321</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-5xl font-bold text-gray-900 tracking-wider">FACTURE</h1>
                <div className="mt-4 space-y-1">
                  <p className="text-gray-600 font-semibold text-lg">N° {printingInvoice.invoice_number}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(printingInvoice.issue_date).toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm text-gray-500">Échéance: {new Date(printingInvoice.due_date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-12 flex justify-end">
              <div className="w-1/2 p-6 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Facturé à :</h3>
                <p className="text-xl font-bold text-gray-900 mb-1">{printingInvoice.client_name}</p>
                {printingInvoice.client_email && <p className="text-sm text-gray-600">{printingInvoice.client_email}</p>}
                {printingInvoice.client_address && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{printingInvoice.client_address}</p>}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-12">
              <thead className="bg-[#253b74] text-white">
                <tr>
                  <th className="py-3 px-4 text-left font-medium rounded-tl-lg">Description</th>
                  <th className="py-3 px-4 text-center font-medium">Qté</th>
                  <th className="py-3 px-4 text-right font-medium">Prix Unitaire</th>
                  <th className="py-3 px-4 text-right font-medium rounded-tr-lg">Montant HT</th>
                </tr>
              </thead>
              <tbody className="border-b-2 border-gray-200">
                {printingInvoice.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-800">{item.description}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-4 px-4 text-right text-gray-600">{item.price.toLocaleString()} DZD</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">{(item.quantity * item.price).toLocaleString()} DZD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-16">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Sous-total HT</span>
                  <span className="font-semibold">{printingInvoice.subtotal?.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">TVA ({printingInvoice.tax_rate}%)</span>
                  <span className="font-semibold">{printingInvoice.tax_amount?.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between py-4 text-xl font-bold text-[#253b74]">
                  <span>Total TTC</span>
                  <span>{printingInvoice.total_amount?.toLocaleString()} DZD</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-8 mt-auto flex justify-between text-sm text-gray-500">
              <div>
                <p className="font-bold text-gray-900 mb-1">Modalités de paiement</p>
                <p>Virement Bancaire (RIB: 001 00123 4567890 12)</p>
                <p>Chèque à l'ordre de BCOS</p>
              </div>
              <div className="text-right flex items-end">
                <p className="italic">Merci pour votre confiance.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Facturation;
