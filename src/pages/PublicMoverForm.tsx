
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Calendar, Package, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PublicMoverForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    company_name: '',
    mover_name: '',
    contact_phone: '',
    contact_email: '',
    departure_city: '',
    departure_postal_code: '',
    departure_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    arrival_address: '',
    departure_date: '',
    departure_time: '',
    estimated_arrival_date: '',
    estimated_arrival_time: '',
    max_volume: '',
    price_per_m3: '',
    truck_identifier: '',
    truck_type: 'Semi-remorque',
    description: '',
    special_requirements: ''
  });

  useEffect(() => {
    if (token) {
      checkLinkValidity();
    }
  }, [token]);

  const checkLinkValidity = async () => {
    try {
      const { data, error } = await supabase
        .from('public_links')
        .select('*')
        .eq('link_token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Lien invalide",
          description: "Ce lien n'existe pas ou a expiré",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setLinkData(data);
    } catch (error) {
      console.error('Error checking link:', error);
      navigate('/');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === linkData?.password) {
      setIsAuthenticated(true);
      toast({
        title: "Accès autorisé",
        description: "Vous pouvez maintenant saisir votre trajet",
      });
    } else {
      toast({
        title: "Mot de passe incorrect",
        description: "Veuillez vérifier le mot de passe",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Créer d'abord le déménageur
      const { data: moverData, error: moverError } = await supabase
        .from('movers')
        .insert({
          name: formData.mover_name,
          company_name: formData.company_name,
          phone: formData.contact_phone,
          email: formData.contact_email,
          created_by: null // Pas d'utilisateur associé pour les liens publics
        })
        .select()
        .single();

      if (moverError) throw moverError;

      // Créer le camion
      const { data: truckData, error: truckError } = await supabase
        .from('trucks')
        .insert({
          mover_id: moverData.id,
          identifier: formData.truck_identifier,
          max_volume: parseFloat(formData.max_volume)
        })
        .select()
        .single();

      if (truckError) throw truckError;

      // Créer le trajet confirmé
      const { error: moveError } = await supabase
        .from('confirmed_moves')
        .insert({
          mover_id: moverData.id,
          truck_id: truckData.id,
          company_name: formData.company_name,
          mover_name: formData.mover_name,
          departure_city: formData.departure_city,
          departure_postal_code: formData.departure_postal_code,
          departure_address: formData.departure_address,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time || null,
          arrival_city: formData.arrival_city,
          arrival_postal_code: formData.arrival_postal_code,
          arrival_address: formData.arrival_address,
          estimated_arrival_date: formData.estimated_arrival_date || null,
          estimated_arrival_time: formData.estimated_arrival_time || null,
          max_volume: parseFloat(formData.max_volume),
          available_volume: parseFloat(formData.max_volume),
          price_per_m3: parseFloat(formData.price_per_m3),
          truck_identifier: formData.truck_identifier,
          truck_type: formData.truck_type,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          description: formData.description,
          special_requirements: formData.special_requirements,
          status: 'confirmed',
          created_by: null // Pas d'utilisateur associé pour les liens publics
        });

      if (moveError) throw moveError;

      toast({
        title: "Trajet enregistré",
        description: "Votre trajet a été enregistré avec succès",
      });

      // Réinitialiser le formulaire
      setFormData({
        company_name: '',
        mover_name: '',
        contact_phone: '',
        contact_email: '',
        departure_city: '',
        departure_postal_code: '',
        departure_address: '',
        arrival_city: '',
        arrival_postal_code: '',
        arrival_address: '',
        departure_date: '',
        departure_time: '',
        estimated_arrival_date: '',
        estimated_arrival_time: '',
        max_volume: '',
        price_per_m3: '',
        truck_identifier: '',
        truck_type: 'Semi-remorque',
        description: '',
        special_requirements: ''
      });

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le trajet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Accès sécurisé</CardTitle>
            <p className="text-gray-600">Entrez le mot de passe pour accéder au formulaire</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Accéder au formulaire
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Saisie de trajet</h1>
          </div>
          <p className="text-gray-600">Enregistrez votre trajet de déménagement</p>
        </motion.div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Informations du trajet</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de l'entreprise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mover_name">Nom du responsable *</Label>
                  <Input
                    id="mover_name"
                    value={formData.mover_name}
                    onChange={(e) => handleInputChange('mover_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Téléphone *</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Informations du départ */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span>Départ</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="departure_city">Ville *</Label>
                    <Input
                      id="departure_city"
                      value={formData.departure_city}
                      onChange={(e) => handleInputChange('departure_city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure_postal_code">Code postal *</Label>
                    <Input
                      id="departure_postal_code"
                      value={formData.departure_postal_code}
                      onChange={(e) => handleInputChange('departure_postal_code', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure_address">Adresse</Label>
                    <Input
                      id="departure_address"
                      value={formData.departure_address}
                      onChange={(e) => handleInputChange('departure_address', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Informations de l'arrivée */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <span>Arrivée</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="arrival_city">Ville *</Label>
                    <Input
                      id="arrival_city"
                      value={formData.arrival_city}
                      onChange={(e) => handleInputChange('arrival_city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="arrival_postal_code">Code postal *</Label>
                    <Input
                      id="arrival_postal_code"
                      value={formData.arrival_postal_code}
                      onChange={(e) => handleInputChange('arrival_postal_code', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="arrival_address">Adresse</Label>
                    <Input
                      id="arrival_address"
                      value={formData.arrival_address}
                      onChange={(e) => handleInputChange('arrival_address', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Dates et horaires */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Planning</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure_date">Date de départ *</Label>
                    <Input
                      id="departure_date"
                      type="date"
                      value={formData.departure_date}
                      onChange={(e) => handleInputChange('departure_date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="departure_time">Heure de départ</Label>
                    <Input
                      id="departure_time"
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) => handleInputChange('departure_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_arrival_date">Date d'arrivée estimée</Label>
                    <Input
                      id="estimated_arrival_date"
                      type="date"
                      value={formData.estimated_arrival_date}
                      onChange={(e) => handleInputChange('estimated_arrival_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_arrival_time">Heure d'arrivée estimée</Label>
                    <Input
                      id="estimated_arrival_time"
                      type="time"
                      value={formData.estimated_arrival_time}
                      onChange={(e) => handleInputChange('estimated_arrival_time', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Informations du camion */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-purple-600" />
                  <span>Camion</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="truck_identifier">Identifiant du camion *</Label>
                    <Input
                      id="truck_identifier"
                      value={formData.truck_identifier}
                      onChange={(e) => handleInputChange('truck_identifier', e.target.value)}
                      placeholder="ex: CAM-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="truck_type">Type de camion</Label>
                    <select
                      id="truck_type"
                      value={formData.truck_type}
                      onChange={(e) => handleInputChange('truck_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Semi-remorque">Semi-remorque</option>
                      <option value="Camion">Camion</option>
                      <option value="Fourgon">Fourgon</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="max_volume">Volume maximum (m³) *</Label>
                    <Input
                      id="max_volume"
                      type="number"
                      step="0.1"
                      value={formData.max_volume}
                      onChange={(e) => handleInputChange('max_volume', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_per_m3">Prix par m³ (€) *</Label>
                    <Input
                      id="price_per_m3"
                      type="number"
                      step="0.01"
                      value={formData.price_per_m3}
                      onChange={(e) => handleInputChange('price_per_m3', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Détails supplémentaires sur le trajet..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="special_requirements">Exigences spéciales</Label>
                  <Textarea
                    id="special_requirements"
                    value={formData.special_requirements}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    placeholder="Équipements spéciaux, contraintes..."
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer le trajet'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicMoverForm;
