
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SimpleClientFormReplacement from '@/components/SimpleClientFormReplacement';

const PublicClientForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkValid, setLinkValid] = useState(true);

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

  const handleSuccess = () => {
    toast({
      title: "Demande envoyée !",
      description: "Votre demande de devis a été transmise avec succès",
    });
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

        <SimpleClientFormReplacement onSuccess={handleSuccess} isPublicForm={true} />
      </div>
    </div>
  );
};

export default PublicClientForm;
