
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import StatusToggle from './StatusToggle';

interface Move {
  id: number;
  departure_date: string;
  departure_postal_code: string;
  departure_city: string;
  arrival_postal_code: string;
  arrival_city: string;
  used_volume: number;
  status_custom: string;
}

const MoverCalendar = () => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [showAddMove, setShowAddMove] = useState(false);
  const [newMove, setNewMove] = useState({
    departure_date: '',
    departure_postal_code: '',
    departure_city: '',
    arrival_postal_code: '',
    arrival_city: '',
    used_volume: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMoves();
    }
  }, [user]);

  const fetchMoves = async () => {
    try {
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('created_by', user?.id)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setMoves(data || []);
    } catch (error) {
      console.error('Error fetching moves:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMove = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .insert({
          ...newMove,
          mover_id: 1, // Default mover for now
          truck_id: 1, // Default truck for now
          created_by: user.id,
          status_custom: 'en_cours'
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Trajet ajouté avec succès",
      });

      setNewMove({
        departure_date: '',
        departure_postal_code: '',
        departure_city: '',
        arrival_postal_code: '',
        arrival_city: '',
        used_volume: 0
      });
      setShowAddMove(false);
      fetchMoves();
    } catch (error: any) {
      console.error('Error adding move:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le trajet",
        variant: "destructive",
      });
    }
  };

  const updateMoveStatus = async (moveId: number, newStatus: 'en_cours' | 'termine') => {
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .update({ status_custom: newStatus })
        .eq('id', moveId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut mis à jour: ${newStatus === 'termine' ? 'Terminé' : 'En cours'}`,
      });

      fetchMoves();
    } catch (error: any) {
      console.error('Error updating move status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Mon Agenda</h2>
        </div>
        <Button
          onClick={() => setShowAddMove(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un trajet
        </Button>
      </div>

      {showAddMove && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">Nouveau trajet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              value={newMove.departure_date}
              onChange={(e) => setNewMove({ ...newMove, departure_date: e.target.value })}
            />
            <Input
              placeholder="Code postal départ"
              value={newMove.departure_postal_code}
              onChange={(e) => setNewMove({ ...newMove, departure_postal_code: e.target.value })}
            />
            <Input
              placeholder="Ville de départ"
              value={newMove.departure_city}
              onChange={(e) => setNewMove({ ...newMove, departure_city: e.target.value })}
            />
            <Input
              placeholder="Code postal arrivée"
              value={newMove.arrival_postal_code}
              onChange={(e) => setNewMove({ ...newMove, arrival_postal_code: e.target.value })}
            />
            <Input
              placeholder="Ville d'arrivée"
              value={newMove.arrival_city}
              onChange={(e) => setNewMove({ ...newMove, arrival_city: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Volume utilisé (m³)"
              value={newMove.used_volume}
              onChange={(e) => setNewMove({ ...newMove, used_volume: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={addMove}>Ajouter</Button>
            <Button variant="outline" onClick={() => setShowAddMove(false)}>
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {moves.map((move) => (
          <motion.div
            key={move.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {move.departure_city} → {move.arrival_city}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
                    <span>Volume: {move.used_volume}m³</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{move.departure_postal_code} → {move.arrival_postal_code}</span>
                  </div>
                </div>
              </div>
              
              <StatusToggle
                status={move.status_custom || 'en_cours'}
                onStatusChange={(newStatus) => updateMoveStatus(move.id, newStatus)}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MoverCalendar;
