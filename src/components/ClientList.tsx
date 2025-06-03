
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, MapPin, Calendar, Volume2, Edit, Trash2, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import ClientForm from './ClientForm';

interface ClientRequest {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  departure_address: string | null;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string | null;
  departure_time: string | null;
  arrival_address: string | null;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string | null;
  desired_date: string;
  estimated_arrival_date: string | null;
  estimated_arrival_time: string | null;
  estimated_volume: number | null;
  description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  quote_amount: number | null;
  special_requirements: string | null;
  access_conditions: string | null;
  inventory_list: string | null;
  status: string;
  is_matched: boolean | null;
  match_status: string | null;
  created_at: string;
}

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('client_requests')
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

  const handleFormSubmit = async (formData: any) => {
    try {
      // Convertir les valeurs string en nombres appropriés
      const processedData = {
        ...formData,
        estimated_volume: parseFloat(formData.estimated_volume) || 0,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        quote_amount: formData.quote_amount ? parseFloat(formData.quote_amount) : null,
      };

      if (editingClient) {
        const { error } = await supabase
          .from('client_requests')
          .update(processedData)
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Demande client mise à jour avec succès",
        });
      } else {
        const { error } = await supabase
          .from('client_requests')
          .insert({
            ...processedData,
            created_by: user?.id,
            client_id: Math.floor(Math.random() * 1000),
            estimated_volume_backup: parseFloat(formData.estimated_volume) || 0
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Demande client ajoutée avec succès",
        });
      }

      setShowAddForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la demande client",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (id: number) => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande client supprimée avec succès",
      });

      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande client",
        variant: "destructive",
      });
    }
  };

  const renderClientCard = (client: ClientRequest) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">
            {client.name || 'Client non renseigné'}
          </h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>{client.departure_postal_code} {client.departure_city} → {client.arrival_postal_code} {client.arrival_city}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>{new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
              {client.departure_time && <span>à {client.departure_time}</span>}
            </div>
            {client.estimated_volume && (
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-orange-600" />
                <span>Volume: {client.estimated_volume}m³</span>
              </div>
            )}
            {client.budget_max && (
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-green-600" />
                <span>Budget: {client.budget_min || 0}€ - {client.budget_max}€</span>
              </div>
            )}
            {client.email && (
              <div className="text-blue-600">
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="text-blue-600">
                <span>{client.phone}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 flex space-x-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              client.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              client.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {client.status === 'pending' ? 'En attente' : 
               client.status === 'confirmed' ? 'Confirmé' :
               client.status === 'rejected' ? 'Rejeté' : client.status}
            </span>
            {client.is_matched && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                client.match_status === 'accepted' ? 'bg-green-100 text-green-800' :
                client.match_status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                Match: {client.match_status === 'accepted' ? 'Accepté' :
                       client.match_status === 'rejected' ? 'Rejeté' : 'En attente'}
              </span>
            )}
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
                <AlertDialogTitle>Supprimer la demande client</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer la demande de {client.name || 'ce client'} ? 
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

  const renderClientListItem = (client: ClientRequest) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{client.name || 'Client non renseigné'}</h4>
            <p className="text-sm text-gray-600">{client.email}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{client.departure_city} → {client.arrival_city}</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
          </div>
          {client.estimated_volume && (
            <div className="text-sm text-gray-500">
              <span>{client.estimated_volume}m³</span>
            </div>
          )}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            client.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            client.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {client.status === 'pending' ? 'En attente' : 
             client.status === 'confirmed' ? 'Confirmé' :
             client.status === 'rejected' ? 'Rejeté' : client.status}
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
              <AlertDialogTitle>Supprimer la demande client</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la demande de {client.name || 'ce client'} ? 
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

  if (showAddForm || editingClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {editingClient ? 'Modifier la demande client' : 'Nouvelle demande client'}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setEditingClient(null);
            }}
          >
            Retour à la liste
          </Button>
        </div>
        
        <ClientForm
          onSubmit={handleFormSubmit}
          initialData={editingClient ? {
            ...editingClient,
            estimated_volume: editingClient.estimated_volume?.toString() || '',
            budget_min: editingClient.budget_min?.toString() || '',
            budget_max: editingClient.budget_max?.toString() || '',
            quote_amount: editingClient.quote_amount?.toString() || ''
          } : undefined}
          isEditing={!!editingClient}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Demandes clients</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une demande
        </Button>
      </div>

      <ListView
        items={clients}
        searchFields={['name', 'email', 'departure_city', 'arrival_city']}
        renderCard={renderClientCard}
        renderListItem={renderClientListItem}
        searchPlaceholder="Rechercher par nom, email ou ville..."
        emptyStateMessage="Aucune demande client trouvée"
        emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default ClientList;
