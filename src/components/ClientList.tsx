
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Target, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SimpleClientFormReplacement from './SimpleClientFormReplacement';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ClientMatchesDialog } from './ClientMatchesDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  client_reference?: string;
  created_at: string;
  created_by: string;
  source?: 'clients' | 'client_requests';
  departure_city?: string;
  departure_postal_code?: string;
  arrival_city?: string;
  arrival_postal_code?: string;
  desired_date?: string;
  estimated_volume?: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
  client_id?: number;
}

const ClientList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('📋 Chargement de TOUS les clients (clients + client_requests)...');
      
      // Charger depuis la table clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('❌ Erreur clients:', clientsError);
      }

      // Charger depuis la table client_requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('❌ Erreur client_requests:', requestsError);
      }

      const allClients: Client[] = [];

      // Ajouter les clients de la table clients avec référence CLI-XXXXXX
      if (clientsData) {
        clientsData.forEach(client => {
          allClients.push({
            id: client.id,
            name: client.name || 'Nom non renseigné',
            email: client.email || 'Email non renseigné',
            phone: client.phone || 'Téléphone non renseigné',
            client_reference: client.client_reference || `CLI-${String(client.id).padStart(6, '0')}`,
            created_at: client.created_at,
            created_by: client.created_by,
            source: 'clients',
            departure_city: client.departure_city,
            departure_postal_code: client.departure_postal_code,
            arrival_city: client.arrival_city,
            arrival_postal_code: client.arrival_postal_code,
            desired_date: client.desired_date,
            estimated_volume: client.estimated_volume,
            flexible_dates: client.flexible_dates,
            flexibility_days: client.flexibility_days,
            status: client.status
          });
        });
      }

      // Ajouter les clients de la table client_requests avec référence CLI-XXXXXX
      if (requestsData) {
        requestsData.forEach(request => {
          allClients.push({
            id: request.id + 100000, // Décaler les IDs pour éviter les conflits
            name: request.name || 'Nom non renseigné',
            email: request.email || 'Email non renseigné',
            phone: request.phone || 'Téléphone non renseigné',
            client_reference: `CLI-${String(request.id + 100000).padStart(6, '0')}`,
            created_at: request.created_at,
            created_by: request.created_by,
            source: 'client_requests',
            departure_city: request.departure_city,
            departure_postal_code: request.departure_postal_code,
            arrival_city: request.arrival_city,
            arrival_postal_code: request.arrival_postal_code,
            desired_date: request.desired_date,
            estimated_volume: request.estimated_volume,
            flexible_dates: request.flexible_dates,
            flexibility_days: request.flexibility_days,
            status: request.status,
            client_id: request.client_id
          });
        });
      }

      console.log('✅ Tous les clients chargés:', {
        clients: clientsData?.length || 0,
        requests: requestsData?.length || 0,
        total: allClients.length
      });
      setClients(allClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Suppression du client:', clientToDelete.id);
      
      const { error } = await supabase
        .from('client_requests')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      if (clientToDelete.client_id) {
        const { error: clientError } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientToDelete.client_id);
        
        if (clientError) {
          console.error('Erreur suppression client:', clientError);
        }
      }

      toast({
        title: "Client supprimé",
        description: `Le client ${clientToDelete.name || clientToDelete.client_reference} a été supprimé`,
      });

      setShowDeleteDialog(false);
      setClientToDelete(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFindMatch = async (client: Client) => {
    setSelectedClient(client);
    setShowMatchesDialog(true);
  };

  if (showAddForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Nouveau Client</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowAddForm(false)}
          >
            Retour à la liste
          </Button>
        </div>
        <SimpleClientFormReplacement 
          onSuccess={() => {
            setShowAddForm(false);
            fetchClients();
          }}
        />
      </motion.div>
    );
  }

  if (editingClient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Modifier Client</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                setClientToDelete(editingClient);
                setShowDeleteDialog(true);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setEditingClient(null)}
            >
              Retour à la liste
            </Button>
          </div>
        </div>
        <SimpleClientFormReplacement 
          initialData={editingClient}
          isEditing={true}
          onSuccess={() => {
            setEditingClient(null);
            fetchClients();
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
          <Badge variant="secondary">{filteredClients.length}</Badge>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par nom, référence, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Demande
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir menu</span>
                          <div className="h-4 w-4">⋮</div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingClient(client)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setClientToDelete(client);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Réf:</strong> {client.client_reference}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Départ:</span>
                    <span className="font-medium">
                      {client.departure_postal_code} {client.departure_city}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Arrivée:</span>
                    <span className="font-medium">
                      {client.arrival_postal_code} {client.arrival_city}
                    </span>
                  </div>
                </div>

                {client.desired_date && (
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date souhaitée:</span>
                      <span className="font-medium">
                        {new Date(client.desired_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}

                {client.estimated_volume && (
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Volume estimé:</span>
                      <span className="font-medium">{client.estimated_volume} m³</span>
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <Badge variant={client.status === 'pending' ? 'secondary' : 'default'}>
                      {client.status === 'pending' ? 'En attente' : client.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingClient(client)}
                    className="flex-1"
                  >
                    Modifier
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleFindMatch(client)}
                    className="flex-1"
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Trouver un match
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
          </p>
        </div>
      )}

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le client"
        description="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
        itemName={clientToDelete?.name || clientToDelete?.client_reference || 'Client'}
        onConfirm={handleDeleteClient}
        isDeleting={isDeleting}
      />

      <ClientMatchesDialog
        open={showMatchesDialog}
        onOpenChange={setShowMatchesDialog}
        clientId={selectedClient?.id || 0}
        clientName={selectedClient?.name || 'Client'}
      />
    </motion.div>
  );
};

export default ClientList;
