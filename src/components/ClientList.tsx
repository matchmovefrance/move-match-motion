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
import ClientFilter from './ClientFilter';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  client_reference?: string;
  created_at: string;
  created_by: string;
  departure_city?: string;
  departure_postal_code?: string;
  arrival_city?: string;
  arrival_postal_code?: string;
  desired_date?: string;
  estimated_volume?: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
  is_matched?: boolean;
  match_status?: string;
}

const ClientList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États séparés et protégés pour le dialogue de match
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('📋 Chargement des clients depuis la table unifiée...');
      
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur clients:', error);
        throw error;
      }

      console.log('✅ Clients chargés:', {
        count: clientsData?.length || 0,
        format: 'CLI-XXXXXX'
      });
      
      setClients(clientsData || []);
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

  const handleFilteredData = (filtered: Client[]) => {
    setFilteredClients(filtered);
  };

  const finalFilteredClients = filteredClients.filter(client =>
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
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

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

  const handleFindMatch = async (client: Client, event?: React.MouseEvent) => {
    // Empêcher la propagation et les clics multiples
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Protection contre les clics multiples
    if (isProcessingMatch) {
      console.log('⚠️ Traitement en cours, ignorer le clic');
      return;
    }

    setIsProcessingMatch(true);
    
    try {
      console.log('🎯 Début recherche match pour client:', {
        id: client.id,
        name: client.name,
        reference: client.client_reference,
        departure: client.departure_postal_code,
        arrival: client.arrival_postal_code
      });

      // Validation stricte des données requises
      if (!client.departure_postal_code?.trim() || !client.arrival_postal_code?.trim()) {
        toast({
          title: "Données incomplètes",
          description: "Le client doit avoir des codes postaux de départ et d'arrivée pour rechercher des matchs",
          variant: "destructive",
        });
        return;
      }

      if (!client.departure_city?.trim() || !client.arrival_city?.trim()) {
        toast({
          title: "Données incomplètes", 
          description: "Le client doit avoir des villes de départ et d'arrivée complètes",
          variant: "destructive",
        });
        return;
      }

      // Fermer d'abord tout dialogue ouvert
      if (showMatchesDialog) {
        setShowMatchesDialog(false);
        setSelectedClient(null);
        // Attendre que le dialogue se ferme
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Ouvrir le nouveau dialogue
      setSelectedClient(client);
      setShowMatchesDialog(true);
      
      console.log('✅ Dialogue de match configuré pour:', client.client_reference);
      
    } catch (error) {
      console.error('❌ Erreur ouverture dialogue match:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le dialogue de recherche de match",
        variant: "destructive",
      });
    } finally {
      // Délai pour éviter les clics rapides successifs
      setTimeout(() => {
        setIsProcessingMatch(false);
      }, 1000);
    }
  };

  const handleCloseMatchesDialog = () => {
    console.log('🔒 Fermeture dialogue matches');
    setShowMatchesDialog(false);
    setSelectedClient(null);
    setIsProcessingMatch(false);
  };

  // Fonction pour vérifier si un client peut rechercher des matchs
  const canSearchMatches = (client: Client): boolean => {
    return !!(
      client.departure_postal_code?.trim() && 
      client.arrival_postal_code?.trim() &&
      client.departure_city?.trim() &&
      client.arrival_city?.trim()
    );
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
          <Badge variant="secondary">{finalFilteredClients.length}</Badge>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      <ClientFilter
        data={clients}
        onFilter={handleFilteredData}
        label="Filtrer les clients"
      />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {finalFilteredClients.map((client) => {
            const canSearch = canSearchMatches(client);
            
            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Client
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
                      onClick={(e) => handleFindMatch(client, e)}
                      className="flex-1"
                      disabled={!canSearch || isProcessingMatch}
                      title={!canSearch ? "Données de départ et d'arrivée requises" : "Rechercher des matchs pour ce client"}
                    >
                      <Target className="h-4 w-4 mr-1" />
                      {isProcessingMatch ? 'Recherche...' : 'Trouver un match'}
                    </Button>
                  </div>

                  {!canSearch && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                      ⚠️ Codes postaux et villes requis pour rechercher des matchs
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {finalFilteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
          </p>
        </div>
      )}

      {/* Dialogue de suppression */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteClient}
        title="Supprimer le client"
        description={`Êtes-vous sûr de vouloir supprimer le client ${clientToDelete?.name || clientToDelete?.client_reference} ? Cette action est irréversible.`}
        isDeleting={isDeleting}
      />

      {/* Dialogue de recherche de matchs */}
      <ClientMatchesDialog
        isOpen={showMatchesDialog}
        onClose={handleCloseMatchesDialog}
        client={selectedClient}
      />
    </motion.div>
  );
};

export default ClientList;
