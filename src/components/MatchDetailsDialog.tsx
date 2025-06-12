import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, MapPin, Calendar, Volume2, Users, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MapPopup from './MapPopup';

interface MatchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  onMatchUpdated: () => void;
}

export const MatchDetailsDialog = ({ open, onOpenChange, match, onMatchUpdated }: MatchDetailsDialogProps) => {
  const { toast } = useToast();
  const [showMapPopup, setShowMapPopup] = useState(false);

  if (!match) return null;

  const prepareMapItems = () => {
    const items = [];

    // Ajouter le client si les données sont disponibles
    if (match.client_request?.departure_postal_code && match.client_request?.arrival_postal_code) {
      items.push({
        id: match.client_request_id,
        type: 'client' as const,
        reference: `CLI-${String(match.client_request_id).padStart(6, '0')}`,
        name: match.client_request?.name || 'Client',
        date: match.client_request?.desired_date ? 
          new Date(match.client_request.desired_date).toLocaleDateString('fr-FR') : '',
        details: `${match.client_request.departure_postal_code} → ${match.client_request.arrival_postal_code}`,
        departure_postal_code: match.client_request.departure_postal_code,
        arrival_postal_code: match.client_request.arrival_postal_code,
        departure_city: match.client_request.departure_city,
        arrival_city: match.client_request.arrival_city,
        color: '#16a34a' // vert pour client
      });
    }

    // Ajouter le trajet si les données sont disponibles
    if (match.confirmed_move?.departure_postal_code && match.confirmed_move?.arrival_postal_code) {
      items.push({
        id: match.move_id,
        type: 'move' as const,
        reference: `TRJ-${String(match.move_id).padStart(6, '0')}`,
        name: match.confirmed_move?.company_name || 'Déménageur',
        date: match.confirmed_move?.departure_date ? 
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

  const acceptMatch = async () => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({ 
          status: 'confirmed',
          match_status: 'accepted',
          is_matched: true,
          matched_at: new Date().toISOString()
        })
        .eq('id', match.client_request_id);

      if (error) throw error;

      toast({
        title: "Match accepté",
        description: "La correspondance a été acceptée",
      });

      onMatchUpdated();
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

  const rejectMatch = async () => {
    try {
      const { error } = await supabase
        .from('move_matches')
        .delete()
        .eq('id', match.id);

      if (error) throw error;

      toast({
        title: "Match rejeté",
        description: "La correspondance a été supprimée",
      });

      onMatchUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le match",
        variant: "destructive",
      });
    }
  };

  const markAsCompleted = async () => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({ status: 'completed' })
        .eq('id', match.client_request_id);

      if (error) throw error;

      toast({
        title: "Trajet terminé",
        description: "Le match a été marqué comme terminé",
      });

      onMatchUpdated();
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Détails du Match MTH-{String(match.id).padStart(6, '0')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapPopup(true)}
                className="flex items-center space-x-1"
              >
                <MapPin className="h-4 w-4" />
                <span>Voir sur la carte</span>
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* En-tête avec badges */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Badge className={getMatchStatusColor(match.is_valid)}>
                  {match.is_valid ? 'Valide' : 'Non valide'}
                </Badge>
                <Badge className={getMatchTypeColor(match.match_type)}>
                  {match.match_type}
                </Badge>
              </div>
            </div>

            {/* Informations client et trajet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">Client</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Nom:</strong> {match.client_request?.name}
                  </div>
                  <div>
                    <strong>Réf:</strong> CLI-{String(match.client_request_id).padStart(6, '0')}
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
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Trajet</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Entreprise:</strong> {match.confirmed_move?.company_name}
                  </div>
                  <div>
                    <strong>Réf:</strong> TRJ-{String(match.move_id).padStart(6, '0')}
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
              <h3 className="font-semibold mb-3">Métriques de correspondance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Distance:</span>
                  <div className="font-medium text-lg">{match.distance_km}km</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Différence dates:</span>
                  <div className="font-medium text-lg">{match.date_diff_days} jours</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Volume combiné:</span>
                  <div className="font-medium text-lg">{match.combined_volume}m³</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Volume OK:</span>
                  <div className={`font-medium text-lg ${match.volume_ok ? 'text-green-600' : 'text-red-600'}`}>
                    {match.volume_ok ? 'Oui' : 'Non'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button 
                onClick={acceptMatch}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accepter Match
              </Button>
              <Button 
                variant="outline"
                onClick={rejectMatch}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter Match
              </Button>
              <Button 
                variant="outline"
                onClick={markAsCompleted}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Trajet Terminé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup de carte */}
      <MapPopup
        open={showMapPopup}
        onOpenChange={setShowMapPopup}
        items={prepareMapItems()}
        title={`Carte du match MTH-${String(match.id).padStart(6, '0')}`}
      />
    </>
  );
};
