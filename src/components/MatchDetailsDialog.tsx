
import { useState, useEffect } from 'react';
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
  const [clientData, setClientData] = useState<any>(null);
  const [moveData, setMoveData] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    if (open && match) {
      fetchCompleteDetails();
    }
  }, [open, match]);

  const fetchCompleteDetails = async () => {
    if (!match) return;
    
    try {
      setFetchingDetails(true);
      console.log('🔍 Récupération détails complets pour match:', match.id);

      // Récupérer les détails complets du client
      const { data: clientDetails, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', match.client_id)
        .single();

      if (clientError) {
        console.error('❌ Erreur récupération client:', clientError);
      } else {
        console.log('✅ Détails client récupérés:', clientDetails);
        setClientData(clientDetails);
      }

      // Récupérer les détails complets du trajet
      const { data: moveDetails, error: moveError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('id', match.move_id)
        .single();

      if (moveError) {
        console.error('❌ Erreur récupération trajet:', moveError);
      } else {
        console.log('✅ Détails trajet récupérés:', moveDetails);
        setMoveData(moveDetails);
      }

    } catch (error) {
      console.error('❌ Erreur récupération détails:', error);
    } finally {
      setFetchingDetails(false);
    }
  };

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

  if (!match) return null;

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

        {fetchingDetails ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Chargement des détails...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informations du client */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold flex items-center mb-3">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                Client
              </h3>
              <div className="space-y-2 text-sm">
                <div>Nom: {clientData?.name || 'Non défini'}</div>
                <div>Référence: {clientData?.client_reference || 'Non définie'}</div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-green-600" />
                  Départ: {clientData?.departure_postal_code || 'Non défini'} {clientData?.departure_city || ''}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-red-600" />
                  Arrivée: {clientData?.arrival_postal_code || 'Non défini'} {clientData?.arrival_city || ''}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                  Date: {clientData?.desired_date ? new Date(clientData.desired_date).toLocaleDateString('fr-FR') : 'Non définie'}
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-3 w-3 mr-1 text-orange-600" />
                  Volume: {clientData?.estimated_volume || 0} m³
                </div>
                {clientData?.email && (
                  <div>Email: {clientData.email}</div>
                )}
                {clientData?.phone && (
                  <div>Téléphone: {clientData.phone}</div>
                )}
              </div>
            </div>

            {/* Informations du trajet */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold flex items-center mb-3">
                <Truck className="h-4 w-4 mr-2 text-purple-600" />
                Trajet confirmé
              </h3>
              <div className="space-y-2 text-sm">
                <div>Entreprise: {moveData?.company_name || 'Non définie'}</div>
                <div>Contact: {moveData?.contact_email || 'Non défini'}</div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-green-600" />
                  Départ: {moveData?.departure_postal_code || 'Non défini'} {moveData?.departure_city || ''}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-red-600" />
                  Arrivée: {moveData?.arrival_postal_code || 'Non défini'} {moveData?.arrival_city || ''}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                  Date: {moveData?.departure_date ? new Date(moveData.departure_date).toLocaleDateString('fr-FR') : 'Non définie'}
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-3 w-3 mr-1 text-orange-600" />
                  Volume max: {moveData?.max_volume || 0} m³
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-3 w-3 mr-1 text-blue-600" />
                  Volume utilisé: {moveData?.used_volume || 0} m³
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-3 w-3 mr-1 text-green-600" />
                  Volume disponible: {moveData ? (moveData.max_volume || 0) - (moveData.used_volume || 0) : 0} m³
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
        )}
      </DialogContent>
    </Dialog>
  );
};
