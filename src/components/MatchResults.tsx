
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Filter, RefreshCw, MapPin, Calendar, Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientMatchesDialog } from './ClientMatchesDialog';

interface MatchResultData {
  id: number;
  client_id: number;
  move_id: number;
  match_type: string;
  trip_type: string;
  volume_ok: boolean;
  distance_km: number;
  date_diff_days: number;
  combined_volume: number;
  is_valid: boolean;
  created_at: string;
  client: {
    id: number;
    name: string;
    client_reference?: string;
    departure_city: string;
    departure_postal_code: string;
    arrival_city: string;
    arrival_postal_code: string;
    estimated_volume: number;
    desired_date: string;
  };
  move: {
    id: number;
    company_name: string;
    mover_name: string;
    departure_city: string;
    departure_postal_code: string;
    arrival_city: string;
    arrival_postal_code: string;
    departure_date: string;
    max_volume: number;
    used_volume: number;
    available_volume: number;
  };
}

interface MatchResultsProps {
  refreshTrigger: number;
}

const MatchResults = ({ refreshTrigger }: MatchResultsProps) => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tripTypeFilter, setTripTypeFilter] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [showClientDialog, setShowClientDialog] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [refreshTrigger]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des résultats de matching...');

      const { data: matchesData, error } = await supabase
        .from('move_matches')
        .select(`
          *,
          clients!move_matches_client_id_fkey (
            id,
            name,
            client_reference,
            departure_city,
            departure_postal_code,
            arrival_city,
            arrival_postal_code,
            estimated_volume,
            desired_date
          ),
          confirmed_moves!move_matches_move_id_fkey (
            id,
            company_name,
            mover_name,
            departure_city,
            departure_postal_code,
            arrival_city,
            arrival_postal_code,
            departure_date,
            max_volume,
            used_volume,
            available_volume
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Matches chargés:', matchesData?.length || 0);
      
      // Transformer les données pour correspondre à notre interface
      const transformedMatches = matchesData?.map(match => ({
        ...match,
        client: match.clients,
        move: match.confirmed_moves
      })) || [];

      setMatches(transformedMatches);

    } catch (error) {
      console.error('❌ Erreur chargement matches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les résultats de matching",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      match.client?.name?.toLowerCase().includes(searchLower) ||
      match.client?.client_reference?.toLowerCase().includes(searchLower) ||
      match.move?.company_name?.toLowerCase().includes(searchLower) ||
      match.move?.mover_name?.toLowerCase().includes(searchLower) ||
      match.client?.departure_city?.toLowerCase().includes(searchLower) ||
      match.client?.arrival_city?.toLowerCase().includes(searchLower) ||
      match.move?.departure_city?.toLowerCase().includes(searchLower) ||
      match.move?.arrival_city?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'valid' && match.is_valid) ||
      (statusFilter === 'invalid' && !match.is_valid);

    const matchesTripType = tripTypeFilter === 'all' || 
      match.trip_type === tripTypeFilter;

    return matchesSearch && matchesStatus && matchesTripType;
  });

  const handleViewClient = (clientId: number, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setShowClientDialog(true);
  };

  const getMatchTypeColor = (matchType: string, isValid: boolean) => {
    if (!isValid) return 'bg-red-100 text-red-800';
    switch (matchType) {
      case 'perfect': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'return_trip': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTripTypeIcon = (tripType: string) => {
    return tripType === 'return' ? '🔄' : '➡️';
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Matches Valides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.is_valid).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trajets Directs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {matches.filter(m => m.trip_type === 'direct').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trajets Retour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {matches.filter(m => m.trip_type === 'return').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher client, transporteur, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="valid">Valides uniquement</SelectItem>
                <SelectItem value="invalid">Non valides</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tripTypeFilter} onValueChange={setTripTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type de trajet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="direct">Trajets directs</SelectItem>
                <SelectItem value="return">Trajets retour</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={fetchMatches}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <Card>
        <CardHeader>
          <CardTitle>
            Résultats du Matching ({filteredMatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des résultats...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium">Aucun résultat trouvé</p>
              <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Trajet Client</TableHead>
                    <TableHead>Transporteur</TableHead>
                    <TableHead>Trajet Transporteur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{match.client?.name || 'N/A'}</div>
                          {match.client?.client_reference && (
                            <div className="text-sm text-gray-500">
                              {match.client.client_reference}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span>{match.client?.departure_postal_code || 'N/A'}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{match.client?.arrival_postal_code || 'N/A'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {match.client?.departure_city || 'N/A'} → {match.client?.arrival_city || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{match.move?.company_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{match.move?.mover_name || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span>{match.move?.departure_postal_code || 'N/A'}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{match.move?.arrival_postal_code || 'N/A'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {match.move?.departure_city || 'N/A'} → {match.move?.arrival_city || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getTripTypeIcon(match.trip_type || 'direct')}</span>
                          <Badge variant="outline" className="text-xs">
                            {match.trip_type || 'direct'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm font-medium">{match.distance_km}km</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{match.client?.estimated_volume || 0}m³</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Reste: {match.combined_volume}m³
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>±{match.date_diff_days}j</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getMatchTypeColor(match.match_type, match.is_valid)}
                        >
                          {match.is_valid ? 'Valide' : 'Partiel'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewClient(match.client_id, match.client?.name || '')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour voir les détails client */}
      {selectedClientId && (
        <ClientMatchesDialog
          open={showClientDialog}
          onOpenChange={setShowClientDialog}
          clientId={selectedClientId}
          clientName={selectedClientName}
        />
      )}
    </div>
  );
};

export default MatchResults;
