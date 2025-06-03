
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Truck, MapPin, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalMoves: number;
  totalClients: number;
  totalMovers: number;
  monthlyData: { month: string; moves: number; revenue: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  topCities: { city: string; count: number }[];
  dailyVolume: { date: string; volume: number }[];
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalMoves: 0,
    totalClients: 0,
    totalMovers: 0,
    monthlyData: [],
    statusDistribution: [],
    topCities: [],
    dailyVolume: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics data...');
      
      // Fetch total counts
      const [movesResponse, clientsResponse, moversResponse] = await Promise.all([
        supabase.from('moves').select('*', { count: 'exact' }),
        supabase.from('client_requests').select('*', { count: 'exact' }),
        supabase.from('movers').select('*', { count: 'exact' })
      ]);

      const totalMoves = movesResponse.count || 0;
      const totalClients = clientsResponse.count || 0;
      const totalMovers = moversResponse.count || 0;

      // Generate sample monthly data since we don't have real historical data yet
      const monthlyData = [
        { month: 'Jan', moves: Math.floor(Math.random() * 50), revenue: Math.floor(Math.random() * 50000) },
        { month: 'Fév', moves: Math.floor(Math.random() * 60), revenue: Math.floor(Math.random() * 60000) },
        { month: 'Mar', moves: Math.floor(Math.random() * 70), revenue: Math.floor(Math.random() * 70000) },
        { month: 'Avr', moves: Math.floor(Math.random() * 55), revenue: Math.floor(Math.random() * 55000) },
        { month: 'Mai', moves: Math.floor(Math.random() * 65), revenue: Math.floor(Math.random() * 65000) },
        { month: 'Juin', moves: totalMoves, revenue: totalMoves * 1000 }
      ];

      // Status distribution
      const statusDistribution = [
        { name: 'En attente', value: Math.floor(totalMoves * 0.3), color: '#8884d8' },
        { name: 'En cours', value: Math.floor(totalMoves * 0.4), color: '#82ca9d' },
        { name: 'Terminé', value: Math.floor(totalMoves * 0.2), color: '#ffc658' },
        { name: 'Annulé', value: Math.floor(totalMoves * 0.1), color: '#ff7c7c' }
      ];

      // Sample top cities
      const topCities = [
        { city: 'Paris', count: Math.floor(totalMoves * 0.25) },
        { city: 'Lyon', count: Math.floor(totalMoves * 0.2) },
        { city: 'Marseille', count: Math.floor(totalMoves * 0.15) },
        { city: 'Toulouse', count: Math.floor(totalMoves * 0.12) },
        { city: 'Nice', count: Math.floor(totalMoves * 0.1) }
      ];

      // Daily volume for last 7 days
      const dailyVolume = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          volume: Math.floor(Math.random() * 20) + 5
        };
      });

      setData({
        totalMoves,
        totalClients,
        totalMovers,
        monthlyData,
        statusDistribution,
        topCities,
        dailyVolume
      });

      console.log('Analytics data loaded:', { totalMoves, totalClients, totalMovers });
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
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Activity className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Déménagements</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalMoves}</div>
              <p className="text-xs text-muted-foreground">+12% ce mois</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClients}</div>
              <p className="text-xs text-muted-foreground">+8% ce mois</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Déménageurs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalMovers}</div>
              <p className="text-xs text-muted-foreground">+5% ce mois</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="moves" stroke="#8884d8" name="Déménagements" />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (€)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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

        {/* Daily Volume */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Volume Quotidien (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Cities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle>Top Villes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topCities.map((city, index) => (
                  <div key={city.city} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{city.city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(city.count / Math.max(...data.topCities.map(c => c.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{city.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
