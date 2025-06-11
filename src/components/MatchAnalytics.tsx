
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, CheckCircle, XCircle, Filter, Calendar, Search, Trash2, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DateFilter from './DateFilter';
import StatusToggle from './StatusToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  move_status?: string;
  move_status_custom?: string;
  flexible_dates?: boolean;
  route_type?: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [pendingMatches, setPendingMatches] = useState<MatchWithDetails[]>([]);
  const [completedMatches, setCompletedMatches] = useState<MatchWithDetails[]>([]);
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

  const fetchMatchesData = async () => {
    try {
      setLoading(true);
      
      const { data: matchesData, error: matchesError } = await supabase
        .from('move_matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Erreur lors de la récupération des matchs:', matchesError);
        return;
      }

      const { data: actionsData, error: actionsError } = await supabase
        .from('match_actions')
        .select('*')
        .order('action_date', { ascending: false });

      if (actionsError) {
        console.error('Erreur lors de la récupération des actions:', actionsError);
      }

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
          client_id,
          flexible_dates
        `);

      if (clientError) {
        console.error('Erreur lors de la récupération des demandes clients:', clientError);
      }

      const { data: confirmedMoves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select(`
          id,
          mover_name,
          company_name,
          departure_city,
          arrival_city,
          departure_date,
          status,
          status_custom,
          route_type
        `);

      if (movesError) {
        console.error('Erreur lors de la récupération des déménagements:', movesError);
      }

      const enrichedMatches: MatchWithDetails[] = (matchesData || []).map(match => {
        const clientRequest = clientRequests?.find(cr => cr.id === match.client_request_id);
        const confirmedMove = confirmedMoves?.find(cm => cm.id === match.move_id);
        const matchActions = actionsData?.filter(action => action.match_id === match.id) || [];
        
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
          status,
          move_status: confirmedMove?.status,
          move_status_custom: confirmedMove?.status_custom,
          flexible_dates: clientRequest?.flexible_dates,
          route_type: confirmedMove?.route_type
        };
      });

      setMatches(enrichedMatches);
      
      // Séparer les matches en attente des matches terminés
      const pending = enrichedMatches.filter(match => match.status === 'pending');
      const completed = enrichedMatches.filter(match => match.status !== 'pending');
      
      setPendingMatches(pending);
      setCompletedMatches(completed);
      
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

  const handleMatchAction = async (matchId: number, actionType: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('match_actions')
        .insert({
          match_id: matchId,
          action_type: actionType,
          user_id: user?.id,
          action_date: new Date().toISOString(),
          notes: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} par l'utilisateur`
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} avec succès`,
      });

      fetchMatchesData();
    } catch (error: any) {
      console.error('Error processing match action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'action",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (moveId: number, newStatus: 'en_cours' | 'termine') => {
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .update({ status_custom: newStatus })
        .eq('id', moveId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut du trajet mis à jour`,
      });

      fetchMatchesData();
    } catch (error: any) {
      console.error('Error updating move status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const deleteMatch = async (matchId: number) => {
    try {
      await supabase
        .from('match_actions')
        .delete()
        .eq('match_id', matchId);

      const { error } = await supabase
        .from('move_matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Match supprimé avec succès",
      });

      fetchMatchesData();
    } catch (error: any) {
      console.error('Error deleting match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le match",
        variant: "destructive",
      });
    }
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
      'direct': { label: 'Direct', color: 'bg-gray-100 text-gray-800' },
      'perfect': { label: 'Parfait', color: 'bg-green-100 text-green-800' },
      'good': { label: 'Bon', color: 'bg-blue-100 text-blue-800' },
      'partial': { label: 'Partiel', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const typeInfo = types[type as keyof typeof types] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const renderMatchTable = (matchesList: MatchWithDetails[], showActions: boolean = false) => (
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
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matchesList.map((match) => (
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
                  <div className="text-gray-500 flex items-center space-x-1">
                    <span>{new Date(match.desired_date).toLocaleDateString('fr-FR')}</span>
                    {match.flexible_dates && (
                      <Badge variant="outline" className="text-xs">Flexible</Badge>
                    )}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{match.mover_name || 'Non défini'}</div>
                <div className="text-sm text-gray-500">{match.company_name}</div>
                {match.route_type && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {match.route_type === 'flexible' ? 'Flexible' : 'Fixe'}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{getMatchTypeBadge(match.match_type)}</TableCell>
            <TableCell>{match.distance_km?.toFixed(0)} km</TableCell>
            <TableCell>{match.combined_volume?.toFixed(1)} m³</TableCell>
            <TableCell>
              <div className="flex flex-col space-y-1">
                {getStatusBadge(match.status || 'pending')}
                {showActions && match.status === 'pending' && (
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      onClick={() => handleMatchAction(match.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700 h-6 text-xs"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMatchAction(match.id, 'rejected')}
                      className="text-red-600 hover:text-red-700 h-6 text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              {new Date(match.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer le match</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMatch(match.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
        <h2 className="text-2xl font-bold text-gray-800">Système de Matching</h2>
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
            <CardTitle className="text-sm font-medium">Matches en attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingMatches.length}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

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
      </div>

      {/* Onglets pour séparer matches en attente et historique */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Matches en attente ({pendingMatches.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Historique ({completedMatches.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Matches en attente de traitement</span>
              </CardTitle>
              <CardDescription>
                Ces matches nécessitent une action (accepter ou refuser)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {pendingMatches.length > 0 ? (
                  renderMatchTable(pendingMatches, true)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun match en attente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Historique des matches</span>
              </CardTitle>
              <CardDescription>
                Matches acceptés et rejetés avec leur statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {completedMatches.length > 0 ? (
                  renderMatchTable(completedMatches, false)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun match dans l'historique</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsData.matchTypeDistribution.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchAnalytics;
