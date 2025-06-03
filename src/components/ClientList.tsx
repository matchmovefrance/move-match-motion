
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Mail, Phone, Edit, Trash2, MapPin, Calendar, Volume2, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListView } from '@/components/ui/list-view';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ClientForm from './ClientForm';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  departure_address: string;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string;
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string;
  desired_date: string;
  flexible_dates: boolean;
  date_range_start: string;
  date_range_end: string;
  estimated_volume: number;
  description: string;
  budget_min: number;
  budget_max: number;
  quote_amount?: number;
  special_requirements: string;
  access_conditions: string;
  inventory_list: string;
  status: string;
  created_at: string;
}

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
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
      // Convert string values to appropriate types
      const processedData = {
        ...formData,
        estimated_volume: parseFloat(formData.estimated_volume) || 0,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        quote_amount: formData.quote_amount ? parseFloat(formData.quote_amount) : null,
        flexible_dates: Boolean(formData.flexible_dates)
      };

      if (editingClient) {
        const { error } = await supabase
          .from('client_requests')
          .update(processedData)
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Client mis à jour avec succès",
        });
      } else {
        const { error } = await supabase
          .from('client_requests')
          .insert({
            ...processedData,
            created_by: user?.id
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Client ajouté avec succès",
        });
      }

      setShowAddForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le client",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('client_requests')
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
      <div className="flex justify-between items-start mb-4">
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
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>{client.departure_postal_code} {client.departure_city} → {client.arrival_postal_code} {client.arrival_city}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>{new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-orange-600" />
              <span>{client.estimated_volume}m³</span>
            </div>
            {client.quote_amount && (
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-green-600" />
                <span>{client.quote_amount}€</span>
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              client.status === 'matched' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {client.status === 'pending' ? 'En attente' : 
               client.status === 'matched' ? 'Matché' : client.status}
            </span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteClient(client.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
            <p className="text-sm text-gray-600">{client.email}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{client.departure_city} → {client.arrival_city}</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{client.estimated_volume}m³</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            client.status === 'matched' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {client.status === 'pending' ? 'En attente' : 
             client.status === 'matched' ? 'Matché' : client.status}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => deleteClient(client.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
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
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
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
            estimated_volume: editingClient.estimated_volume.toString(),
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

      <ListView
        items={clients}
        searchFields={['name', 'email', 'phone', 'departure_city', 'arrival_city']}
        renderCard={renderClientCard}
        renderListItem={renderClientListItem}
        searchPlaceholder="Rechercher par nom, email, téléphone ou ville..."
        emptyStateMessage="Aucun client trouvé"
        emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default ClientList;
