
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Calendar, MapPin, Package, Users, CheckCircle, Map } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SimpleMoverFormReplacement from './SimpleMoverFormReplacement';
import MapPopup from './MapPopup';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

const MoverList = () => {
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
      
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMoves(data || []);
      console.log('📋 Trajets confirmés chargés:', data?.length || 0);
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
          <p className="text-gray-600 mt-2">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Trajets Confirmés</h2>
            <Badge variant="secondary">{filteredMoves.length}</Badge>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Trajet
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Input
              placeholder="Rechercher par entreprise, déménageur, ville ou code postal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4"
            />
          </div>
        </div>

        {filteredMoves.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Aucun trajet trouvé pour cette recherche' : 'Aucun trajet confirmé'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMoves.map((move) => (
              <Card key={move.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {move.company_name}
                        {getStatusBadge(move.status)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        <strong>Déménageur:</strong> {move.mover_name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {move.departure_postal_code} {move.departure_city} → {move.arrival_postal_code} {move.arrival_city}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir menu</span>
                          <div className="h-4 w-4">⋮</div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShowOnMap(move)}>
                          <Map className="h-4 w-4 mr-2" />
                          Voir sur la carte
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingMove(move)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMove(move.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date de départ:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(move.departure_date), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Volume total:</span>
                      <span className="font-medium">{move.max_volume} m³</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Volume utilisé:</span>
                      <span className="font-medium">{move.used_volume} m³</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Volume disponible:</span>
                      <span className="font-medium text-green-600">{move.available_volume} m³</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Type de camion:</span>
                      <span className="font-medium">{move.truck_type}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShowOnMap(move)}
                      className="flex-1"
                    >
                      <Map className="h-4 w-4 mr-1" />
                      Carte
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMove(move)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

export default MoverList;
