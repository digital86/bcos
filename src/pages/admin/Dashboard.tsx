import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, MessageSquare, BarChart3, Calendar, Settings, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { SupabaseService } from '@/lib/supabase';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    revenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const enrollments = await SimpleSupabaseService.getAllEnrollments() || [];
      const formations = await SupabaseService.getFormations() || [];
      
      let totalRevenue = 0;
      enrollments.forEach((enrollment: any) => {
        const isPaid = enrollment.status === 'completed' || 
                      enrollment.status === 'confirmed' ||
                      enrollment.lead_status === 'confirme';
        
        if (isPaid) {
          if (enrollment.amount_paid) {
            totalRevenue += Number(enrollment.amount_paid);
          } else if (enrollment.formation?.price_ttc) {
            totalRevenue += Number(enrollment.formation.price_ttc);
          } else if (enrollment.formation?.price) {
            totalRevenue += Number(enrollment.formation.price);
          }
        }
      });

      setStats({
        totalUsers: enrollments.length,
        activeCourses: formations.filter((f: any) => f.is_active !== false).length,
        totalEnrollments: enrollments.length,
        revenue: totalRevenue,
      });

      const latestActivities = [...enrollments]
        .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 6)
        .map((e: any) => ({
          action: `Nouvelle inscription: ${e.formation_name || e.formation_title || 'Formation'}`,
          user: `${e.first_name || ''} ${e.last_name || ''} (${e.company || 'Particulier'})`,
          time: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Récemment'
        }));
      setRecentActivities(latestActivities);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      id: 'enrollments',
      title: 'Total Inscriptions',
      value: loading ? '...' : stats.totalEnrollments.toLocaleString(),
      description: 'Total des inscriptions',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'active_courses',
      title: 'Formations Actives',
      value: loading ? '...' : stats.activeCourses.toString(),
      description: 'Formations disponibles',
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      value: loading ? '...' : stats.totalUsers.toLocaleString(),
      description: 'Utilisateurs inscrits',
      icon: Users,
      color: 'text-orange-600'
    },
    {
      id: 'revenue',
      title: 'Revenus',
      value: loading ? '...' : formatCurrency(stats.revenue),
      description: 'Revenus des formations terminées',
      icon: BarChart3,
      color: 'text-purple-600'
    }
  ];



  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your training center.</p>
          </div>
          <div className="flex-shrink-0">
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            statsCards.map((stat) => (
              <Card key={stat.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest activities in your training center</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                      <p className="text-xs text-gray-600 truncate">{activity.user}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion Rapide</CardTitle>
              <CardDescription>Accès directs aux modules principaux</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => window.location.href='/admin/courses'}>
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Cours</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => window.location.href='/admin/enrollments'}>
                <Users className="w-5 h-5 text-green-600" />
                <span>Inscriptions</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => window.location.href='/admin/references'}>
                <Settings className="w-5 h-5 text-purple-600" />
                <span>Références</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => window.location.href='/admin/media'}>
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span>Médiathèque</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>État du Centre</CardTitle>
              <CardDescription>Résumé de l'activité actuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Cours en ligne :</span>
                  <span className="font-bold">{stats.activeCourses}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Taux de remplissage :</span>
                  <span className="font-bold">78%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
