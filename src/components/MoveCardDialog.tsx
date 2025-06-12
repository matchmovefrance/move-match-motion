
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Package, User, Phone, Mail, Clock, Truck, AlertTriangle, CheckCircle, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MoveCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  move: any;
  onMoveUpdated?: () => void;
}

const MoveCardDialog = ({ open, onOpenChange, move, onMoveUpdated }: MoveCardDialogProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!move) return null;

  const handleMarkAsCompleted = async () => {
    try {
      setIsUpdating(true);
      console.log('🏁 Marquage trajet terminé:', move.id);

      const { error } = await supabase
        .from('confirmed_moves')
        .update({ 
          status: 'completed',
          status_custom: 'termine'
        })
        .eq('id', move.id);

      if (error) throw error;

      toast({
        title: "Trajet terminé",
        description: `Le trajet de ${move.mover_name || move.company_name} a été marqué comme terminé`,
      });

      onOpenChange(false);
      if (onMoveUpdated) {
        onMoveUpdated();
      }

    } catch (error) {
      console.error('❌ Erreur marquage terminé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le trajet comme terminé",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string, customStatus?: string) => {
    if (status === 'completed' || customStatus === 'termine') {
      return <Badge className="bg-gray-100 text-gray-800">Terminé</Badge>;
    }
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmé</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isCompleted = move.status === 'completed' || move.status_custom === 'termine';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Détails du trajet - {move.mover_name || move.company_name}
            {getStatusBadge(move.status, move.status_custom)}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>{move.departure_city} → {move.arrival_city}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Informations du trajet
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Départ:</span>
                  <div className="font-medium">{move.departure_city}</div>
                  <div className="text-xs text-muted-foreground">{move.departure_postal_code}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Arrivée:</span>
                  <div className="font-medium">{move.arrival_city}</div>
                  <div className="text-xs text-muted-foreground">{move.arrival_postal_code}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date de départ:</span>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(move.departure_date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                  {move.departure_time && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {move.departure_time}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Arrivée prévue:</span>
                  <div className="font-medium">
                    {move.estimated_arrival_date ? 
                      format(new Date(move.estimated_arrival_date), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non précisée'
                    }
                  </div>
                  {move.estimated_arrival_time && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {move.estimated_arrival_time}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacité et volume */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                Capacité et volume
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{move.max_volume || 0}m³</div>
                  <div className="text-muted-foreground">Volume max</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{move.used_volume || 0}m³</div>
                  <div className="text-muted-foreground">Volume utilisé</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(move.max_volume || 0) - (move.used_volume || 0)}m³</div>
                  <div className="text-muted-foreground">Volume disponible</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Taux d'occupation</span>
                  <span>{Math.round(((move.used_volume || 0) / (move.max_volume || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(((move.used_volume || 0) / (move.max_volume || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations prestataire */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                Prestataire
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Entreprise:</span>
                  <div className="font-medium">{move.company_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <div className="font-medium">{move.mover_name}</div>
                </div>
                {move.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{move.contact_email}</span>
                  </div>
                )}
                {move.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{move.contact_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prix et tarification */}
          {(move.price_per_m3 || move.total_price) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-yellow-500" />
                  Tarification
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {move.price_per_m3 && (
                    <div>
                      <span className="text-muted-foreground">Prix au m³:</span>
                      <div className="font-medium">{move.price_per_m3}€</div>
                    </div>
                  )}
                  {move.total_price && (
                    <div>
                      <span className="text-muted-foreground">Prix total:</span>
                      <div className="font-medium">{move.total_price}€</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conditions spéciales */}
          {(move.special_requirements || move.access_conditions || move.description) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Conditions spéciales
                </h3>
                <div className="space-y-2 text-sm">
                  {move.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <div className="bg-gray-50 p-2 rounded-md">{move.description}</div>
                    </div>
                  )}
                  {move.special_requirements && (
                    <div>
                      <span className="text-muted-foreground">Exigences particulières:</span>
                      <div className="bg-gray-50 p-2 rounded-md">{move.special_requirements}</div>
                    </div>
                  )}
                  {move.access_conditions && (
                    <div>
                      <span className="text-muted-foreground">Conditions d'accès:</span>
                      <div className="bg-gray-50 p-2 rounded-md">{move.access_conditions}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {!isCompleted && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={handleMarkAsCompleted}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Flag className="h-4 w-4 mr-2" />
                {isUpdating ? 'Marquage en cours...' : 'Marquer comme terminé'}
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="flex justify-center pt-4 border-t">
              <Badge className="bg-gray-100 text-gray-800 text-lg px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Trajet terminé
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCardDialog;
