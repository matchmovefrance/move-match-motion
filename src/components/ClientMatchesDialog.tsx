
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, MapPin, Calendar, Volume2, Truck, Target, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MapPopup from './MapPopup';

interface ClientMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
}

interface Match {
  id: number;
  match_type: string;
  volume_ok: boolean;
  combined_volume: number;
  distance_km: number;
  date_diff_days: number;
  is_valid: boolean;
  created_at: string;
  confirmed_move: {
    company_name: string;
    mover_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    available_volume: number;
  } | null;
}

export const ClientMatchesDialog = ({ open, onOpenChange, clientId, clientName }: ClientMatchesDialogProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [selectedMatchForMap, setSelectedMatchForMap] = useState<Match | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && clientId) {
      fetchMatches();
      fetchClientData();
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('departure_postal_code, arrival_postal_code, departure_city, arrival_city, desired_date, name')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClientData(data);
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    setShowRadar(true);
    
    // Animation radar pendant 2 secondes
    setTimeout(() => setShowRadar(false), 2000);

    try {
      const { data, error } = await supabase
        .from('move_matches')
        .select(`
          *,
          confirmed_move:confirmed_moves(
            company_name,
            mover_name,
            departure_postal_code,
            arrival_postal_code,
            departure_city,
            arrival_city,
            departure_date,
            available_volume
          )
        `)
        .eq('client_request_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const cleanedMatches = data?.map(match => ({
        ...match,
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

  const acceptMatch = async (matchId: number) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'confirmed'
        })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Match accepté",
        description: "La correspondance a été acceptée",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error accepting match:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter le match",
        variant: "destructive",
      });
    }
  };

  const rejectMatch = async (matchId: number) => {
    try {
      const { error } = await supabase
        .from('move_matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Match rejeté",
        description: "La correspondance a été supprimée",
      });

      fetchMatches();
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le match",
        variant: "destructive",
      });
    }
  };

  const markAsCompleted = async (matchId: number) => {
    try {
      // Mettre à jour le statut du client
      const { error } = await supabase
        .from('clients')
        .update({ status: 'completed' })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Trajet terminé",
        description: "Le match a été marqué comme terminé",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme terminé",
        variant: "destructive",
      });
    }
  };

  const showMatchOnMap = (match: Match) => {
    setSelectedMatchForMap(match);
    setShowMapPopup(true);
  };

  const prepareMapItems = (match: Match) => {
    const items = [];

    // Ajouter le client
    if (clientData?.departure_postal_code && clientData?.arrival_postal_code) {
      items.push({
        id: clientId,
        type: 'client' as const,
        reference: `CLI-${String(clientId).padStart(6, '0')}`,
        name: clientData.name || clientName,
        date: clientData.desired_date ? 
          new Date(clientData.desired_date).toLocaleDateString('fr-FR') : '',
        details: `${clientData.departure_postal_code} → ${clientData.arrival_postal_code}`,
        departure_postal_code: clientData.departure_postal_code,
        arrival_postal_code: clientData.arrival_postal_code,
        departure_city: clientData.departure_city,
        arrival_city: clientData.arrival_city,
        color: '#16a34a' // vert pour client
      });
    }

    // Ajouter le trajet du match
    if (match.confirmed_move?.departure_postal_code && match.confirmed_move?.arrival_postal_code) {
      items.push({
        id: match.id,
        type: 'move' as const,
        reference: `TRJ-${String(match.id).padStart(6, '0')}`,
        name: match.confirmed_move.company_name || 'Déménageur',
        date: match.confirmed_move.departure_date ? 
          new Date(match.confirmed_move.departure_date).toLocaleDateString('fr-FR') : '',
        details: `${match.confirmed_move.departure_postal_code} → ${match.confirmed_move.arrival_postal_code}`,
        departure_postal_code: match.confirmed_move.departure_postal_code,
        arrival_postal_code: match.confirmed_move.arrival_postal_code,
        departure_city: match.confirmed_move.departure_city,
        arrival_city: match.confirmed_move.arrival_city,
        company_name: match.confirmed_move.company_name,
        color: '#2563eb' // bleu pour trajet
      });
    }

    return items;
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Correspondances pour {clientName}</span>
            </DialogTitle>
          </DialogHeader>

          {showRadar && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Radar className="h-12 w-12 text-blue-600" />
              </motion.div>
              <p className="text-gray-600">Recherche des correspondances...</p>
            </motion.div>
          )}

          {!showRadar && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune correspondance trouvée</p>
                </div>
              ) : (
                matches.map((match) => (
                  <Card key={match.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Truck className="h-5 w-5 text-blue-600" />
                          <span>{match.confirmed_move?.company_name}</span>
                          <Badge variant="outline" className="ml-2">
                            MTH-{String(match.id).padStart(6, '0')}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getMatchTypeColor(match.match_type)}>
                            {match.match_type}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showMatchOnMap(match)}
                            className="flex items-center space-x-1"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium ml-2">{match.distance_km}km</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-3">
                        <Button 
                          size="sm"
                          onClick={() => acceptMatch(match.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accepter Match
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => rejectMatch(match.id)}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => markAsCompleted(match.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Trajet terminé
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Popup de carte */}
      <MapPopup
        open={showMapPopup}
        onOpenChange={setShowMapPopup}
        items={selectedMatchForMap ? prepareMapItems(selectedMatchForMap) : []}
        title={`Carte du match ${selectedMatchForMap ? `MTH-${String(selectedMatchForMap.id).padStart(6, '0')}` : ''}`}
      />
    </>
  );
};
