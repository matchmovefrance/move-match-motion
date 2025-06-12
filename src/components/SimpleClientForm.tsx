
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Package, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SimpleClientForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departure_address: '',
    departure_city: '',
    departure_postal_code: '',
    arrival_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    desired_date: '',
    estimated_volume: '',
    description: '',
    budget_min: '',
    budget_max: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un client",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Générer une référence client automatique
      const { data: lastClient } = await supabase
        .from('clients')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextId = (lastClient?.id || 0) + 1;
      const clientReference = `CLI-${String(nextId).padStart(6, '0')}`;

      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          client_reference: clientReference,
          departure_address: formData.departure_address,
          departure_city: formData.departure_city,
          departure_postal_code: formData.departure_postal_code,
          arrival_address: formData.arrival_address,
          arrival_city: formData.arrival_city,
          arrival_postal_code: formData.arrival_postal_code,
          desired_date: formData.desired_date,
          estimated_volume: parseFloat(formData.estimated_volume),
          description: formData.description,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
          status: 'pending',
          created_by: user.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Client ajouté",
        description: `Le client ${formData.name} a été ajouté avec la référence ${clientReference}`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        departure_address: '',
        departure_city: '',
        departure_postal_code: '',
        arrival_address: '',
        arrival_city: '',
        arrival_postal_code: '',
        desired_date: '',
        estimated_volume: '',
        description: '',
        budget_min: '',
        budget_max: ''
      });

    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Nouveau Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Adresses */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Adresses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Départ */}
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Départ</h4>
                <div>
                  <Label htmlFor="departure_address">Adresse de départ *</Label>
                  <Input
                    id="departure_address"
                    name="departure_address"
                    value={formData.departure_address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="departure_city">Ville *</Label>
                    <Input
                      id="departure_city"
                      name="departure_city"
                      value={formData.departure_city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure_postal_code">Code postal *</Label>
                    <Input
                      id="departure_postal_code"
                      name="departure_postal_code"
                      value={formData.departure_postal_code}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Arrivée */}
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Arrivée</h4>
                <div>
                  <Label htmlFor="arrival_address">Adresse d'arrivée *</Label>
                  <Input
                    id="arrival_address"
                    name="arrival_address"
                    value={formData.arrival_address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="arrival_city">Ville *</Label>
                    <Input
                      id="arrival_city"
                      name="arrival_city"
                      value={formData.arrival_city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="arrival_postal_code">Code postal *</Label>
                    <Input
                      id="arrival_postal_code"
                      name="arrival_postal_code"
                      value={formData.arrival_postal_code}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Détails du déménagement */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Détails du déménagement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="desired_date">Date souhaitée *</Label>
                <Input
                  id="desired_date"
                  name="desired_date"
                  type="date"
                  value={formData.desired_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
                <Input
                  id="estimated_volume"
                  name="estimated_volume"
                  type="number"
                  step="0.1"
                  value={formData.estimated_volume}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Budget maximum (€)</Label>
                <Input
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Informations supplémentaires, conditions d'accès, objets fragiles..."
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Ajout en cours...' : 'Ajouter le client'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleClientForm;
