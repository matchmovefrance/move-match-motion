
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Trash2, 
  Edit, 
  Plus, 
  Calendar, 
  MapPin, 
  Package, 
  Users, 
  Map,
  Search,
  Truck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SimpleMoverFormReplacement from './SimpleMoverFormReplacement';
import MapPopup from './MapPopup';

interface ConfirmedMove {
  id: number;
  company_name: string;
  mover_name: string;
  departure_city: string;
  arrival_city: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  status: string;
  truck_type: string;
  contact_phone: string;
  created_at: string;
  departure_address?: string;
  arrival_address?: string;
  description?: string;
}

const MoveManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moves, setMoves] = useState<ConfirmedMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMove, setEditingMove] = useState<ConfirmedMove | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [selectedMoveForMap, setSelectedMoveForMap] = useState<ConfirmedMove | null>(null);

  useEffect(() => {
    loadMoves();
  }, [user]);

  const loadMoves = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('🔍 Chargement des trajets confirmés...');
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors du chargement des trajets:', error);
        throw error;
      }
      
      console.log('📋 Trajets confirmés chargés:', data?.length || 0, data);
      setMoves(data || []);
    } catch (error) {
      console.error('Error loading moves:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les trajets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMove = async (moveId: number) => {
    if (!user) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .delete()
        .eq('id', moveId);

      if (error) throw error;

      toast({
        title: "Trajet supprimé",
        description: "Le trajet a été supprimé avec succès",
      });
      
      loadMoves();
    } catch (error) {
      console.error('Error deleting move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le trajet",
        variant: "destructive",
      });
    }
  };

  const handleShowOnMap = (move: ConfirmedMove) => {
    setSelectedMoveForMap(move);
    setShowMapPopup(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredMoves = moves.filter(move =>
    move.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.mover_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.departure_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.arrival_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.departure_postal_code?.includes(searchTerm) ||
    move.arrival_postal_code?.includes(searchTerm)
  );

  const formatMapItem = (move: ConfirmedMove) => ({
    id: move.id,
    type: 'move' as const,
    reference: `TRJ-${move.id}`,
    name: move.company_name,
    date: format(new Date(move.departure_date), 'dd/MM/yyyy', { locale: fr }),
    details: `${move.departure_city} → ${move.arrival_city} (${move.available_volume}m³ dispo)`,
    departure_postal_code: move.departure_postal_code,
    arrival_postal_code: move.arrival_postal_code,
    departure_city: move.departure_city,
    arrival_city: move.arrival_city,
    company_name: move.company_name,
    color: '#2563eb'
  });

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Nouveau Trajet</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowAddForm(false)}
          >
            Retour à la liste
          </Button>
        </div>
        <SimpleMoverFormReplacement 
          onSuccess={() => {
            setShowAddForm(false);
            loadMoves();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement des trajets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Trajets de Déménagement</h2>
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
              placeholder="Rechercher par entreprise, déménageur, ville ou code postal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredMoves.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Aucun trajet trouvé pour cette recherche' : 'Aucun trajet de déménagement'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cliquez sur "Nouveau Trajet" pour ajouter un trajet
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Liste des Trajets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMoves.map((move) => (
                    <TableRow key={move.id}>
                      <TableCell className="font-medium">
                        {move.company_name}
                      </TableCell>
                      <TableCell>{move.mover_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            {move.departure_postal_code} {move.departure_city}
                          </span>
                          <span className="text-gray-400">→</span>
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-sm">
                            {move.arrival_postal_code} {move.arrival_city}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span>{format(new Date(move.departure_date), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{move.max_volume}m³</span> total
                          </div>
                          <div className="text-sm text-green-600">
                            <span className="font-medium">{move.available_volume}m³</span> disponible
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(move.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowOnMap(move)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Map className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMove(move)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMove(move.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedMoveForMap && (
        <MapPopup
          open={showMapPopup}
          onOpenChange={setShowMapPopup}
          items={[formatMapItem(selectedMoveForMap)]}
          title={`Trajet ${selectedMoveForMap.company_name}`}
        />
      )}
    </>
  );
};

export default MoveManagement;
