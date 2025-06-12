
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SimpleMoveFormReplacement from './SimpleMoveFormReplacement';

interface Move {
  id: number;
  mover_name: string;
  company_name: string;
  move_reference: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  status: string;
  contact_phone: string;
  contact_email: string;
  created_at: string;
}

const MoveManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMove, setEditingMove] = useState<Move | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMoves();
  }, []);

  const fetchMoves = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  const filteredMoves = moves.filter(move =>
    move.mover_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.move_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.departure_postal_code?.includes(searchTerm) ||
    move.arrival_postal_code?.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showAddForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Nouveau Trajet</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowAddForm(false)}
          >
            Retour à la liste
          </Button>
        </div>
        <SimpleMoveFormReplacement 
          onSuccess={() => {
            setShowAddForm(false);
            fetchMoves();
          }}
        />
      </motion.div>
    );
  }

  if (editingMove) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Modifier Trajet</h2>
          <Button 
            variant="outline" 
            onClick={() => setEditingMove(null)}
          >
            Retour à la liste
          </Button>
        </div>
        <SimpleMoveFormReplacement 
          initialData={editingMove}
          isEditing={true}
          onSuccess={() => {
            setEditingMove(null);
            fetchMoves();
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Trajets Déménageurs</h2>
          <Badge variant="secondary">{filteredMoves.length}</Badge>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Trajet
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par référence, déménageur, ou code postal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMoves.map((move) => (
            <Card key={move.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{move.company_name}</CardTitle>
                  <Badge className={getStatusColor(move.status)}>
                    {move.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Réf:</strong> {move.move_reference}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Déménageur:</strong> {move.mover_name}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Trajet:</span>
                    <span className="font-medium">
                      {move.departure_postal_code} → {move.arrival_postal_code}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(move.departure_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Volume total:</span>
                    <span className="font-medium">{move.max_volume}m³</span>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Volume utilisé:</span>
                    <span className="font-medium">{move.used_volume}m³</span>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Disponible:</span>
                    <span className="font-medium text-green-600">{move.available_volume}m³</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingMove(move)}
                    className="flex-1"
                  >
                    Modifier
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Carte
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredMoves.length === 0 && !loading && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Aucun trajet trouvé pour cette recherche' : 'Aucun trajet enregistré'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MoveManagement;
