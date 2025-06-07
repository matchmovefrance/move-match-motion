import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, MapPin, Calendar, Volume2, Edit, Trash2, Euro, Eye, RefreshCw } from 'lucide-react';
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
import QuoteGenerator from './QuoteGenerator';
import ClientDetailsPopup from './ClientDetailsPopup';
import SyncStatusDialog from './SyncStatusDialog';

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
  client_id: number;
}

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRequest | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRequest | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching clients from database...');
      
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching clients:', error);
        throw error;
      }
      
      console.log('✅ Clients fetched from DB:', data?.length || 0);
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateRequiredFields = (formData: any) => {
    const requiredFields = ['name', 'email', 'phone', 'departure_city', 'arrival_city', 'estimated_volume', 'desired_date'];
    return requiredFields.filter(field => !formData[field] || String(formData[field]).trim() === '');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkForDuplicateClient = async (email: string, excludeId?: number) => {
    if (!user) return false;
    
    try {
      let query = supabase
        .from('clients')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('created_by', user.id);
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data } = await query;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const cleanAndProcessFormData = (formData: any) => {
    return {
      name: formData.name?.trim() || null,
      email: formData.email?.trim().toLowerCase() || null,
      phone: formData.phone?.trim() || null,
      departure_address: formData.departure_address?.trim() || null,
      departure_city: formData.departure_city?.trim() || '',
      departure_postal_code: formData.departure_postal_code?.trim() || '',
      departure_country: formData.departure_country?.trim() || 'France',
      departure_time: formData.departure_time || null,
      arrival_address: formData.arrival_address?.trim() || null,
      arrival_city: formData.arrival_city?.trim() || '',
      arrival_postal_code: formData.arrival_postal_code?.trim() || '',
      arrival_country: formData.arrival_country?.trim() || 'France',
      desired_date: formData.desired_date || new Date().toISOString().split('T')[0],
      estimated_arrival_date: formData.estimated_arrival_date || null,
      estimated_arrival_time: formData.estimated_arrival_time || null,
      estimated_volume: formData.estimated_volume ? parseFloat(formData.estimated_volume) : 0,
      description: formData.description?.trim() || null,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      quote_amount: formData.quote_amount ? parseFloat(formData.quote_amount) : null,
      special_requirements: formData.special_requirements?.trim() || null,
      access_conditions: formData.access_conditions?.trim() || null,
      inventory_list: formData.inventory_list?.trim() || null,
      flexible_dates: formData.flexible_dates || false,
      date_range_start: formData.date_range_start || null,
      date_range_end: formData.date_range_end || null,
      status: 'pending',
      is_matched: false,
      match_status: 'pending'
    };
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Form submission started:', { isEditing: !!editingClient, formData });

      // Validation des champs obligatoires
      const missingFields = validateRequiredFields(formData);
      if (missingFields.length > 0) {
        toast({
          title: "Erreur",
          description: `Les champs suivants sont obligatoires : ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Validation email
      if (formData.email && !validateEmail(formData.email)) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer une adresse email valide",
          variant: "destructive",
        });
        return;
      }

      // Vérifier les doublons
      const isDuplicate = await checkForDuplicateClient(
        formData.email, 
        editingClient?.client_id
      );
      
      if (isDuplicate) {
        toast({
          title: "Erreur",
          description: "Un client avec cette adresse email existe déjà",
          variant: "destructive",
        });
        return;
      }

      // Nettoyer les données
      const processedData = cleanAndProcessFormData(formData);
      console.log('🧹 Processed data:', processedData);

      if (editingClient) {
        console.log('✏️ Updating existing client:', editingClient.id);
        
        // Mode édition - Mettre à jour le client et la demande
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            name: processedData.name,
            email: processedData.email,
            phone: processedData.phone,
          })
          .eq('id', editingClient.client_id)
          .eq('created_by', user.id);

        if (clientError) {
          console.error('❌ Client update error:', clientError);
          throw clientError;
        }

        const { error: requestError } = await supabase
          .from('client_requests')
          .update(processedData)
          .eq('id', editingClient.id)
          .eq('created_by', user.id);

        if (requestError) {
          console.error('❌ Client request update error:', requestError);
          throw requestError;
        }

        console.log('✅ Client updated successfully');
        toast({
          title: "Succès",
          description: "Demande client mise à jour avec succès",
        });
      } else {
        console.log('➕ Creating new client');
        
        // Mode création - Créer client puis demande
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: processedData.name,
            email: processedData.email,
            phone: processedData.phone,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (clientError) {
          console.error('❌ Client creation error:', clientError);
          throw clientError;
        }

        const { error: requestError } = await supabase
          .from('client_requests')
          .insert({
            ...processedData,
            created_by: user.id,
            client_id: clientData.id,
            estimated_volume_backup: processedData.estimated_volume
          });

        if (requestError) {
          console.error('❌ Client request creation error:', requestError);
          throw requestError;
        }

        console.log('✅ Client created successfully');
        toast({
          title: "Succès",
          description: "Demande client ajoutée avec succès",
        });
      }

      // Fermer les formulaires et recharger les données
      setShowAddForm(false);
      setEditingClient(null);
      await fetchClients();
      
    } catch (error: any) {
      console.error('❌ Error saving client:', error);
      
      let errorMessage = "Impossible de sauvegarder la demande client";
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
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (requestId: number, clientId: number) => {
    if (!user) return;
    
    try {
      console.log('🗑️ Deleting client:', { requestId, clientId });
      
      // Supprimer d'abord la demande client
      const { error: requestError } = await supabase
        .from('client_requests')
        .delete()
        .eq('id', requestId)
        .eq('created_by', user.id);

      if (requestError) {
        console.error('❌ Error deleting client request:', requestError);
        throw requestError;
      }

      // Supprimer ensuite le client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('created_by', user.id);

      if (clientError) {
        console.error('❌ Error deleting client:', clientError);
        throw clientError;
      }

      console.log('✅ Client deleted successfully');
      
      // Mettre à jour l'état local immédiatement
      setClients(prevClients => prevClients.filter(c => c.id !== requestId));

      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });

    } catch (error: any) {
      console.error('❌ Error deleting client:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le client: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (client: ClientRequest) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleCloseDetails = () => {
    setShowClientDetails(false);
    setSelectedClient(null);
  };

  const handleSyncComplete = () => {
    setShowSyncDialog(false);
    fetchClients();
    toast({
      title: "Succès",
      description: "Synchronisation terminée avec succès",
    });
  };

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
          clientId={editingClient?.id}
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
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncDialog(true)}
            title="Vérifier la synchronisation"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une demande
          </Button>
        </div>
      </div>

      <ListView
        items={clients}
        searchFields={['name', 'email', 'departure_city', 'arrival_city']}
        renderCard={(client: ClientRequest) => (
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
                      <a 
                        href={`mailto:${client.email}`}
                        className="hover:underline"
                        title="Envoyer un email"
                      >
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="text-blue-600">
                      <a 
                        href={`tel:${client.phone}`}
                        className="hover:underline"
                        title="Appeler ce numéro"
                      >
                        {client.phone}
                      </a>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-3">
                    Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </div>
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
                  onClick={() => handleViewDetails(client)}
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <QuoteGenerator client={client} />
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
                        Cette action supprimera définitivement la demande client de la base de données.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteClient(client.id, client.client_id)}
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
        )}
        renderListItem={(client: ClientRequest) => (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium text-gray-800">{client.name || 'Client non renseigné'}</h4>
                  <p className="text-sm text-gray-600">
                    {client.email && (
                      <a 
                        href={`mailto:${client.email}`}
                        className="text-blue-600 hover:underline"
                        title="Envoyer un email"
                      >
                        {client.email}
                      </a>
                    )}
                  </p>
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
                onClick={() => handleViewDetails(client)}
                title="Voir les détails"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <QuoteGenerator client={client} />
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
                      Cette action supprimera définitivement la demande client de la base de données.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteClient(client.id, client.client_id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
        searchPlaceholder="Rechercher par nom, email ou ville..."
        emptyStateMessage="Aucune demande client trouvée"
        emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />

      <ClientDetailsPopup
        client={selectedClient}
        isOpen={showClientDetails}
        onClose={handleCloseDetails}
      />

      <SyncStatusDialog
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        onSyncComplete={handleSyncComplete}
      />
    </div>
  );
};

export default ClientList;
