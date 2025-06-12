import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, Users, Truck, Calendar, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface AnalyticsData {
  totalMatches: number;
  validMatches: number;
  invalidMatches: number;
  matchRate: number;
  averageDistance: number;
  averageDateDiff: number;
  matchTypeDistribution: Array<{ name: string; value: number }>;
  monthlyMatches: Array<{ month: string; matches: number; valid: number }>;
}

interface Match {
  id: number;
  match_reference?: string;
  match_type: string;
  is_valid: boolean;
  distance_km: number;
  date_diff_days: number;
  created_at: string;
  client_request?: {
    name?: string;
    client_reference?: string;
  } | null;
  confirmed_move?: {
    company_name?: string;
    move_reference?: string;
  } | null;
}

const MatchAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les matchs avec les références
      const { data: matchesData, error } = await supabase
        .from('move_matches')
        .select(`
          *,
          client_request:client_requests(
            name
          ),
          confirmed_move:confirmed_moves(
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Générer des références pour les matchs qui n'en ont pas et nettoyer les données
      const matchesWithReferences = matchesData?.map(match => ({
        ...match,
        match_reference: match.match_reference || `MTH-${String(match.id).padStart(6, '0')}`,
        client_request: Array.isArray(match.client_request) ? match.client_request[0] : match.client_request,
        confirmed_move: Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move
      })) || [];

      setMatches(matchesWithReferences);

      // Calculer les analytics
      const totalMatches = matchesWithReferences.length;
      const validMatches = matchesWithReferences.filter(m => m.is_valid).length;
      const invalidMatches = totalMatches - validMatches;
      const matchRate = totalMatches > 0 ? (validMatches / totalMatches) * 100 : 0;

      const averageDistance = totalMatches > 0 
        ? matchesWithReferences.reduce((sum, m) => sum + m.distance_km, 0) / totalMatches 
        : 0;

      const averageDateDiff = totalMatches > 0 
        ? matchesWithReferences.reduce((sum, m) => sum + Math.abs(m.date_diff_days), 0) / totalMatches 
        : 0;

      // Distribution par type
      const typeCount: Record<string, number> = {};
      matchesWithReferences.forEach(match => {
        typeCount[match.match_type] = (typeCount[match.match_type] || 0) + 1;
      });

      const matchTypeDistribution = Object.entries(typeCount).map(([name, value]) => ({
        name: name === 'perfect' ? 'Parfait' : 
              name === 'partial' ? 'Partiel' : 
              name === 'compatible' ? 'Compatible' : name,
        value
      }));

      // Matchs par mois
      const monthlyData: Record<string, { total: number; valid: number }> = {};
      matchesWithReferences.forEach(match => {
        const month = new Date(match.created_at).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, valid: 0 };
        }
        monthlyData[month].total++;
        if (match.is_valid) {
          monthlyData[month].valid++;
        }
      });

      const monthlyMatches = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          matches: data.total,
          valid: data.valid
        }))
        .slice(-6); // Derniers 6 mois

      setAnalytics({
        totalMatches,
        validMatches,
        invalidMatches,
        matchRate,
        averageDistance,
        averageDateDiff,
        matchTypeDistribution,
        monthlyMatches
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMatches = () => {
    return matches.filter(match => {
      const matchesSearch = 
        match.match_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.client_request?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.client_request?.client_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.confirmed_move?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.confirmed_move?.move_reference?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'valid' && match.is_valid) ||
        (statusFilter === 'invalid' && !match.is_valid);

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const matchDate = new Date(match.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case 'week':
            matchesDate = (now.getTime() - matchDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            matchesDate = (now.getTime() - matchDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
            break;
          case 'quarter':
            matchesDate = (now.getTime() - matchDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filteredMatches = getFilteredMatches();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Analytics Matchs</h2>
        </div>
        <Badge variant="secondary">
          {analytics?.totalMatches || 0} matchs total
        </Badge>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par référence client/trajet ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="valid">Valides</SelectItem>
            <SelectItem value="invalid">Non valides</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les dates</SelectItem>
            <SelectItem value="week">Dernière semaine</SelectItem>
            <SelectItem value="month">Dernier mois</SelectItem>
            <SelectItem value="quarter">Dernier trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium leading-none">Total Matchs</p>
                <p className="text-2xl font-bold">{filteredMatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Matchs Valides</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredMatches.filter(m => m.is_valid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium leading-none">Taux de Réussite</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredMatches.length > 0 
                    ? Math.round((filteredMatches.filter(m => m.is_valid).length / filteredMatches.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium leading-none">Distance Moy.</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredMatches.length > 0 
                    ? Math.round(filteredMatches.reduce((sum, m) => sum + m.distance_km, 0) / filteredMatches.length)
                    : 0}km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution par type */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution par Type de Match</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.matchTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.matchTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Évolution mensuelle */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyMatches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="matches" fill="#8884d8" name="Total" />
                  <Bar dataKey="valid" fill="#82ca9d" name="Valides" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des matchs filtrés */}
      <Card>
        <CardHeader>
          <CardTitle>Matchs Récents ({filteredMatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMatches.slice(0, 10).map((match) => (
              <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {match.match_reference}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      {match.client_request?.name} → {match.confirmed_move?.company_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Réf Client: {match.client_request?.client_reference} | 
                      Réf Trajet: {match.confirmed_move?.move_reference}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>{match.distance_km}km</p>
                  <p className="text-gray-600">
                    {new Date(match.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MatchAnalytics;
