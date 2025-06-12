import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { User, MapPin, Calendar, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleClientFormReplacementProps {
  onSuccess?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

const SimpleClientFormReplacement = ({ onSuccess, initialData, isEditing }: SimpleClientFormReplacementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    departure_postal_code: '',
    arrival_postal_code: '',
    desired_date: '',
    flexible_dates: false,
    flexibility_days: 0,
    estimated_volume: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        departure_postal_code: initialData.departure_postal_code || '',
        arrival_postal_code: initialData.arrival_postal_code || '',
        desired_date: initialData.desired_date || '',
        flexible_dates: initialData.flexible_dates || false,
        flexibility_days: initialData.flexibility_days || 0,
        estimated_volume: initialData.estimated_volume?.toString() || ''
      });
    }
  }, [initialData]);

  const generateClientReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `CLI-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.departure_postal_code || 
        !formData.arrival_postal_code || !formData.desired_date || !formData.estimated_volume) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const desiredDate = new Date(formData.desired_date);
      let dateRangeStart = null;
      let dateRangeEnd = null;

      if (formData.flexible_dates && formData.flexibility_days > 0) {
        dateRangeStart = new Date(desiredDate);
        dateRangeStart.setDate(dateRangeStart.getDate() - formData.flexibility_days);
        
        dateRangeEnd = new Date(desiredDate);
        dateRangeEnd.setDate(dateRangeEnd.getDate() + formData.flexibility_days);
      }

      const clientReference = isEditing ? initialData?.client_reference : generateClientReference();

      // Créer directement dans client_requests avec client_id null
      const requestData = {
        client_id: null as any, // Utiliser null pour satisfaire TypeScript
        name: formData.name,
        email: `${clientReference.toLowerCase()}@temp.com`, // Email temporaire basé sur référence
        phone: 'A renseigner', // Téléphone par défaut
        departure_city: `CP ${formData.departure_postal_code}`,
        departure_postal_code: formData.departure_postal_code,
        departure_country: 'France',
        arrival_city: `CP ${formData.arrival_postal_code}`,
        arrival_postal_code: formData.arrival_postal_code,
        arrival_country: 'France',
        desired_date: formData.desired_date,
        flexible_dates: formData.flexible_dates,
        flexibility_days: formData.flexibility_days,
        date_range_start: dateRangeStart ? dateRangeStart.toISOString().split('T')[0] : null,
        date_range_end: dateRangeEnd ? dateRangeEnd.toISOString().split('T')[0] : null,
        estimated_volume: parseFloat(formData.estimated_volume),
        status: 'pending',
        is_matched: false,
        match_status: 'pending',
        created_by: user.id,
        client_reference: clientReference
      };

      console.log('🔧 Données à insérer (avec client_id null):', requestData);

      let result;
      if (isEditing && initialData?.id) {
        result = await supabase
          .from('client_requests')
          .update(requestData)
          .eq('id', initialData.id)
          .select();
        
        console.log('📝 Client mis à jour:', result);
      } else {
        result = await supabase
          .from('client_requests')
          .insert(requestData)
          .select();
        
        console.log('✅ Nouveau client créé:', result);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Succès",
        description: `Client ${isEditing ? 'modifié' : 'créé'} avec la référence ${clientReference}`,
      });

      if (!isEditing) {
        setFormData({
          name: '',
          departure_postal_code: '',
          arrival_postal_code: '',
          desired_date: '',
          flexible_dates: false,
          flexibility_days: 0,
          estimated_volume: ''
        });
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde du client:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>{isEditing ? 'Modifier le client' : 'Nouveau Client'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du client *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom complet du client"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departure_postal_code">Code postal départ *</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <Input
                  id="departure_postal_code"
                  value={formData.departure_postal_code}
                  onChange={(e) => setFormData({ ...formData, departure_postal_code: e.target.value })}
                  placeholder="Ex: 75001"
                  maxLength={5}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="arrival_postal_code">Code postal arrivée *</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <Input
                  id="arrival_postal_code"
                  value={formData.arrival_postal_code}
                  onChange={(e) => setFormData({ ...formData, arrival_postal_code: e.target.value })}
                  placeholder="Ex: 69001"
                  maxLength={5}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="desired_date">Date souhaitée *</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <Input
                id="desired_date"
                type="date"
                value={formData.desired_date}
                onChange={(e) => setFormData({ ...formData, desired_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flexible_dates"
                checked={formData.flexible_dates}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, flexible_dates: !!checked, flexibility_days: checked ? 3 : 0 })
                }
              />
              <Label htmlFor="flexible_dates">Dates flexibles</Label>
            </div>
            
            {formData.flexible_dates && (
              <div>
                <Label htmlFor="flexibility_days">Flexibilité (± jours)</Label>
                <Input
                  id="flexibility_days"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.flexibility_days}
                  onChange={(e) => setFormData({ ...formData, flexibility_days: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 3 jours"
                />
                {formData.flexibility_days > 0 && formData.desired_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    Fenêtre: ±{formData.flexibility_days} jours autour du {new Date(formData.desired_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="estimated_volume">Volume (m³) *</Label>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-orange-600" />
              <Input
                id="estimated_volume"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.estimated_volume}
                onChange={(e) => setFormData({ ...formData, estimated_volume: e.target.value })}
                placeholder="Ex: 15.5"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer le client')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleClientFormReplacement;
