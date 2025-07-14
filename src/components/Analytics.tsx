
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, Truck, DollarSign, MapPin, Calendar, Activity, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard } from './analytics/MetricCard';
import { FilterBar } from './analytics/FilterBar';
import { ChartContainer } from './analytics/ChartContainer';

interface AnalyticsData {
  totalClients: number;
  totalMoves: number;
  totalMatches: number;
  totalRevenue: number;
  pendingRequests: number;
  confirmedMoves: number;
  monthlyData: Array<{
    month: string;
    clients: number;
    moves: number;
    revenue: number;
  }>;
  statusData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  cityData: Array<{
    city: string;
    requests: number;
    moves: number;
  }>;
  volumeData: Array<{
    range: string;
    count: number;
  }>;
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalClients: 0,
    totalMoves: 0,
    totalMatches: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    confirmedMoves: 0,
    monthlyData: [],
    statusData: [],
    cityData: [],
    volumeData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allClients, setAllClients] = useState<any[]>([]);
  const [allMoves, setAllMoves] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, statusFilter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculer la date de début basée sur la plage de temps
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Récupérer les clients avec filtrage par date
      let clientQuery = supabase
        .from('clients')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (statusFilter !== 'all') {
        clientQuery = clientQuery.eq('status', statusFilter);
      }

      const { data: clients, error: clientError } = await clientQuery;

      // Récupérer les déménagements confirmés
      const { data: confirmedMoves, error: moveError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Récupérer les correspondances
      const { data: matches, error: matchError } = await supabase
        .from('move_matches')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (clientError || moveError || matchError) {
        throw new Error('Erreur lors du chargement des données');
      }

      const clientData = clients || [];
      const moves = confirmedMoves || [];
      const matchData = matches || [];

      setAllClients(clientData);
      setAllMoves(moves);

      calculateAnalyticsData(clientData, moves, matchData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalyticsData = (clients: any[], moves: any[], matchData: any[]) => {
    // Filtrer par terme de recherche si nécessaire
    let filteredClients = clients;
    if (searchTerm) {
      filteredClients = clients.filter(client => 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.departure_city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const totalRevenue = filteredClients.reduce((sum, client) => sum + (client.quote_amount || 0), 0);
    const pendingRequests = filteredClients.filter(c => c.status === 'pending').length;
    const confirmedMovesCount = moves.filter(m => m.status === 'confirmed').length;

    // Données mensuelles améliorées
    const monthlyStats = new Map();
    const now = new Date();
    
    // Initialiser selon la plage de temps
    const months = Math.min(6, Math.ceil(parseInt(timeRange) / 30));
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      monthlyStats.set(monthKey, { month: monthKey, clients: 0, moves: 0, revenue: 0 });
    }

    filteredClients.forEach(client => {
      const date = new Date(client.created_at);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      if (monthlyStats.has(monthKey)) {
        monthlyStats.get(monthKey).clients++;
        monthlyStats.get(monthKey).revenue += client.quote_amount || 0;
      }
    });

    moves.forEach(move => {
      const date = new Date(move.created_at);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      if (monthlyStats.has(monthKey)) {
        monthlyStats.get(monthKey).moves++;
      }
    });

    // Données de statut avec couleurs améliorées
    const statusCounts = {
      pending: filteredClients.filter(c => c.status === 'pending').length,
      confirmed: filteredClients.filter(c => c.status === 'confirmed').length,
      rejected: filteredClients.filter(c => c.status === 'rejected').length
    };

    const statusData = [
      { name: 'En attente', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Confirmé', value: statusCounts.confirmed, color: '#10b981' },
      { name: 'Rejeté', value: statusCounts.rejected, color: '#ef4444' }
    ].filter(s => s.value > 0);

    // Top villes
    const cityStats = new Map();
    
    filteredClients.forEach(client => {
      const city = client.departure_city || 'Non spécifié';
      if (!cityStats.has(city)) {
        cityStats.set(city, { city, requests: 0, moves: 0 });
      }
      cityStats.get(city).requests++;
    });

    moves.forEach(move => {
      const city = move.departure_city || 'Non spécifié';
      if (!cityStats.has(city)) {
        cityStats.set(city, { city, requests: 0, moves: 0 });
      }
      cityStats.get(city).moves++;
    });

    const cityData = Array.from(cityStats.values())
      .sort((a, b) => (b.requests + b.moves) - (a.requests + a.moves))
      .slice(0, 8);

    // Répartition des volumes
    const volumeRanges = [
      { range: '0-5m³', min: 0, max: 5, count: 0 },
      { range: '5-10m³', min: 5, max: 10, count: 0 },
      { range: '10-20m³', min: 10, max: 20, count: 0 },
      { range: '20-30m³', min: 20, max: 30, count: 0 },
      { range: '30m³+', min: 30, max: Infinity, count: 0 }
    ];

    filteredClients.forEach(client => {
      const volume = client.estimated_volume || 0;
      const range = volumeRanges.find(r => volume >= r.min && volume < r.max);
      if (range) range.count++;
    });

    setData({
      totalClients: filteredClients.length,
      totalMoves: moves.length,
      totalMatches: matchData.length,
      totalRevenue,
      pendingRequests,
      confirmedMoves: confirmedMovesCount,
      monthlyData: Array.from(monthlyStats.values()),
      statusData,
      cityData,
      volumeData: volumeRanges.filter(r => r.count > 0)
    });
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    calculateAnalyticsData(allClients, allMoves, []);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Couleurs modernes et tendance
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gradient1: 'from-blue-500 to-purple-600',
    gradient2: 'from-emerald-500 to-blue-600',
    gradient3: 'from-purple-500 to-pink-600',
    gradient4: 'from-orange-500 to-red-600'
  };

  return (
    <div className="space-y-6 p-1">
      {/* Barre de filtres moderne */}
      <FilterBar 
        onTimeRangeChange={handleTimeRangeChange}
        onSearchChange={handleSearchChange}
        onStatusFilter={handleStatusFilter}
      />

      {/* Métriques principales avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients"
          value={data.totalClients}
          subtitle={`${data.pendingRequests} en attente`}
          icon={Users}
          gradient={COLORS.gradient1}
          trend={{ value: 12, isPositive: true }}
        />
        
        <MetricCard
          title="Déménagements"
          value={data.totalMoves}
          subtitle={`${data.confirmedMoves} confirmés`}
          icon={Truck}
          gradient={COLORS.gradient2}
          trend={{ value: 8, isPositive: true }}
        />
        
        <MetricCard
          title="Correspondances"
          value={data.totalMatches}
          subtitle="Trouvées"
          icon={Target}
          gradient={COLORS.gradient3}
          trend={{ value: 15, isPositive: true }}
        />
        
        <MetricCard
          title="Chiffre d'affaires"
          value={`${data.totalRevenue.toLocaleString()}€`}
          subtitle="Total"
          icon={DollarSign}
          gradient={COLORS.gradient4}
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Graphiques avec containers modernes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle avec area chart */}
        <ChartContainer 
          title="Évolution mensuelle" 
          description="Tendances des clients et déménagements"
          icon={TrendingUp}
          gradient={COLORS.gradient1}
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.monthlyData}>
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMoves" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
              <Area type="monotone" dataKey="clients" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClients)" strokeWidth={2} />
              <Area type="monotone" dataKey="moves" stroke="#10b981" fillOpacity={1} fill="url(#colorMoves)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Statuts avec graphique moderne */}
        <ChartContainer 
          title="Statuts des demandes" 
          description="Répartition par statut"
          icon={Activity}
          gradient={COLORS.gradient2}
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                dataKey="value"
                data={data.statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top villes avec bars modernes */}
        <ChartContainer 
          title="Top villes" 
          description="Demandes par ville"
          icon={MapPin}
          gradient={COLORS.gradient3}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.cityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="city" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
              <Bar dataKey="requests" fill="url(#barGradient1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="moves" fill="url(#barGradient2)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Volumes avec design futuriste */}
        <ChartContainer 
          title="Répartition des volumes" 
          description="Distribution par gamme de volume"
          icon={Zap}
          gradient={COLORS.gradient4}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.volumeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }} 
              />
              <Bar dataKey="count" fill="url(#volumeGradient)" radius={[0, 4, 4, 0]} />
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default Analytics;
