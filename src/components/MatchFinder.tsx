
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Search, MapPin, Calendar, Volume2, Users, Truck, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Match {
  id: number;
  match_reference?: string;
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
    name: string;
    client_reference?: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    desired_date: string;
    estimated_volume: number;
  };
  confirmed_move?: {
    company_name: string;
    mover_name: string;
    move_reference?: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_date: string;
    available_volume: number;
  };
}

const MatchFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
          client_request:client_requests(
            name,
            client_reference,
            departure_postal_code,
            arrival_postal_code,
            desired_date,
            estimated_volume
          ),
          confirmed_move:confirmed_moves(
            company_name,
            mover_name,
            move_reference,
            departure_postal_code,
            arrival_postal_code,
            departure_date,
            available_volume
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Générer des références pour les matchs qui n'en ont pas
      const matchesWithReferences = data?.map(match => ({
        ...match,
        match_reference: match.match_reference || `MTH-${String(match.id).padStart(6, '0')}`
      })) || [];
      
      setMatches(matchesWithReferences);
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

  const filteredMatches = matches.filter(match => {
    const matchesSearch = 
      match.match_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.client_request?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.client_request?.client_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.confirmed_move?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.confirmed_move?.move_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.client_request?.departure_postal_code?.includes(searchTerm) ||
      match.client_request?.arrival_postal_code?.includes(searchTerm) ||
      match.confirmed_move?.departure_postal_code?.includes(searchTerm) ||
      match.confirmed_move?.arrival_postal_code?.includes(searchTerm) ||
      new Date(match.client_request?.desired_date || '').toLocaleDateString('fr-FR').includes(searchTerm) ||
      new Date(match.confirmed_move?.departure_date || '').toLocaleDateString('fr-FR').includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'valid' && match.is_valid) ||
      (statusFilter === 'invalid' && !match.is_valid);

    const matchesType = typeFilter === 'all' || match.match_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateMatch = async () => {
    toast({
      title: "Recherche de correspondances",
      description: "Recherche de nouvelles correspondances en cours...",
    });
    // TODO: Implémenter la logique de création de matchs automatiques
  };

  const getMatchStatusColor = (isValid: boolean) => {
    return isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'perfect': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'compatible': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Correspondances</h2>
          <Badge variant="secondary">{filteredMatches.length}</Badge>
        </div>
        <Button onClick={handleCreateMatch}>
          <Target className="h-4 w-4 mr-2" />
          Rechercher Matchs
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par référence client/trajet, nom, code postal, date..."
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

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="perfect">Parfait</SelectItem>
            <SelectItem value="partial">Partiel</SelectItem>
            <SelectItem value="compatible">Compatible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredMatches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Match {match.match_reference}</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Badge className={getMatchStatusColor(match.is_valid)}>
                      {match.is_valid ? 'Valide' : 'Non valide'}
                    </Badge>
                    <Badge className={getMatchTypeColor(match.match_type)}>
                      {match.match_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">Client</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Nom:</strong> {match.client_request?.name}
                      </div>
                      <div>
                        <strong>Réf:</strong> {match.client_request?.client_reference}
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span>
                          {match.client_request?.departure_postal_code} → {match.client_request?.arrival_postal_code}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-purple-500" />
                        <span>
                          {match.client_request?.desired_date ? 
                            new Date(match.client_request.desired_date).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Volume2 className="h-3 w-3 text-orange-500" />
                        <span>{match.client_request?.estimated_volume}m³</span>
                      </div>
                    </div>
                  </div>

                  {/* Trajet */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">Trajet</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Entreprise:</strong> {match.confirmed_move?.company_name}
                      </div>
                      <div>
                        <strong>Réf:</strong> {match.confirmed_move?.move_reference}
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span>
                          {match.confirmed_move?.departure_postal_code} → {match.confirmed_move?.arrival_postal_code}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-purple-500" />
                        <span>
                          {match.confirmed_move?.departure_date ? 
                            new Date(match.confirmed_move.departure_date).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Volume2 className="h-3 w-3 text-green-500" />
                        <span>{match.confirmed_move?.available_volume}m³ disponible</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métriques du match */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium ml-2">{match.distance_km}km</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Différence dates:</span>
                      <span className="font-medium ml-2">{match.date_diff_days} jours</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Volume combiné:</span>
                      <span className="font-medium ml-2">{match.combined_volume}m³</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Volume OK:</span>
                      <span className={`font-medium ml-2 ${match.volume_ok ? 'text-green-600' : 'text-red-600'}`}>
                        {match.volume_ok ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    Voir Détails
                  </Button>
                  <Button size="sm" className="flex-1">
                    Approuver Match
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredMatches.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Aucune correspondance trouvée pour cette recherche' : 'Aucune correspondance disponible'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MatchFinder;
