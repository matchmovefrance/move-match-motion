
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Truck, MapPin, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalMoves: number;
  totalClients: number;
  totalMatches: number;
  totalVolume: number;
  monthlyData: any[];
  statusData: any[];
  cityData: any[];
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalMoves: 0,
    totalClients: 0,
    totalMatches: 0,
    totalVolume: 0,
    monthlyData: [],
    statusData: [],
    cityData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch moves data
      const { data: moves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*');

      // Fetch clients data
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      // Fetch matches data
      const { data: matches, error: matchesError } = await supabase
        .from('move_matches')
        .select('*');

      // Fetch client requests
      const { data: requests, error: requestsError } = await supabase
        .from('client_requests')
        .select('*');

      if (movesError || clientsError || matchesError || requestsError) {
        throw new Error('Error fetching analytics data');
      }

      // Calculate totals
      const totalMoves = moves?.length || 0;
      const totalClients = clients?.length || 0;
      const totalMatches = matches?.length || 0;
      const totalVolume = moves?.reduce((sum, move) => sum + (Number(move.used_volume) || 0), 0) || 0;

      // Generate monthly data
      const monthlyData = generateMonthlyData(moves || [], requests || []);

      // Generate status data
      const statusData = [
        { name: 'Confirmés', value: moves?.filter(m => m.status_custom === 'en_cours').length || 0 },
        { name: 'Terminés', value: moves?.filter(m => m.status_custom === 'termine').length || 0 },
        { name: 'En attente', value: requests?.filter(r => r.status_custom === 'en_cours').length || 0 }
      ];

      // Generate city data (top 10)
      const cityStats = {};
      moves?.forEach(move => {
        const city = move.departure_city;
        cityStats[city] = (cityStats[city] || 0) + 1;
      });
      
      const cityData = Object.entries(cityStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));

      setAnalyticsData({
        totalMoves,
        totalClients,
        totalMatches,
        totalVolume,
        monthlyData,
        statusData,
        cityData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (moves, requests) => {
    const months = [];
    const now = new Date();
    const monthsBack = timeRange === '12months' ? 12 : 6;

    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      const monthMoves = moves.filter(move => {
        const moveDate = new Date(move.created_at);
        return moveDate.getMonth() === date.getMonth() && moveDate.getFullYear() === date.getFullYear();
      });

      const monthRequests = requests.filter(request => {
        const requestDate = new Date(request.created_at);
        return requestDate.getMonth() === date.getMonth() && requestDate.getFullYear() === date.getFullYear();
      });

      months.push({
        month: monthName,
        moves: monthMoves.length,
        requests: monthRequests.length,
        volume: monthMoves.reduce((sum, move) => sum + (Number(move.used_volume) || 0), 0)
      });
    }

    return months;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={timeRange === '6months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('6months')}
          >
            6 mois
          </Button>
          <Button
            variant={timeRange === '12months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('12months')}
          >
            12 mois
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Trajets confirmés', value: analyticsData.totalMoves, icon: Truck, color: 'blue' },
          { label: 'Clients actifs', value: analyticsData.totalClients, icon: Users, color: 'green' },
          { label: 'Matchs trouvés', value: analyticsData.totalMatches, icon: MapPin, color: 'purple' },
          { label: 'Volume total', value: `${analyticsData.totalVolume.toFixed(1)}m³`, icon: TrendingUp, color: 'orange' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="moves" stroke="#3B82F6" name="Trajets" />
                <Line type="monotone" dataKey="requests" stroke="#10B981" name="Demandes" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {analyticsData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Volume mensuel (m³)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle>Top villes de départ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.cityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="city" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
