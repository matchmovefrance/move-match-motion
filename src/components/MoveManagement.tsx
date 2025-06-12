
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Calendar, MapPin, Package, Users, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MoveCardDialog from './MoveCardDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Move {
  id: string;
  title: string;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  estimated_volume: number;
  status: string;
  created_at: string;
  client_request_id?: number;
  departure_address?: string;
  arrival_address?: string;
  departure_postal_code?: string;
  arrival_postal_code?: string;
  desired_date?: string;
  description?: string;
}

const MoveManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  useEffect(() => {
    loadMoves();
  }, [user]);

  const loadMoves = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pricing_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMoves(data || []);
    } catch (error) {
      console.error('Error loading moves:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les déménagements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setSelectedMove(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMove(null);
  };

  const handleSelectMove = (move: Move) => {
    setSelectedMove(move);
    setIsDialogOpen(true);
  };

  const handleCreateMove = async (moveData: Partial<Move>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('pricing_opportunities')
        .insert({
          title: moveData.title || '',
          departure_city: moveData.departure_city || '',
          arrival_city: moveData.arrival_city || '',
          departure_date: moveData.departure_date || new Date().toISOString().split('T')[0],
          estimated_volume: moveData.estimated_volume || 0,
          status: moveData.status || 'draft',
          departure_address: moveData.departure_address || '',
          arrival_address: moveData.arrival_address || '',
          departure_postal_code: moveData.departure_postal_code || '',
          arrival_postal_code: moveData.arrival_postal_code || '',
          desired_date: moveData.desired_date || moveData.departure_date || new Date().toISOString().split('T')[0],
          description: moveData.description || '',
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Déménagement créé",
        description: "Le déménagement a été créé avec succès",
      });
      
      loadMoves();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le déménagement",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMove = async (moveData: Partial<Move>) => {
    if (!user || !selectedMove) return;
    
    try {
      const { error } = await supabase
        .from('pricing_opportunities')
        .update({
          title: moveData.title,
          departure_city: moveData.departure_city,
          arrival_city: moveData.arrival_city,
          departure_date: moveData.departure_date,
          estimated_volume: moveData.estimated_volume,
          status: moveData.status,
          departure_address: moveData.departure_address,
          arrival_address: moveData.arrival_address,
          departure_postal_code: moveData.departure_postal_code,
          arrival_postal_code: moveData.arrival_postal_code,
          description: moveData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMove.id);

      if (error) throw error;

      toast({
        title: "Déménagement mis à jour",
        description: "Le déménagement a été mis à jour avec succès",
      });
      
      loadMoves();
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le déménagement",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMove = async (moveId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('pricing_opportunities')
        .delete()
        .eq('id', moveId);

      if (error) throw error;

      toast({
        title: "Déménagement supprimé",
        description: "Le déménagement a été supprimé avec succès",
      });
      
      loadMoves();
    } catch (error) {
      console.error('Error deleting move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le déménagement",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Déménagements
          </CardTitle>
          <Button size="sm" onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {moves.length === 0 ? (
            <p className="text-center text-gray-500">Aucun déménagement trouvé.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {moves.map((move) => (
                <Card key={move.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {move.title}
                          {getStatusBadge(move.status)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {move.departure_city} → {move.arrival_city}
                        </p>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(move.departure_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {move.estimated_volume} m³
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectMove(move)}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMove(move.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MoveCardDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        move={selectedMove}
        onMoveUpdated={loadMoves}
      />
    </>
  );
};

export default MoveManagement;
