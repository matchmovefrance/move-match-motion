
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, MapPin, Calendar, Volume2, Users, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MatchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  onMatchUpdated: () => void;
}

export const MatchDetailsDialog = ({ open, onOpenChange, match, onMatchUpdated }: MatchDetailsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!match) return null;

  const acceptMatch = async () => {
    try {
      setLoading(true);
      
      // Mettre à jour le statut du client dans la table unifiée
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'confirmed',
          match_status: 'accepted',
          is_matched: true,
          matched_at: new Date().toISOString()
        })
        .eq('id', match.client_id);

      if (error) throw error;

      toast({
        title: "Match accepté",
        description: "La correspondance a été acceptée avec succès",
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
    } finally {
      setLoading(false);
    }
  };

  const rejectMatch = async () => {
    try {
      setLoading(true);
      
      // Supprimer le match
      const { error: matchError } = await supabase
        .from('move_matches')
        .delete()
        .eq('id', match.id);

      if (matchError) throw matchError;

      // Mettre à jour le statut du client
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          match_status: 'rejected'
        })
        .eq('id', match.client_id);

      if (clientError) throw clientError;

      toast({
        title: "Match rejeté",
        description: "La correspondance a été rejetée",
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Détails du Match</span>
            <Badge variant="outline">
              MTH-{String(match.id).padStart(6, '0')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du client */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center mb-3">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Client
            </h3>
            <div className="space-y-2 text-sm">
              <div>Nom: {match.client?.name || 'Non défini'}</div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-green-600" />
                Départ: {match.client?.departure_postal_code} {match.client?.departure_city}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-red-600" />
                Arrivée: {match.client?.arrival_postal_code} {match.client?.arrival_city}
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                Date: {match.client?.desired_date ? new Date(match.client.desired_date).toLocaleDateString('fr-FR') : 'Non définie'}
              </div>
              <div className="flex items-center">
                <Volume2 className="h-3 w-3 mr-1 text-orange-600" />
                Volume: {match.client?.estimated_volume || 0} m³
              </div>
            </div>
          </div>

          {/* Informations du trajet */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center mb-3">
              <Truck className="h-4 w-4 mr-2 text-purple-600" />
              Trajet confirmé
            </h3>
            <div className="space-y-2 text-sm">
              <div>Entreprise: {match.confirmed_move?.company_name || 'Non définie'}</div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-green-600" />
                Départ: {match.confirmed_move?.departure_postal_code} {match.confirmed_move?.departure_city}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-red-600" />
                Arrivée: {match.confirmed_move?.arrival_postal_code} {match.confirmed_move?.arrival_city}
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                Date: {match.confirmed_move?.departure_date ? new Date(match.confirmed_move.departure_date).toLocaleDateString('fr-FR') : 'Non définie'}
              </div>
              <div className="flex items-center">
                <Volume2 className="h-3 w-3 mr-1 text-orange-600" />
                Volume disponible: {match.confirmed_move?.available_volume || 0} m³
              </div>
            </div>
          </div>

          {/* Métriques du match */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Métriques de correspondance</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="ml-2 font-medium">{match.distance_km} km</span>
              </div>
              <div>
                <span className="text-gray-600">Différence de dates:</span>
                <span className="ml-2 font-medium">{match.date_diff_days} jours</span>
              </div>
              <div>
                <span className="text-gray-600">Volume combiné:</span>
                <span className="ml-2 font-medium">{match.combined_volume} m³</span>
              </div>
              <div>
                <span className="text-gray-600">Volume OK:</span>
                <Badge variant={match.volume_ok ? 'default' : 'secondary'} className="ml-2">
                  {match.volume_ok ? 'Oui' : 'Non'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Type de match:</span>
                <span className="ml-2 font-medium">{match.match_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Statut:</span>
                <Badge variant={match.is_valid ? 'default' : 'destructive'} className="ml-2">
                  {match.is_valid ? 'Valide' : 'Non valide'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          {match.is_valid && (
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={acceptMatch}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accepter le match
              </Button>
              <Button
                onClick={rejectMatch}
                disabled={loading}
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter le match
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
