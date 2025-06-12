
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Truck, Target, Eye, Filter, AlertCircle } from 'lucide-react';
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
  client_id: number;
  move_id: number;
  match_type: string;
  volume_ok: boolean;
  combined_volume: number;
  distance_km: number;
  date_diff_days: number;
  is_valid: boolean;
  created_at: string;
  client?: {
    name?: string;
    client_reference?: string;
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
      console.log('📊 Chargement analytics des matches...');
      
      // Charger les matches
      const { data: matchData, error: matchError } = await supabase
        .from('move_matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchError) throw matchError;

      // Enrichir avec les données clients et trajets
      const enrichedMatches = [];
      
      for (const match of matchData || []) {
        // Charger les données client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('name, client_reference')
          .eq('id', match.client_id)
          .single();

        // Charger les données du trajet
        const { data: moveData, error: moveError } = await supabase
          .from('confirmed_moves')
          .select('company_name')
          .eq('id', match.move_id)
          .single();

        enrichedMatches.push({
          ...match,
          client: clientError ? null : clientData,
          confirmed_move: moveError ? null : moveData
        });
      }

      console.log('✅ Analytics matches chargées:', enrichedMatches.length);
      setMatches(enrichedMatches);
      
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
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
    partial: matches.filter(match => !match.is_valid && match.match_type === 'partial').length,
    uniqueClients: [...new Set(matches.map(match => match.client_id))].length,
    uniqueMoves: [...new Set(matches.map(match => match.move_id))].length,
    avgDistance: matches.length > 0 ? Math.round(matches.reduce((acc, match) => acc + match.distance_km, 0) / matches.length) : 0,
    avgDateDiff: matches.length > 0 ? Math.round(matches.reduce((acc, match) => acc + match.date_diff_days, 0) / matches.length) : 0,
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch =
      match.client?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      match.client?.client_reference?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      match.confirmed_move?.company_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(match.id).includes(searchFilter);

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const matchDate = new Date(match.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = matchDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = matchDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = matchDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesDate;
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
        <h2 className="text-2xl font-bold text-gray-800">Analytics des Matchs - Moteur Unifié</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <Target className="h-5 w-5" />
          <span className="font-semibold">Analyses Cohérentes avec le Moteur de Devis</span>
        </div>
        <div className="text-sm text-blue-700">
          • <strong>Distances exactes</strong> calculées via Google Maps API<br/>
          • <strong>Critères unifiés</strong> : ≤100km distance totale, ≤7 jours d'écart, volume compatible<br/>
          • <strong>Synchronisation</strong> avec tous les modules de l'application
        </div>
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
            <p className="text-xs text-muted-foreground">
              {stats.valid} valides • {stats.partial} partiels
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Validité</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.valid} matchs valides sur {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Moy.</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDistance}km</div>
            <p className="text-xs text-muted-foreground">
              Écart dates moy: {stats.avgDateDiff}j
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Couverture</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.uniqueClients}C / {stats.uniqueMoves}T</div>
            <p className="text-xs text-muted-foreground">
              Clients / Trajets uniques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Filtrer par référence, nom de client ou transporteur..."
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des analytics...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium">Aucun match trouvé</p>
              <p className="text-sm mt-2">
                {matches.length === 0 
                  ? "Lancez le moteur de matching pour générer des correspondances"
                  : "Ajustez vos filtres pour voir plus de résultats"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    match.is_valid ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">
                        MTH-{String(match.id).padStart(6, '0')}
                      </Badge>
                      <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {match.is_valid ? 'Match Valide' : 'Match Partiel'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {match.match_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">
                        {match.client?.name || 'Client inconnu'} ({match.client?.client_reference || `ID-${match.client_id}`})
                      </span>
                      {' → '}
                      <span className="font-medium">
                        {match.confirmed_move?.company_name || 'Transporteur inconnu'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Distance: {match.distance_km}km • Écart: {match.date_diff_days}j • 
                      Volume: {match.volume_ok ? '✓' : '✗'} • 
                      Créé: {new Date(match.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewMatch(match)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
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
