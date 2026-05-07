import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Coins, FileText, ArrowUpRight, ArrowDownRight, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#253b74', '#84cc16', '#ffc658', '#ff7f50'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstandingInvoices: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    totalExpenses: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();

    const channel = supabase.channel('analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
        console.log("Realtime update triggered by enrollments");
        loadAnalytics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        loadAnalytics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_transactions' }, () => {
        loadAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch CRM Enrollments for Primary Revenue (Chiffre d'Affaires)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('status, lead_status, amount_paid, created_at');

      let totalRevenue = 0;
      const monthlyRevMap: Record<string, number> = {};

      if (enrollments) {
        enrollments.forEach((enrollment) => {
          const status = (enrollment.status || '').toLowerCase();
          const leadStatus = (enrollment.lead_status || '').toLowerCase();
          
          if (status === 'completed' || leadStatus === 'completed') {
            const amount = Number(enrollment.amount_paid) || 0;
            totalRevenue += amount;
            
            const date = new Date(enrollment.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyRevMap[monthKey] = (monthlyRevMap[monthKey] || 0) + amount;
          }
        });
      }

      // Sort by keys to force chronological YYYY-MM order
      const sortedKeys = Object.keys(monthlyRevMap).sort();
      const formattedRevenue = sortedKeys.map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return {
          name: date.toLocaleString('fr-FR', { month: 'short' }) + ' ' + year,
          revenue: monthlyRevMap[key]
        };
      });
      setRevenueData(formattedRevenue.length ? formattedRevenue : [{name: 'Ce mois', revenue: 0}]);

      // 2. Fetch Invoices for Outstanding Cash & Pie Chart distribution
      let outstanding = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let statuses: Record<string, number> = { Payée: 0, En_Attente: 0, Brouillon: 0 };

      const { data: invoices, error: invError } = await supabase.from('invoices').select('total_amount, status');
      
      if (invError && invError.code === '42P01') {
        console.warn("SQL Tables not initialized yet.");
      } else if (invoices) {
        invoices.forEach((inv) => {
          if (inv.status === 'paid') {
            paidCount++;
            statuses['Payée'] += 1;
          } else if (inv.status === 'sent' || inv.status === 'overdue') {
            outstanding += Number(inv.total_amount);
            pendingCount++;
            statuses['En_Attente'] += 1;
          } else if (inv.status === 'draft') {
            statuses['Brouillon'] += 1;
          }
        });
      }

      const formattedStatus = [
        { name: 'Payée', value: statuses['Payée'] || 0 },
        { name: 'En Attente', value: statuses['En_Attente'] || 0 },
        { name: 'Brouillon', value: statuses['Brouillon'] || 0 }
      ].filter(item => item.value > 0);
      setStatusData(formattedStatus.length ? formattedStatus : [{name: 'Aucun', value: 1}]);

      // 3. Fetch Expenses from Accounting
      let expenses = 0;
      const { data: transactions } = await supabase.from('accounting_transactions').select('amount').eq('type', 'expense');
      if (transactions) {
        expenses = transactions.reduce((sum, tr) => sum + Number(tr.amount), 0);
      }

      setStats({
        totalRevenue,
        outstandingInvoices: outstanding,
        paidInvoicesCount: paidCount,
        pendingInvoicesCount: pendingCount,
        totalExpenses: expenses
      });
      
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics & Comptabilité</h1>
          <p className="text-gray-600 mt-1">Aperçu financier et évolution des factures</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalRevenue.toLocaleString()} DZD</h3>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Créances (En Attente)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.outstandingInvoices.toLocaleString()} DZD</h3>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <FileText className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dépenses (Exp)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalExpenses.toLocaleString()} DZD</h3>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <ArrowDownRight className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bénéfice Net</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{(stats.totalRevenue - stats.totalExpenses).toLocaleString()} DZD</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
                  <CardDescription>Revenu encaissé par mois (Inscriptions CRM Terminées)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                        <RechartsTooltip formatter={(value: number) => [`${value.toLocaleString()} DZD`, 'Revenu']} />
                        <Bar dataKey="revenue" fill="#253b74" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>État des Factures</CardTitle>
                  <CardDescription>Répartition par statut</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center space-x-4 mt-4 text-sm">
                      <div className="flex items-center"><div className="w-3 h-3 bg-[#253b74] rounded-full mr-2"></div>Payée</div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-[#84cc16] rounded-full mr-2"></div>Attente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Analytics;


