import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Truck, DollarSign, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DateFilter from './DateFilter';

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
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [allMoves, setAllMoves] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Récupérer les demandes clients
      const { data: clientRequests, error: clientError } = await supabase
        .from('client_requests')
        .select('*');

      // Récupérer les déménagements confirmés
      const { data: confirmedMoves, error: moveError } = await supabase
        .from('confirmed_moves')
        .select('*');

      // Récupérer les correspondances
      const { data: matches, error: matchError } = await supabase
        .from('move_matches')
        .select('*');

      if (clientError || moveError || matchError) {
        throw new Error('Erreur lors du chargement des données');
      }

      const clients = clientRequests || [];
      const moves = confirmedMoves || [];
      const matchData = matches || [];

      // Stocker toutes les données pour le filtrage
      setAllClients(clients);
      setAllMoves(moves);
      setFilteredClients(clients);
      setFilteredMoves(moves);

      // Calculer les données initiales
      calculateAnalyticsData(clients, moves, matchData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalyticsData = (clients: any[], moves: any[], matchData: any[]) => {
    // Calculer le chiffre d'affaires basé sur les montants des devis clients
    const totalRevenue = clients.reduce((sum, client) => sum + (client.quote_amount || 0), 0);
    const pendingRequests = clients.filter(c => c.status === 'pending').length;
    const confirmedMovesCount = moves.filter(m => m.status === 'confirmed').length;

    // Données mensuelles
    const monthlyStats = new Map();
    const now = new Date();
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      monthlyStats.set(monthKey, { month: monthKey, clients: 0, moves: 0, revenue: 0 });
    }

    // Compter les clients par mois
    clients.forEach(client => {
      const date = new Date(client.created_at);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      if (monthlyStats.has(monthKey)) {
        monthlyStats.get(monthKey).clients++;
        // Ajouter le montant du devis au revenu mensuel
        monthlyStats.get(monthKey).revenue += client.quote_amount || 0;
      }
    });

    // Compter les déménagements par mois
    moves.forEach(move => {
      const date = new Date(move.created_at);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      if (monthlyStats.has(monthKey)) {
        monthlyStats.get(monthKey).moves++;
      }
    });

    // Données de statut
    const statusCounts = {
      pending: clients.filter(c => c.status === 'pending').length,
      confirmed: clients.filter(c => c.status === 'confirmed').length,
      rejected: clients.filter(c => c.status === 'rejected').length
    };

    const statusData = [
      { name: 'En attente', value: statusCounts.pending, color: '#fbbf24' },
      { name: 'Confirmé', value: statusCounts.confirmed, color: '#10b981' },
      { name: 'Rejeté', value: statusCounts.rejected, color: '#ef4444' }
    ];

    // Données par ville
    const cityStats = new Map();
    
    clients.forEach(client => {
      const city = client.departure_city;
      if (!cityStats.has(city)) {
        cityStats.set(city, { city, requests: 0, moves: 0 });
      }
      cityStats.get(city).requests++;
    });

    moves.forEach(move => {
      const city = move.departure_city;
      if (!cityStats.has(city)) {
        cityStats.set(city, { city, requests: 0, moves: 0 });
      }
      cityStats.get(city).moves++;
    });

    const cityData = Array.from(cityStats.values())
      .sort((a, b) => (b.requests + b.moves) - (a.requests + a.moves))
      .slice(0, 10);

    // Données de volume
    const volumeRanges = [
      { range: '0-5m³', min: 0, max: 5, count: 0 },
      { range: '5-10m³', min: 5, max: 10, count: 0 },
      { range: '10-20m³', min: 10, max: 20, count: 0 },
      { range: '20-30m³', min: 20, max: 30, count: 0 },
      { range: '30m³+', min: 30, max: Infinity, count: 0 }
    ];

    clients.forEach(client => {
      const volume = client.estimated_volume || 0;
      const range = volumeRanges.find(r => volume >= r.min && volume < r.max);
      if (range) range.count++;
    });

    moves.forEach(move => {
      const volume = move.max_volume || 0;
      const range = volumeRanges.find(r => volume >= r.min && volume < r.max);
      if (range) range.count++;
    });

    setData({
      totalClients: clients.length,
      totalMoves: moves.length,
      totalMatches: matchData.length,
      totalRevenue,
      pendingRequests,
      confirmedMoves: confirmedMovesCount,
      monthlyData: Array.from(monthlyStats.values()),
      statusData: statusData.filter(s => s.value > 0),
      cityData,
      volumeData: volumeRanges.filter(r => r.count > 0)
    });
  };

  const handleClientDateFilter = (filteredData: any[]) => {
    setFilteredClients(filteredData);
    // Recalculer les analytics avec les données filtrées
    const matchData = []; // On garde les matches vides pour le moment
    calculateAnalyticsData(filteredData, filteredMoves, matchData);
  };

  const handleMoveeDateFilter = (filteredData: any[]) => {
    setFilteredMoves(filteredData);
    // Recalculer les analytics avec les données filtrées
    const matchData = []; // On garde les matches vides pour le moment
    calculateAnalyticsData(filteredClients, filteredData, matchData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
      </div>

      {/* Filtres de date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DateFilter 
          data={allClients} 
          onFilter={handleClientDateFilter}
          dateField="created_at"
          label="Filtrer les demandes clients par date"
        />
        <DateFilter 
          data={allMoves} 
          onFilter={handleMoveeDateFilter}
          dateField="departure_date"
          label="Filtrer les déménagements par date de départ"
        />
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalClients}</p>
                <p className="text-xs text-gray-500">{data.pendingRequests} en attente</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Déménagements</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalMoves}</p>
                <p className="text-xs text-gray-500">{data.confirmedMoves} confirmés</p>
              </div>
              <Truck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Correspondances</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalMatches}</p>
                <p className="text-xs text-gray-500">Trouvées</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalRevenue.toLocaleString()}€</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clients" stroke="#3b82f6" name="Clients" />
                <Line type="monotone" dataKey="moves" stroke="#10b981" name="Déménagements" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des statuts */}
        <Card>
          <CardHeader>
            <CardTitle>Statuts des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={data.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top villes */}
        <Card>
          <CardHeader>
            <CardTitle>Top villes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#3b82f6" name="Demandes" />
                <Bar dataKey="moves" fill="#10b981" name="Déménagements" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des volumes */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des volumes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Nombre" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
