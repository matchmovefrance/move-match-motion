import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListView } from '@/components/ui/list-view';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un client",
        variant: "destructive",
      });
      return;
    }

    // Validation des champs obligatoires
    if (!newClient.name.trim() || !newClient.email.trim() || !newClient.phone.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding client:', newClient);
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: newClient.name.trim(),
          email: newClient.email.trim().toLowerCase(),
          phone: newClient.phone.trim(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Client added successfully:', data);

      toast({
        title: "Succès",
        description: "Client ajouté avec succès",
      });

      setNewClient({ name: '', email: '', phone: '' });
      setShowAddForm(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error adding client:', error);
      
      let errorMessage = "Impossible d'ajouter le client";
      
      if (error.code === '23505') {
        errorMessage = "Un client avec cette adresse email existe déjà";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateClient = async () => {
    if (!editingClient) return;

    // Validation des champs obligatoires
    if (!editingClient.name.trim() || !editingClient.email.trim() || !editingClient.phone.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingClient.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editingClient.name.trim(),
          email: editingClient.email.trim().toLowerCase(),
          phone: editingClient.phone.trim()
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client mis à jour avec succès",
      });

      setEditingClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error updating client:', error);
      
      let errorMessage = "Impossible de mettre à jour le client";
      
      if (error.code === '23505') {
        errorMessage = "Un client avec cette adresse email existe déjà";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (id: number) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });

      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client",
        variant: "destructive",
      });
    }
  };

  const renderClientCard = (client: Client) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">{client.name}</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span>{client.phone}</span>
            </div>
            <div className="text-xs text-gray-400 mt-3">
              Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingClient(client)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le client {client.name} ? 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteClient(client.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );

  const renderClientListItem = (client: Client) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{client.name}</h4>
          </div>
          <div className="text-sm text-gray-500">
            <span>{client.email}</span> • <span>{client.phone}</span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(client.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditingClient(client)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le client {client.name} ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteClient(client.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

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
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un client
        </Button>
      </div>

      {(showAddForm || editingClient) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingClient ? 'Modifier le client' : 'Nouveau client'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nom"
              value={editingClient ? editingClient.name : newClient.name}
              onChange={(e) => editingClient 
                ? setEditingClient({...editingClient, name: e.target.value})
                : setNewClient({...newClient, name: e.target.value})
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={editingClient ? editingClient.email : newClient.email}
              onChange={(e) => editingClient 
                ? setEditingClient({...editingClient, email: e.target.value})
                : setNewClient({...newClient, email: e.target.value})
              }
            />
            <Input
              placeholder="Téléphone"
              value={editingClient ? editingClient.phone : newClient.phone}
              onChange={(e) => editingClient 
                ? setEditingClient({...editingClient, phone: e.target.value})
                : setNewClient({...newClient, phone: e.target.value})
              }
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={editingClient ? updateClient : addClient}>
              {editingClient ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setEditingClient(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      <ListView
        items={clients}
        searchFields={['name', 'email', 'phone']}
        renderCard={renderClientCard}
        renderListItem={renderClientListItem}
        searchPlaceholder="Rechercher par nom, email ou téléphone..."
        emptyStateMessage="Aucun client trouvé"
        emptyStateIcon={<User className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default ClientList;
