
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, Truck, MapPin, Activity, Target, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MatchAnalytics from './MatchAnalytics';

interface AnalyticsData {
  totalClients: number;
  totalMovers: number;
  totalMoves: number;
  totalRequests: number;
  clientGrowth: number;
  moverGrowth: number;
  moveGrowth: number;
  requestGrowth: number;
  monthlyData: Array<{
    month: string;
    clients: number;
    movers: number;
    moves: number;
    requests: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  cityDistribution: Array<{
    city: string;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalClients: 0,
    totalMovers: 0,
    totalMoves: 0,
    totalRequests: 0,
    clientGrowth: 0,
    moverGrowth: 0,
    moveGrowth: 0,
    requestGrowth: 0,
    monthlyData: [],
    statusDistribution: [],
    cityDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les données nécessaires
      const [clientsResult, moversResult, movesResult, requestsResult] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('movers').select('*'),
        supabase.from('confirmed_moves').select('*'),
        supabase.from('client_requests').select('*')
      ]);

      const clients = clientsResult.data || [];
      const movers = moversResult.data || [];
      const moves = movesResult.data || [];
      const requests = requestsResult.data || [];

      // Calculer les statistiques de croissance (simulation pour les 30 derniers jours)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentClients = clients.filter(c => new Date(c.created_at) > last30Days);
      const recentMovers = movers.filter(m => new Date(m.created_at) > last30Days);
      const recentMoves = moves.filter(m => new Date(m.created_at) > last30Days);
      const recentRequests = requests.filter(r => new Date(r.created_at) > last30Days);

      // Distribution des statuts
      const statusCounts: { [key: string]: number } = {};
      [...moves, ...requests].forEach(item => {
        const status = item.status_custom || item.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusDistribution = Object.entries(statusCounts).map(([status, count], index) => ({
        status: status === 'en_cours' ? 'En cours' : status === 'termine' ? 'Terminé' : status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: COLORS[index % COLORS.length]
      }));

      // Distribution par ville (top 5)
      const cityCounts: { [key: string]: number } = {};
      [...moves, ...requests].forEach(item => {
        const city = item.departure_city || item.arrival_city;
        if (city) {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
      });

      const cityDistribution = Object.entries(cityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      // Données mensuelles (6 derniers mois)
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        return {
          month: date.toLocaleDateString('fr-FR', { month: 'short' }),
          clients: clients.filter(c => {
            const createdAt = new Date(c.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length,
          movers: movers.filter(m => {
            const createdAt = new Date(m.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length,
          moves: moves.filter(m => {
            const createdAt = new Date(m.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length,
          requests: requests.filter(r => {
            const createdAt = new Date(r.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length
        };
      }).reverse();

      setAnalyticsData({
        totalClients: clients.length,
        totalMovers: movers.length,
        totalMoves: moves.length,
        totalRequests: requests.length,
        clientGrowth: recentClients.length,
        moverGrowth: recentMovers.length,
        moveGrowth: recentMoves.length,
        requestGrowth: recentRequests.length,
        monthlyData,
        statusDistribution,
        cityDistribution
      });

    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Analytics & Reporting</h1>
        <button 
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="matches">Analytics Matchs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{analyticsData.clientGrowth}</span> ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Déménageurs</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalMovers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{analyticsData.moverGrowth}</span> ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Déménagements</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalMoves}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{analyticsData.moveGrowth}</span> ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demandes</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{analyticsData.requestGrowth}</span> ce mois
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution mensuelle */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution Mensuelle</CardTitle>
                <CardDescription>Croissance sur les 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="clients" stroke="#8884d8" name="Clients" />
                    <Line type="monotone" dataKey="movers" stroke="#82ca9d" name="Déménageurs" />
                    <Line type="monotone" dataKey="moves" stroke="#ffc658" name="Déménagements" />
                    <Line type="monotone" dataKey="requests" stroke="#ff7300" name="Demandes" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribution des statuts */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Statuts</CardTitle>
                <CardDescription>Répartition par état d'avancement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top villes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Villes</CardTitle>
              <CardDescription>Villes les plus actives</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.cityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <MatchAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
