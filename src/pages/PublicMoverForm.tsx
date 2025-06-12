
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SimpleMoverFormReplacement from '@/components/SimpleMoverFormReplacement';

const PublicMoverForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);

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
        .eq('link_type', 'mover')
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

  const handleSuccess = () => {
    toast({
      title: "Trajet enregistré",
      description: "Votre trajet a été enregistré avec succès",
    });
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
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Saisie de trajet</h1>
          </div>
          <p className="text-gray-600">Enregistrez votre trajet de déménagement</p>
        </div>

        <SimpleMoverFormReplacement onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default PublicMoverForm;
