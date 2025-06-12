
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, Calendar, Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PublicClientForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [linkValid, setLinkValid] = useState(true);

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
    budget_max: '',
    description: ''
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
        .eq('link_type', 'client')
        .single();

      if (error || !data) {
        setLinkValid(false);
        return;
      }

      // Vérifier l'expiration
      if (new Date(data.expires_at) < new Date()) {
        setLinkValid(false);
        return;
      }

      setLinkValid(true);
    } catch (error) {
      console.error('Error checking link validity:', error);
      setLinkValid(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_links')
        .select('*')
        .eq('link_token', token)
        .eq('password', password)
        .eq('link_type', 'client')
        .single();

      if (error || !data) {
        toast({
          title: "Erreur",
          description: "Mot de passe incorrect ou lien invalide",
          variant: "destructive",
        });
        return;
      }

      setAuthenticated(true);
    } catch (error) {
      console.error('Error authenticating:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'authentification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          ...formData,
          estimated_volume: parseFloat(formData.estimated_volume) || 0,
          budget_max: parseFloat(formData.budget_max) || null,
          status: 'pending',
          created_by: null // Pas d'utilisateur connecté pour les formulaires publics
        }]);

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Votre demande de devis a été transmise avec succès",
      });

      // Réinitialiser le formulaire
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
        budget_max: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!linkValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide</h1>
            <p className="text-gray-600 mb-4">
              Ce lien n'est pas valide ou a expiré.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-gray-800">Demande de devis</CardTitle>
            <p className="text-gray-600">Entrez le mot de passe pour accéder au formulaire</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
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
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accéder au formulaire
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Demande de devis déménagement</h1>
          <p className="text-gray-600">Remplissez ce formulaire pour recevoir votre devis personnalisé</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Vos informations
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Adresses */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Adresses
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700">Adresse de départ</h4>
                    <Input
                      placeholder="Adresse complète"
                      value={formData.departure_address}
                      onChange={(e) => setFormData({...formData, departure_address: e.target.value})}
                      required
                    />
                    <div className="grid gap-2 grid-cols-2">
                      <Input
                        placeholder="Ville"
                        value={formData.departure_city}
                        onChange={(e) => setFormData({...formData, departure_city: e.target.value})}
                        required
                      />
                      <Input
                        placeholder="Code postal"
                        value={formData.departure_postal_code}
                        onChange={(e) => setFormData({...formData, departure_postal_code: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-700">Adresse d'arrivée</h4>
                    <Input
                      placeholder="Adresse complète"
                      value={formData.arrival_address}
                      onChange={(e) => setFormData({...formData, arrival_address: e.target.value})}
                      required
                    />
                    <div className="grid gap-2 grid-cols-2">
                      <Input
                        placeholder="Ville"
                        value={formData.arrival_city}
                        onChange={(e) => setFormData({...formData, arrival_city: e.target.value})}
                        required
                      />
                      <Input
                        placeholder="Code postal"
                        value={formData.arrival_postal_code}
                        onChange={(e) => setFormData({...formData, arrival_postal_code: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du déménagement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Détails du déménagement
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="desired_date">Date souhaitée *</Label>
                    <Input
                      id="desired_date"
                      type="date"
                      value={formData.desired_date}
                      onChange={(e) => setFormData({...formData, desired_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
                    <Input
                      id="estimated_volume"
                      type="number"
                      step="0.1"
                      value={formData.estimated_volume}
                      onChange={(e) => setFormData({...formData, estimated_volume: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_max">Budget maximum (€)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({...formData, budget_max: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Informations complémentaires</Label>
                  <Textarea
                    id="description"
                    placeholder="Étage, ascenseur, objets fragiles, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {submitting ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicClientForm;
