
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, CheckCircle, XCircle, Filter, Calendar, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DateFilter from './DateFilter';

interface MatchWithDetails {
  id: number;
  client_request_id: number;
  move_id: number;
  match_type: string;
  created_at: string;
  is_valid: boolean;
  volume_ok: boolean;
  combined_volume: number;
  date_diff_days: number;
  distance_km: number;
  client_name?: string;
  client_email?: string;
  departure_city?: string;
  arrival_city?: string;
  desired_date?: string;
  mover_name?: string;
  company_name?: string;
  actions?: Array<{
    action_type: string;
    action_date: string;
    notes: string;
    user_id: string;
  }>;
  status?: string;
}

interface AnalyticsData {
  totalMatches: number;
  acceptedMatches: number;
  rejectedMatches: number;
  pendingMatches: number;
  acceptanceRate: number;
  averageDistance: number;
  averageVolume: number;
  matchTypeDistribution: Array<{ type: string; count: number; color: string }>;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

const MatchAnalytics = () => {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchWithDetails[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalMatches: 0,
    acceptedMatches: 0,
    rejectedMatches: 0,
    pendingMatches: 0,
    acceptanceRate: 0,
    averageDistance: 0,
    averageVolume: 0,
    matchTypeDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatchesData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matches, statusFilter, searchTerm]);

  const fetchMatchesData = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les matchs avec les détails
      const { data: matchesData, error: matchesError } = await supabase
        .from('move_matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Erreur lors de la récupération des matchs:', matchesError);
        return;
      }

      // Récupérer les actions pour chaque match
      const { data: actionsData, error: actionsError } = await supabase
        .from('match_actions')
        .select('*')
        .order('action_date', { ascending: false });

      if (actionsError) {
        console.error('Erreur lors de la récupération des actions:', actionsError);
      }

      // Récupérer les détails des demandes clients
      const { data: clientRequests, error: clientError } = await supabase
        .from('client_requests')
        .select(`
          id,
          name,
          email,
          departure_city,
          arrival_city,
          desired_date,
          status,
          client_id
        `);

      if (clientError) {
        console.error('Erreur lors de la récupération des demandes clients:', clientError);
      }

      // Récupérer les détails des déménagements confirmés
      const { data: confirmedMoves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select(`
          id,
          mover_name,
          company_name,
          departure_city,
          arrival_city,
          departure_date
        `);

      if (movesError) {
        console.error('Erreur lors de la récupération des déménagements:', movesError);
      }

      // Combiner toutes les données
      const enrichedMatches: MatchWithDetails[] = (matchesData || []).map(match => {
        const clientRequest = clientRequests?.find(cr => cr.id === match.client_request_id);
        const confirmedMove = confirmedMoves?.find(cm => cm.id === match.move_id);
        const matchActions = actionsData?.filter(action => action.match_id === match.id) || [];
        
        // Déterminer le statut basé sur les actions
        let status = 'pending';
        const latestAction = matchActions[0];
        if (latestAction) {
          status = latestAction.action_type;
        }

        return {
          ...match,
          client_name: clientRequest?.name,
          client_email: clientRequest?.email,
          departure_city: clientRequest?.departure_city || confirmedMove?.departure_city,
          arrival_city: clientRequest?.arrival_city || confirmedMove?.arrival_city,
          desired_date: clientRequest?.desired_date,
          mover_name: confirmedMove?.mover_name,
          company_name: confirmedMove?.company_name,
          actions: matchActions,
          status
        };
      });

      setMatches(enrichedMatches);
      calculateAnalytics(enrichedMatches);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (matchesData: MatchWithDetails[]) => {
    const total = matchesData.length;
    const accepted = matchesData.filter(m => m.status === 'accepted').length;
    const rejected = matchesData.filter(m => m.status === 'rejected').length;
    const pending = total - accepted - rejected;
    
    const averageDistance = matchesData.reduce((sum, m) => sum + (m.distance_km || 0), 0) / total || 0;
    const averageVolume = matchesData.reduce((sum, m) => sum + (m.combined_volume || 0), 0) / total || 0;

    const matchTypeDistribution = [
      { type: 'Trajet groupé', count: matchesData.filter(m => m.match_type === 'grouped').length, color: '#10B981' },
      { type: 'Trajet retour', count: matchesData.filter(m => m.match_type === 'return').length, color: '#3B82F6' },
      { type: 'Boucle optimisée', count: matchesData.filter(m => m.match_type === 'loop').length, color: '#8B5CF6' },
      { type: 'Direct', count: matchesData.filter(m => m.match_type === 'direct').length, color: '#F59E0B' }
    ].filter(item => item.count > 0);

    setAnalyticsData({
      totalMatches: total,
      acceptedMatches: accepted,
      rejectedMatches: rejected,
      pendingMatches: pending,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
      averageDistance,
      averageVolume,
      matchTypeDistribution
    });
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(match => 
        match.client_name?.toLowerCase().includes(searchLower) ||
        match.client_email?.toLowerCase().includes(searchLower) ||
        match.departure_city?.toLowerCase().includes(searchLower) ||
        match.arrival_city?.toLowerCase().includes(searchLower) ||
        match.mover_name?.toLowerCase().includes(searchLower) ||
        match.company_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMatches(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  const getMatchTypeBadge = (type: string) => {
    const types = {
      'grouped': { label: 'Groupé', color: 'bg-blue-100 text-blue-800' },
      'return': { label: 'Retour', color: 'bg-purple-100 text-purple-800' },
      'loop': { label: 'Boucle', color: 'bg-indigo-100 text-indigo-800' },
      'direct': { label: 'Direct', color: 'bg-gray-100 text-gray-800' }
    };
    
    const typeInfo = types[type as keyof typeof types] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Historique des Matchs</h2>
        <button 
          onClick={fetchMatchesData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalMatches}</div>
            <p className="text-xs text-muted-foreground">Matchs créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Acceptation</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.acceptedMatches} acceptés / {analyticsData.totalMatches} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analyticsData.averageDistance.toFixed(0)} km</div>
            <p className="text-xs text-muted-foreground">Distance des trajets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Moyen</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analyticsData.averageVolume.toFixed(1)} m³</div>
            <p className="text-xs text-muted-foreground">Volume combiné</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par statut */}
            <div>
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="accepted">Acceptés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recherche */}
            <div>
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Client, ville, déménageur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par date */}
            <div className="md:col-span-1">
              <DateFilter
                data={matches}
                onFilter={setFilteredMatches}
                dateField="created_at"
                label="Filtrer par date de création"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques */}
      {analyticsData.matchTypeDistribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution par type de match */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution par Type</CardTitle>
              <CardDescription>Répartition des types de matchs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.matchTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.matchTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Statuts des matchs */}
          <Card>
            <CardHeader>
              <CardTitle>Statuts des Matchs</CardTitle>
              <CardDescription>Répartition par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Acceptés', count: analyticsData.acceptedMatches, fill: '#10B981' },
                  { name: 'Rejetés', count: analyticsData.rejectedMatches, fill: '#EF4444' },
                  { name: 'En attente', count: analyticsData.pendingMatches, fill: '#F59E0B' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau des matchs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Matchs ({filteredMatches.length})</CardTitle>
          <CardDescription>Historique détaillé des matchs avec leurs informations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Déménageur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">#{match.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{match.client_name || 'Non défini'}</div>
                        <div className="text-sm text-gray-500">{match.client_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{match.departure_city} → {match.arrival_city}</div>
                        {match.desired_date && (
                          <div className="text-gray-500">
                            {new Date(match.desired_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{match.mover_name || 'Non défini'}</div>
                        <div className="text-sm text-gray-500">{match.company_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getMatchTypeBadge(match.match_type)}</TableCell>
                    <TableCell>{match.distance_km?.toFixed(0)} km</TableCell>
                    <TableCell>{match.combined_volume?.toFixed(1)} m³</TableCell>
                    <TableCell>{getStatusBadge(match.status || 'pending')}</TableCell>
                    <TableCell>
                      {new Date(match.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredMatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun match trouvé</p>
                <p className="text-sm">Essayez de modifier vos filtres</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchAnalytics;
