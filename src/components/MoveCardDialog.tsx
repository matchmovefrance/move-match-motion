
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Package, User, Phone, Mail, Clock, Truck, AlertTriangle, CheckCircle, Flag, Save } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MoveCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  move?: any;
  onMoveUpdated?: () => void;
}

const MoveCardDialog = ({ open, onOpenChange, move, onMoveUpdated }: MoveCardDialogProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(!move);
  const [formData, setFormData] = useState({
    title: move?.title || '',
    departure_city: move?.departure_city || '',
    arrival_city: move?.arrival_city || '',
    departure_date: move?.departure_date || new Date().toISOString().split('T')[0],
    estimated_volume: move?.estimated_volume || 0,
    status: move?.status || 'draft',
    departure_address: move?.departure_address || '',
    arrival_address: move?.arrival_address || '',
    departure_postal_code: move?.departure_postal_code || '',
    arrival_postal_code: move?.arrival_postal_code || '',
    description: move?.description || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      if (move) {
        // Update existing move
        const { error } = await supabase
          .from('pricing_opportunities')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', move.id);

        if (error) throw error;

        toast({
          title: "Déménagement mis à jour",
          description: "Les modifications ont été sauvegardées",
        });
      } else {
        // Create new move
        const { error } = await supabase
          .from('pricing_opportunities')
          .insert({
            ...formData,
            desired_date: formData.departure_date,
          });

        if (error) throw error;

        toast({
          title: "Déménagement créé",
          description: "Le nouveau déménagement a été créé",
        });
      }

      setIsEditing(false);
      if (onMoveUpdated) {
        onMoveUpdated();
      }
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le déménagement",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            {move ? 'Modifier le déménagement' : 'Nouveau déménagement'}
            {move && getStatusBadge(formData.status)}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>{formData.departure_city} → {formData.arrival_city}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Titre du déménagement"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_volume">Volume (m³)</Label>
                  <Input
                    id="estimated_volume"
                    name="estimated_volume"
                    type="number"
                    value={formData.estimated_volume}
                    onChange={handleInputChange}
                    placeholder="Volume estimé"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departure_city">Ville de départ</Label>
                  <Input
                    id="departure_city"
                    name="departure_city"
                    value={formData.departure_city}
                    onChange={handleInputChange}
                    placeholder="Ville de départ"
                  />
                </div>
                <div>
                  <Label htmlFor="arrival_city">Ville d'arrivée</Label>
                  <Input
                    id="arrival_city"
                    name="arrival_city"
                    value={formData.arrival_city}
                    onChange={handleInputChange}
                    placeholder="Ville d'arrivée"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departure_address">Adresse de départ</Label>
                  <Input
                    id="departure_address"
                    name="departure_address"
                    value={formData.departure_address}
                    onChange={handleInputChange}
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <Label htmlFor="arrival_address">Adresse d'arrivée</Label>
                  <Input
                    id="arrival_address"
                    name="arrival_address"
                    value={formData.arrival_address}
                    onChange={handleInputChange}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departure_date">Date de départ</Label>
                  <Input
                    id="departure_date"
                    name="departure_date"
                    type="date"
                    value={formData.departure_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description du déménagement"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          ) : (
            // Read-only view
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    Informations du déménagement
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Départ:</span>
                      <div className="font-medium">{formData.departure_city}</div>
                      <div className="text-xs text-muted-foreground">{formData.departure_address}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Arrivée:</span>
                      <div className="font-medium">{formData.arrival_city}</div>
                      <div className="text-xs text-muted-foreground">{formData.arrival_address}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date de départ:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(formData.departure_date), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <div className="font-medium">{formData.estimated_volume} m³</div>
                    </div>
                  </div>
                  {formData.description && (
                    <div className="mt-4">
                      <span className="text-muted-foreground">Description:</span>
                      <div className="bg-gray-50 p-2 rounded-md mt-1">{formData.description}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCardDialog;
