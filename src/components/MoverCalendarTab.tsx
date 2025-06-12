
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MapPopup from './MapPopup';
import { useAuth } from '@/contexts/AuthContext';

interface ConfirmedMove {
  id: number;
  company_name: string;
  departure_date: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_city: string;
  arrival_city: string;
}

export const MoverCalendarTab = () => {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [confirmedMoves, setConfirmedMoves] = useState<ConfirmedMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [selectedMoveForMap, setSelectedMoveForMap] = useState<ConfirmedMove | null>(null);

  useEffect(() => {
    if (selectedDate && profile?.id) {
      fetchConfirmedMoves();
    }
  }, [selectedDate, profile?.id]);

  const fetchConfirmedMoves = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const formattedDate = selectedDate?.toISOString().split('T')[0];
      
      // For déménageur role, get their mover ID first
      if (profile.role === 'demenageur') {
        // First get the mover ID from the movers table
        const { data: moverData, error: moverError } = await supabase
          .from('movers')
          .select('id')
          .eq('created_by', profile.id)
          .single();

        if (moverError) {
          console.error('Error fetching mover:', moverError);
          setConfirmedMoves([]);
          return;
        }

        if (!moverData) {
          console.log('No mover found for this user');
          setConfirmedMoves([]);
          return;
        }

        // Then get their moves using the mover ID
        const { data, error } = await supabase
          .from('confirmed_moves')
          .select('*')
          .eq('departure_date', formattedDate)
          .eq('mover_id', moverData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setConfirmedMoves(data || []);
      } else {
        // For admin/agent, get all moves for the selected date
        const { data, error } = await supabase
          .from('confirmed_moves')
          .select('*')
          .eq('departure_date', formattedDate)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setConfirmedMoves(data || []);
      }
    } catch (error) {
      console.error('Error fetching confirmed moves:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMoveOnMap = (move: ConfirmedMove) => {
    setSelectedMoveForMap(move);
    setShowMapPopup(true);
  };

  const prepareMapItems = (move: ConfirmedMove) => {
    if (!move.departure_postal_code || !move.arrival_postal_code) return [];
    
    return [{
      id: move.id,
      type: 'move' as const,
      reference: `TRJ-${String(move.id).padStart(6, '0')}`,
      name: move.company_name || 'Déménageur',
      date: move.departure_date ? new Date(move.departure_date).toLocaleDateString('fr-FR') : '',
      details: `${move.departure_postal_code} → ${move.arrival_postal_code}`,
      departure_postal_code: move.departure_postal_code,
      arrival_postal_code: move.arrival_postal_code,
      departure_city: move.departure_city,
      arrival_city: move.arrival_city,
      company_name: move.company_name,
      color: '#2563eb'
    }];
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {profile?.role === 'demenageur' ? 'Mon Planning' : 'Planning des Déménagements'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendrier */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">
              Sélectionner une date
            </h3>
            <Card>
              <CardContent className="p-3">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {/* Trajets confirmés */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">
              Trajets confirmés ({confirmedMoves.length})
              {selectedDate && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {selectedDate.toLocaleDateString('fr-FR')}
                </span>
              )}
            </h3>
            
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : confirmedMoves.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun trajet confirmé</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {confirmedMoves.map((move) => (
                  <Card key={move.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">
                            TRJ-{String(move.id).padStart(6, '0')}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showMoveOnMap(move)}
                          className="flex items-center space-x-1"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>Carte</span>
                        </Button>
                      </div>

                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Date:</strong> {new Date(move.departure_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <strong>De:</strong> {move.departure_city} ({move.departure_postal_code})
                        </div>
                        <div>
                          <strong>À:</strong> {move.arrival_city} ({move.arrival_postal_code})
                        </div>
                        {move.company_name && (
                          <div>
                            <strong>Entreprise:</strong> {move.company_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup de carte */}
      <MapPopup
        open={showMapPopup}
        onOpenChange={setShowMapPopup}
        items={selectedMoveForMap ? prepareMapItems(selectedMoveForMap) : []}
        title={`Carte du trajet ${selectedMoveForMap ? `TRJ-${String(selectedMoveForMap.id).padStart(6, '0')}` : ''}`}
      />
    </>
  );
};
