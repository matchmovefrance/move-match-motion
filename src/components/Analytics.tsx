
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Truck, MapPin, Activity, DollarSign, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalMoves: number;
  totalClients: number;
  totalMovers: number;
  totalRevenue: number;
  avgMoveValue: number;
  completionRate: number;
  monthlyData: { month: string; moves: number; revenue: number; leads: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  topCities: { city: string; count: number; revenue: number }[];
  dailyVolume: { date: string; volume: number; revenue: number }[];
  recentLeads: { id: number; name: string; date: string; status: string; value: number }[];
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalMoves: 0,
    totalClients: 0,
    totalMovers: 0,
    totalRevenue: 0,
    avgMoveValue: 0,
    completionRate: 0,
    monthlyData: [],
    statusDistribution: [],
    topCities: [],
    dailyVolume: [],
    recentLeads: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics data for period:', dateRange);
      
      // Récupérer les données des déménagements avec filtrage par date
      const [movesResponse, clientsResponse, moversResponse] = await Promise.all([
        supabase
          .from('confirmed_moves')
          .select('*')
          .gte('departure_date', dateRange.start)
          .lte('departure_date', dateRange.end),
        supabase.from('client_requests').select('*'),
        supabase.from('movers').select('*')
      ]);

      const moves = movesResponse.data || [];
      const clients = clientsResponse.data || [];
      const movers = moversResponse.data || [];

      // Calculer les métriques principales
      const totalRevenue = moves.reduce((sum, move) => sum + (move.total_price || 0), 0);
      const avgMoveValue = moves.length > 0 ? totalRevenue / moves.length : 0;
      const completedMoves = moves.filter(move => move.status === 'completed').length;
      const completionRate = moves.length > 0 ? (completedMoves / moves.length) * 100 : 0;

      // Données mensuelles avec leads
      const monthlyMap = new Map();
      moves.forEach(move => {
        const date = new Date(move.departure_date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { 
            month: monthName, 
            moves: 0, 
            revenue: 0, 
            leads: 0 
          });
        }
        
        const monthData = monthlyMap.get(monthKey);
        monthData.moves += 1;
        monthData.revenue += move.total_price || 0;
      });

      // Ajouter les leads (client_requests) aux données mensuelles
      clients.forEach(client => {
        const date = new Date(client.created_at);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          monthlyMap.get(monthKey).leads += 1;
        }
      });

      const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

      // Distribution des statuts
      const statusCount = moves.reduce((acc, move) => {
        acc[move.status] = (acc[move.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = [
        { name: 'Confirmé', value: statusCount.confirmed || 0, color: '#82ca9d' },
        { name: 'En cours', value: statusCount.pending || 0, color: '#8884d8' },
        { name: 'Terminé', value: statusCount.completed || 0, color: '#ffc658' }
      ];

      // Top villes avec revenus
      const cityMap = new Map();
      moves.forEach(move => {
        const city = move.departure_city;
        if (!cityMap.has(city)) {
          cityMap.set(city, { city, count: 0, revenue: 0 });
        }
        const cityData = cityMap.get(city);
        cityData.count += 1;
        cityData.revenue += move.total_price || 0;
      });

      const topCities = Array.from(cityMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Volume quotidien des 30 derniers jours
      const dailyMap = new Map();
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date;
      });

      last30Days.forEach(date => {
        const dateKey = date.toISOString().split('T')[0];
        dailyMap.set(dateKey, {
          date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          volume: 0,
          revenue: 0
        });
      });

      moves.forEach(move => {
        const dateKey = move.departure_date;
        if (dailyMap.has(dateKey)) {
          const dayData = dailyMap.get(dateKey);
          dayData.volume += 1;
          dayData.revenue += move.total_price || 0;
        }
      });

      const dailyVolume = Array.from(dailyMap.values());

      // Leads récents
      const recentLeads = clients
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(client => ({
          id: client.id,
          name: client.name || 'Client anonyme',
          date: new Date(client.created_at).toLocaleDateString('fr-FR'),
          status: client.status,
          value: client.quote_amount || 0
        }));

      setData({
        totalMoves: moves.length,
        totalClients: clients.length,
        totalMovers: movers.length,
        totalRevenue,
        avgMoveValue,
        completionRate,
        monthlyData,
        statusDistribution,
        topCities,
        dailyVolume,
        recentLeads
      });

      console.log('Analytics data loaded:', { 
        totalMoves: moves.length, 
        totalRevenue, 
        avgMoveValue 
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Chargement des analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres de période */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Déménagement</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="start-date">Du</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-auto"
            />
          </div>
          <div>
            <Label htmlFor="end-date">Au</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-auto"
            />
          </div>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalRevenue.toLocaleString('fr-FR')}€</div>
              <p className="text-xs text-muted-foreground">
                Moyenne par déménagement: {data.avgMoveValue.toLocaleString('fr-FR')}€
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Déménagements</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalMoves}</div>
              <p className="text-xs text-muted-foreground">
                Taux de réalisation: {data.completionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Générés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Taux de conversion: {data.totalMoves > 0 ? ((data.totalMoves / data.totalClients) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalMovers}</div>
              <p className="text-xs text-muted-foreground">
                Déménageurs actifs
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle avec leads */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle (Déménagements, CA, Leads)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `${value.toLocaleString('fr-FR')}€` : value,
                    name === 'moves' ? 'Déménagements' :
                    name === 'revenue' ? 'CA (€)' : 'Leads'
                  ]} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="moves" stroke="#8884d8" name="Déménagements" />
                  <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#ff7c7c" name="Leads" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (€)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Répartition des statuts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Statuts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume quotidien */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle>Activité des 30 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `${value.toLocaleString('fr-FR')}€` : value,
                    name === 'volume' ? 'Déménagements' : 'Revenue'
                  ]} />
                  <Bar dataKey="volume" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top villes avec CA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle>Top Villes (Volume & CA)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topCities.map((city, index) => (
                  <div key={city.city} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="font-medium">{city.city}</span>
                        <p className="text-sm text-gray-600">{city.count} déménagements</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{city.revenue.toLocaleString('fr-FR')}€</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.max(10, (city.count / Math.max(1, Math.max(...data.topCities.map(c => c.count)))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leads récents */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Derniers Leads Générés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-sm text-gray-600">{lead.date}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'matched' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status === 'pending' ? 'En attente' : 
                       lead.status === 'matched' ? 'Matché' : lead.status}
                    </span>
                    {lead.value > 0 && (
                      <span className="font-medium text-green-600">
                        {lead.value.toLocaleString('fr-FR')}€
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Analytics;
