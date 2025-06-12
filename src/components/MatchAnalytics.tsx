import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Truck, Target, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MatchDetailsDialog } from './MatchDetailsDialog';

interface Match {
  id: number;
  client_request_id: number;
  move_id: number;
  match_type: string;
  volume_ok: boolean;
  combined_volume: number;
  distance_km: number;
  date_diff_days: number;
  is_valid: boolean;
  created_at: string;
  client_request?: {
    name?: string;
  };
  confirmed_move?: {
    company_name?: string;
  };
}

const MatchAnalytics = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // États pour le dialogue de détails
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('move_matches')
        .select(`
          *,
          client_request:client_requests(name),
          confirmed_move:confirmed_moves(company_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Nettoyer les données
      const cleanedMatches = data?.map(match => ({
        ...match,
        client_request: Array.isArray(match.client_request) ? match.client_request[0] : match.client_request,
        confirmed_move: Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move
      })) || [];

      setMatches(cleanedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les correspondances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: matches.length,
    valid: matches.filter(match => match.is_valid).length,
    uniqueClients: [...new Set(matches.map(match => match.client_request_id))].length,
    uniqueMoves: [...new Set(matches.map(match => match.move_id))].length,
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch =
      match.client_request?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      match.confirmed_move?.company_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(match.id).includes(searchFilter);

    return matchesSearch;
  });

  const handleViewMatch = (match: Match) => {
    setSelectedMatch(match);
    setShowDetailsDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Analytics des Matchs</h2>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs Valides</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Matchés</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trajets Matchés</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueMoves}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Filtrer par référence, nom ou date..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les dates</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des matchs */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Correspondances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun match trouvé
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline">
                        {match.match_reference || `MTH-${String(match.id).padStart(6, '0')}`}
                      </Badge>
                      <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {match.is_valid ? 'Valide' : 'Non valide'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{match.client_request?.name}</span>
                      {' → '}
                      <span className="font-medium">{match.confirmed_move?.company_name}</span>
                      <span className="ml-4">Distance: {match.distance_km}km</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewMatch(match)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de détails */}
      <MatchDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        match={selectedMatch}
        onMatchUpdated={fetchMatches}
      />
    </motion.div>
  );
};

export default MatchAnalytics;
