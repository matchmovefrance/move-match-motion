
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PublicLink {
  id: string;
  link_token: string;
  password: string;
  mover_id: number;
  expires_at: string;
  created_at: string;
}

interface Mover {
  id: number;
  name: string;
  company_name: string;
}

const PublicLinkManager = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMoverId, setSelectedMoverId] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
    fetchMovers();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('public_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovers = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('id, name, company_name')
        .order('name');

      if (error) throw error;
      setMovers(data || []);
    } catch (error) {
      console.error('Error fetching movers:', error);
    }
  };

  const createLink = async () => {
    if (!selectedMoverId || !user) return;

    try {
      const { data: tokenData } = await supabase.rpc('generate_public_link_token');
      const { data: passwordData } = await supabase.rpc('generate_random_password');

      const { error } = await supabase
        .from('public_links')
        .insert({
          link_token: tokenData,
          password: passwordData,
          mover_id: selectedMoverId,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Lien public créé avec succès",
      });

      setShowCreateForm(false);
      setSelectedMoverId(null);
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
    return `${window.location.origin}/public/${token}`;
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
          <h2 className="text-2xl font-bold text-gray-800">Liens publics déménageurs</h2>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un lien
        </Button>
      </div>

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">Créer un lien public</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un déménageur
              </label>
              <select
                value={selectedMoverId || ''}
                onChange={(e) => setSelectedMoverId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choisir un déménageur</option>
                {movers.map((mover) => (
                  <option key={mover.id} value={mover.id}>
                    {mover.name} - {mover.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={createLink}
                disabled={!selectedMoverId}
              >
                Créer
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {links.map((link) => {
          const mover = movers.find(m => m.id === link.mover_id);
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
                    {mover ? `${mover.name} - ${mover.company_name}` : 'Déménageur inconnu'}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Lien: </span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicLinkManager;
