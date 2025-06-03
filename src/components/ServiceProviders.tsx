
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Phone, Mail, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ServiceProvider {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  coordinates?: string;
  created_at: string;
}

const ServiceProviders = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newProvider, setNewProvider] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    coordinates: ''
  });
  const { toast } = useToast();

  const providersPerPage = 10;

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    const filtered = providers.filter(provider =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProviders(filtered);
    setCurrentPage(1);
  }, [providers, searchTerm]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProvider = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .insert({
          ...newProvider,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Prestataire ajouté avec succès",
      });

      setNewProvider({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        postal_code: '',
        city: '',
        coordinates: ''
      });
      setShowAddForm(false);
      fetchProviders();
    } catch (error: any) {
      console.error('Error adding provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le prestataire",
        variant: "destructive",
      });
    }
  };

  const updateProvider = async () => {
    if (!editingProvider) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .update(editingProvider)
        .eq('id', editingProvider.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Prestataire mis à jour avec succès",
      });

      setEditingProvider(null);
      fetchProviders();
    } catch (error: any) {
      console.error('Error updating provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prestataire",
        variant: "destructive",
      });
    }
  };

  const deleteProvider = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prestataire ?')) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès",
      });

      fetchProviders();
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le prestataire",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(filteredProviders.length / providersPerPage);
  const startIndex = (currentPage - 1) * providersPerPage;
  const currentProviders = filteredProviders.slice(startIndex, startIndex + providersPerPage);

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
          <MapPin className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Prestataires</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prestataire
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par nom, entreprise, email ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingProvider) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingProvider ? 'Modifier le prestataire' : 'Nouveau prestataire'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nom"
              value={editingProvider ? editingProvider.name : newProvider.name}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, name: e.target.value})
                : setNewProvider({...newProvider, name: e.target.value})
              }
            />
            <Input
              placeholder="Nom de l'entreprise"
              value={editingProvider ? editingProvider.company_name : newProvider.company_name}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, company_name: e.target.value})
                : setNewProvider({...newProvider, company_name: e.target.value})
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={editingProvider ? editingProvider.email : newProvider.email}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, email: e.target.value})
                : setNewProvider({...newProvider, email: e.target.value})
              }
            />
            <Input
              placeholder="Téléphone"
              value={editingProvider ? editingProvider.phone : newProvider.phone}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, phone: e.target.value})
                : setNewProvider({...newProvider, phone: e.target.value})
              }
            />
            <Input
              placeholder="Adresse"
              value={editingProvider ? editingProvider.address : newProvider.address}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, address: e.target.value})
                : setNewProvider({...newProvider, address: e.target.value})
              }
            />
            <Input
              placeholder="Code postal"
              value={editingProvider ? editingProvider.postal_code : newProvider.postal_code}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, postal_code: e.target.value})
                : setNewProvider({...newProvider, postal_code: e.target.value})
              }
            />
            <Input
              placeholder="Ville"
              value={editingProvider ? editingProvider.city : newProvider.city}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, city: e.target.value})
                : setNewProvider({...newProvider, city: e.target.value})
              }
            />
            <Input
              placeholder="Coordonnées GPS (optionnel)"
              value={editingProvider ? editingProvider.coordinates || '' : newProvider.coordinates}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, coordinates: e.target.value})
                : setNewProvider({...newProvider, coordinates: e.target.value})
              }
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={editingProvider ? updateProvider : addProvider}>
              {editingProvider ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setEditingProvider(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des prestataires ({filteredProviders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.company_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{provider.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{provider.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{provider.address}</div>
                      <div className="text-sm text-gray-500">
                        {provider.postal_code} {provider.city}
                      </div>
                      {provider.coordinates && (
                        <div className="text-xs text-blue-600">{provider.coordinates}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProvider(provider)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProvider(provider.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProviders.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun prestataire trouvé</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviders;
