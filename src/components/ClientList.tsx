
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SimpleClientFormReplacement from './SimpleClientFormReplacement';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  client_reference?: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number;
  flexible_dates: boolean;
  flexibility_days?: number;
  status: string;
  created_at: string;
  // Optional properties that might come from the database but not always used
  departure_address?: string;
  arrival_address?: string;
  departure_country?: string;
  arrival_country?: string;
  budget_min?: number;
  budget_max?: number;
  special_requirements?: string;
  access_conditions?: string;
  description?: string;
  departure_time?: string;
  arrival_time?: string;
  estimated_arrival_date?: string;
  estimated_arrival_time?: string;
  status_custom?: string;
  match_status?: string;
  is_matched?: boolean;
  matched_at?: string;
  quote_amount?: number;
  inventory_list?: string;
  estimated_volume_backup?: number;
  date_range_start?: string;
  date_range_end?: string;
  client_id?: number;
  created_by?: string;
}

const ClientList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const generateClientReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `CLI-${timestamp}`;
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Générer des références pour les clients qui n'en ont pas
      const clientsWithReferences = data?.map(client => ({
        ...client,
        client_reference: client.client_reference || `CLI-${String(client.id).padStart(6, '0')}`
      })) || [];
      
      setClients(clientsWithReferences);
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
    client.departure_postal_code?.includes(searchTerm) ||
    client.arrival_postal_code?.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(client.desired_date).toLocaleDateString('fr-FR').includes(searchTerm)
  );

  const handleFindMatch = async (client: Client) => {
    toast({
      title: "Recherche de match",
      description: `Recherche de trajets compatibles pour ${client.name} (${client.client_reference})`,
    });
    // TODO: Implémenter la logique de matching
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'matched': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <Button 
            variant="outline" 
            onClick={() => setEditingClient(null)}
          >
            Retour à la liste
          </Button>
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
            placeholder="Rechercher par nom, référence, email, code postal ou date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Réf:</strong> {client.client_reference}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Trajet:</span>
                    <span className="font-medium">
                      {client.departure_postal_code} → {client.arrival_postal_code}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(client.desired_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {client.flexible_dates && client.flexibility_days && (
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Flexibilité:</span>
                      <span className="font-medium text-blue-600">
                        ±{client.flexibility_days} jours
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium">{client.estimated_volume}m³</span>
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
                    Match
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
    </motion.div>
  );
};

export default ClientList;
