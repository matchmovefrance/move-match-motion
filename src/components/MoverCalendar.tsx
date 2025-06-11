
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
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMoves();
    }
  }, [user, profile]);

  const fetchMoves = async () => {
    try {
      console.log('🔍 Fetching moves for user:', user?.email, 'role:', profile?.role);
      
      // Pour les agents et admins, récupérer TOUS les trajets sans aucun filtre
      // Pour les déménageurs, filtrer par contact_email
      let query = supabase
        .from('confirmed_moves')
        .select('*')
        .order('departure_date', { ascending: true });

      if (profile?.role === 'demenageur') {
        console.log('👤 Déménageur - filtering by contact_email:', user?.email);
        query = query.eq('contact_email', user?.email);
      } else {
        console.log('👨‍💼 Agent/Admin - showing ALL moves without any filter');
        // Pas de filtre du tout pour les agents et admins - ils voient TOUT
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching moves:', error);
        throw error;
      }
      
      console.log('✅ Raw moves data from database:', data);
      console.log('✅ Total number of moves in database:', data?.length || 0);
      
      // Log de la structure de la première entrée pour debug
      if (data && data.length > 0) {
        console.log('📋 First move structure:', data[0]);
        
        data.forEach((move, index) => {
          console.log(`📍 Move ${index + 1}:`, {
            id: move.id,
            departure_city: move.departure_city,
            arrival_city: move.arrival_city,
            contact_email: move.contact_email,
            departure_date: move.departure_date,
            created_by: move.created_by,
            status_custom: move.status_custom
          });
        });
      } else {
        console.log('⚠️ No moves found in database');
        
        // Vérification additionnelle - compter le total dans la table
        const { count } = await supabase
          .from('confirmed_moves')
          .select('*', { count: 'exact', head: true });
        
        console.log('🔢 Total count in confirmed_moves table:', count);
      }
      
      setMoves(data || []);
    } catch (error) {
      console.error('Error fetching moves:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les trajets",
        variant: "destructive",
      });
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
          status_custom: 'en_cours',
          contact_email: user.email // Associer l'email de l'utilisateur
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
          <h2 className="text-2xl font-bold text-gray-800">
            {profile?.role === 'demenageur' ? 'Mon Agenda' : 'Agenda des Trajets'}
          </h2>
        </div>
        <Button
          onClick={() => setShowAddMove(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un trajet
        </Button>
      </div>

      {/* Informations de debug améliorées */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm border border-blue-200">
        <p><strong>🔍 Debug Info:</strong></p>
        <p>📧 Utilisateur: {user?.email}</p>
        <p>👤 Rôle: {profile?.role}</p>
        <p>📊 Nombre de trajets trouvés: {moves.length}</p>
        <p>🔄 Filtre appliqué: {profile?.role === 'demenageur' ? `contact_email = ${user?.email}` : 'Aucun filtre (tous les trajets)'}</p>
        <Button 
          onClick={fetchMoves} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          🔄 Recharger les trajets
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
            <Button onClick={async () => {
              if (!user) return;

              try {
                console.log('➕ Adding new move:', newMove);
                
                const { error } = await supabase
                  .from('confirmed_moves')
                  .insert({
                    ...newMove,
                    mover_id: 1,
                    truck_id: 1,
                    created_by: user.id,
                    status_custom: 'en_cours',
                    contact_email: user.email
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
            }}>Ajouter</Button>
            <Button variant="outline" onClick={() => setShowAddMove(false)}>
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {moves.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {profile?.role === 'demenageur' 
                ? 'Aucun trajet assigné pour le moment' 
                : 'Aucun trajet trouvé dans la base de données'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {profile?.role === 'demenageur' 
                ? 'Les trajets vous seront assignés par votre email de contact'
                : 'Vérifiez que des trajets ont été créés dans la table confirmed_moves'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Consultez les logs de la console pour plus d'informations de débogage
            </p>
          </div>
        ) : (
          moves.map((move) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default MoverCalendar;
