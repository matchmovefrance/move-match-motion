import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PublicLink {
  id: string;
  link_token: string;
  password: string;
  expires_at: string;
  created_at: string;
}

const PublicLinkManager = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('public_links')
        .select('*')
        .is('mover_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour générer un token directement côté client
  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Fonction pour générer un mot de passe directement côté client
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createLink = async () => {
    if (!user) return;

    try {
      const linkToken = generateToken();
      const password = generatePassword();

      console.log('Generating link with token:', linkToken, 'and password:', password);

      const { error } = await supabase
        .from('public_links')
        .insert({
          link_token: linkToken,
          password: password,
          mover_id: null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Lien public créé avec succès",
      });

      fetchLinks();
    } catch (error: any) {
      console.error('Error creating link:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien",
        variant: "destructive",
      });
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lien ?')) return;

    try {
      const { error } = await supabase
        .from('public_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Lien supprimé avec succès",
      });

      fetchLinks();
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le lien",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Lien copié dans le presse-papier",
    });
  };

  const togglePasswordVisibility = (linkId: string) => {
    setShowPasswords(prev => ({ ...prev, [linkId]: !prev[linkId] }));
  };

  const getPublicUrl = (token: string) => {
    return `${window.location.origin}/public-mover/${token}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Liens publics - Saisie de trajets</h2>
            <p className="text-gray-600">Créez des liens pour que les déménageurs saisissent leurs trajets</p>
          </div>
        </div>
        <Button
          onClick={createLink}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un lien
        </Button>
      </div>

      <div className="grid gap-4">
        {links.map((link) => {
          const publicUrl = getPublicUrl(link.link_token);
          
          return (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Lien de saisie de trajet
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Lien: </span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                        {publicUrl}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(publicUrl)}
                        className="ml-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Mot de passe: </span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {showPasswords[link.id] ? link.password : '••••••••'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePasswordVisibility(link.id)}
                      >
                        {showPasswords[link.id] ? 
                          <EyeOff className="h-3 w-3" /> : 
                          <Eye className="h-3 w-3" />
                        }
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.password)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div>
                      <span className="font-medium">Expire le: </span>
                      {new Date(link.expires_at).toLocaleDateString('fr-FR')}
                    </div>
                    
                    <div>
                      <span className="font-medium">Créé le: </span>
                      {new Date(link.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteLink(link.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
        
        {links.length === 0 && (
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun lien public créé</p>
            <p className="text-gray-400 text-sm mt-2">
              Créez un lien pour permettre aux déménageurs de saisir leurs trajets
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicLinkManager;
