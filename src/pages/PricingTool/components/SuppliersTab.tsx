
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Edit, Link, BarChart3, Phone, Mail, MapPin, Users2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SupplierPricingDialog from './SupplierPricingDialog';
import SupplierLinkDialog from './SupplierLinkDialog';

type Supplier = Tables<'suppliers'>;

const SuppliersTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  
  // States pour les dialogs
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const { data: suppliers, isLoading, refetch } = useQuery({
    queryKey: ['suppliers', searchTerm, activeFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*');

      if (activeFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (activeFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Supplier[];
    },
    refetchInterval: 15000,
  });

  const generateSupplierLink = async (supplier: Supplier) => {
    const linkToken = crypto.randomUUID();
    const password = Math.random().toString(36).substring(2, 10);

    const { data, error } = await supabase
      .from('supplier_links')
      .insert({
        supplier_id: supplier.id,
        link_token: linkToken,
        password: password,
        created_by: user?.id || ''
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating link:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le lien",
        variant: "destructive",
      });
      return;
    }

    const link = `${window.location.origin}/supplier-portal/${data.link_token}`;
    setGeneratedLink(link);
    setGeneratedPassword(password);
    setSelectedSupplier(supplier);
    setShowLinkDialog(true);
  };

  const configurePricingModel = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowPricingDialog(true);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Gestion des fournisseurs
            </CardTitle>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un fournisseur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, contact ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date d'ajout</SelectItem>
                <SelectItem value="company_name">Nom de société</SelectItem>
                <SelectItem value="priority_level">Priorité</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      {suppliers && suppliers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{supplier.company_name}</CardTitle>
                    <CardDescription>{supplier.contact_name}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    {supplier.priority_level && (
                      <Badge variant="outline" className="text-xs">
                        Priorité {supplier.priority_level}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>{supplier.city}, {supplier.postal_code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3 w-3" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                </div>

                {/* Pricing Model */}
                <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                  <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Modèle de prix
                  </h4>
                  <div className="text-xs text-blue-800">
                    {supplier.pricing_model && Object.keys(supplier.pricing_model as object).length > 0 ? (
                      <div>
                        {(supplier.pricing_model as any).basePrice && (
                          <div>Prix de base: {(supplier.pricing_model as any).basePrice}€</div>
                        )}
                        {(supplier.pricing_model as any).distanceRate && (
                          <div>Distance: {(supplier.pricing_model as any).distanceRate}€/km</div>
                        )}
                        {(supplier.pricing_model as any).volumeRate && (
                          <div>Volume: {(supplier.pricing_model as any).volumeRate}€/m³</div>
                        )}
                      </div>
                    ) : (
                      <div className="italic">Aucun modèle de prix défini</div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {supplier.performance_metrics && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Performances
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Temps de réponse:</span>
                        <div className="font-medium">
                          {(supplier.performance_metrics as any)?.avg_response_time || 0}h
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Taux d'acceptation:</span>
                        <div className="font-medium">
                          {(supplier.performance_metrics as any)?.acceptance_rate || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-blue-600 hover:text-blue-700"
                    onClick={() => configurePricingModel(supplier)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Tarifs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateSupplierLink(supplier)}
                    className="flex-1"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Lien
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucun fournisseur trouvé</h3>
              <p className="text-sm">
                {searchTerm || activeFilter !== 'all' 
                  ? 'Aucun fournisseur ne correspond à vos critères.'
                  : 'Commencez par ajouter votre premier fournisseur.'}
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <SupplierPricingDialog
        open={showPricingDialog}
        onOpenChange={setShowPricingDialog}
        supplier={selectedSupplier}
        onUpdate={refetch}
      />

      <SupplierLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        link={generatedLink}
        password={generatedPassword}
        supplierName={selectedSupplier?.company_name || ''}
      />
    </div>
  );
};

export default SuppliersTab;
