
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Users, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tables } from '@/integrations/supabase/types';

type PricingOpportunity = Tables<'pricing_opportunities'>;

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: PricingOpportunity | null;
  onSuccess?: () => void;
}

const CreateOpportunityDialog = ({ open, onOpenChange, opportunity = null, onSuccess }: CreateOpportunityDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [creationMode, setCreationMode] = useState<'existing' | 'new' | 'search'>('existing');
  const [selectedClientRequest, setSelectedClientRequest] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimated_volume: '',
    budget_range_min: '',
    budget_range_max: '',
    departure_address: '',
    departure_city: '',
    departure_postal_code: '',
    arrival_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    special_requirements: '',
    priority: '1',
    status: 'draft' as const,
    client_name: '',
    client_email: '',
    client_phone: '',
  });

  // Remplir le formulaire si on édite une opportunité existante
  useEffect(() => {
    if (opportunity && open) {
      setFormData({
        title: opportunity.title || '',
        description: opportunity.description || '',
        estimated_volume: opportunity.estimated_volume?.toString() || '',
        budget_range_min: opportunity.budget_range_min?.toString() || '',
        budget_range_max: opportunity.budget_range_max?.toString() || '',
        departure_address: opportunity.departure_address || '',
        departure_city: opportunity.departure_city || '',
        departure_postal_code: opportunity.departure_postal_code || '',
        arrival_address: opportunity.arrival_address || '',
        arrival_city: opportunity.arrival_city || '',
        arrival_postal_code: opportunity.arrival_postal_code || '',
        special_requirements: opportunity.special_requirements || '',
        priority: opportunity.priority?.toString() || '1',
        status: opportunity.status || 'draft',
        client_name: '',
        client_email: '',
        client_phone: '',
      });
      if (opportunity.desired_date) {
        setSelectedDate(new Date(opportunity.desired_date));
      }
    } else if (!opportunity && open) {
      // Reset pour nouvelle opportunité
      setFormData({
        title: '',
        description: '',
        estimated_volume: '',
        budget_range_min: '',
        budget_range_max: '',
        departure_address: '',
        departure_city: '',
        departure_postal_code: '',
        arrival_address: '',
        arrival_city: '',
        arrival_postal_code: '',
        special_requirements: '',
        priority: '1',
        status: 'draft',
        client_name: '',
        client_email: '',
        client_phone: '',
      });
      setSelectedDate(undefined);
      setSelectedClientRequest('');
      setSelectedClient('');
      setClientSearchTerm('');
    }
  }, [opportunity, open]);

  // Récupérer les demandes clients existantes
  const { data: clientRequests } = useQuery({
    queryKey: ['client-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Récupérer les clients pour la recherche
  const { data: clients } = useQuery({
    queryKey: ['clients-search', clientSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*');
      
      if (clientSearchTerm) {
        query = query.or(`name.ilike.%${clientSearchTerm}%,email.ilike.%${clientSearchTerm}%`);
      }
      
      query = query.order('name', { ascending: true }).limit(20);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open && creationMode === 'search',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientRequestSelect = (requestId: string) => {
    const selected = clientRequests?.find(req => req.id.toString() === requestId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        title: `Déménagement ${selected.departure_city} → ${selected.arrival_city}`,
        description: selected.description || '',
        estimated_volume: selected.estimated_volume?.toString() || '',
        budget_range_min: selected.budget_min?.toString() || '',
        budget_range_max: selected.budget_max?.toString() || '',
        departure_address: selected.departure_address || '',
        departure_city: selected.departure_city,
        departure_postal_code: selected.departure_postal_code,
        arrival_address: selected.arrival_address || '',
        arrival_city: selected.arrival_city,
        arrival_postal_code: selected.arrival_postal_code,
        special_requirements: selected.special_requirements || '',
        client_name: (selected.clients as any)?.name || selected.name || '',
        client_email: (selected.clients as any)?.email || selected.email || '',
        client_phone: (selected.clients as any)?.phone || selected.phone || '',
      }));
      setSelectedDate(new Date(selected.desired_date));
      setSelectedClientRequest(requestId);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selected = clients?.find(client => client.id.toString() === clientId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        client_name: selected.name,
        client_email: selected.email,
        client_phone: selected.phone,
      }));
      setSelectedClient(clientId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

    setIsLoading(true);
    try {
      const opportunityData = {
        ...formData,
        estimated_volume: parseFloat(formData.estimated_volume),
        budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
        budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
        priority: parseInt(formData.priority),
        desired_date: format(selectedDate, 'yyyy-MM-dd'),
        created_by: user.id,
        client_request_id: selectedClientRequest ? parseInt(selectedClientRequest) : null,
      };

      if (opportunity) {
        // Mise à jour d'une opportunité existante
        const { error } = await supabase
          .from('pricing_opportunities')
          .update(opportunityData)
          .eq('id', opportunity.id);

        if (error) throw error;

        toast({
          title: "Opportunité mise à jour",
          description: "L'opportunité a été mise à jour avec succès.",
        });
      } else {
        // Création d'une nouvelle opportunité
        const { error } = await supabase
          .from('pricing_opportunities')
          .insert(opportunityData);

        if (error) throw error;

        toast({
          title: "Opportunité créée",
          description: "L'opportunité de devis a été créée avec succès.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['pricing-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
      
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving opportunity:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'opportunité.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {opportunity ? 'Modifier l\'opportunité' : 'Créer une nouvelle opportunité'}
          </DialogTitle>
          <DialogDescription>
            {opportunity 
              ? 'Modifiez les informations de cette opportunité.'
              : 'Créez une opportunité depuis une demande client existante ou manuellement.'
            }
          </DialogDescription>
        </DialogHeader>

        {!opportunity && (
          <Tabs value={creationMode} onValueChange={(value) => setCreationMode(value as 'existing' | 'new' | 'search')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Demande existante
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Chercher client
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau client
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              <div>
                <Label htmlFor="client_request">Sélectionner une demande client *</Label>
                <Select value={selectedClientRequest} onValueChange={handleClientRequestSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une demande client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientRequests?.map((request) => (
                      <SelectItem key={request.id} value={request.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {(request.clients as any)?.name || request.name} - {request.departure_city} → {request.arrival_city}
                          </span>
                          <span className="text-sm text-gray-500">
                            {request.estimated_volume}m³ - {format(new Date(request.desired_date), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div>
                <Label htmlFor="client_search">Rechercher un client existant *</Label>
                <div className="space-y-2">
                  <Input
                    id="client_search"
                    placeholder="Tapez le nom ou email du client..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                  />
                  {clientSearchTerm && clients && clients.length > 0 && (
                    <Select value={selectedClient} onValueChange={handleClientSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{client.name}</span>
                              <span className="text-sm text-gray-500">{client.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Nom du client *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    placeholder="Jean Dupont"
                    required={creationMode === 'new'}
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">Email du client *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    placeholder="jean.dupont@email.com"
                    required={creationMode === 'new'}
                  />
                </div>
                <div>
                  <Label htmlFor="client_phone">Téléphone du client</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Informations client affichées */}
        {(formData.client_name || selectedClientRequest || selectedClient) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informations client</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Nom:</span> {formData.client_name}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Email:</span> {formData.client_email}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Téléphone:</span> {formData.client_phone}
              </div>
              {formData.estimated_volume && (
                <div>
                  <span className="text-blue-600 font-medium">Volume:</span> {formData.estimated_volume}m³
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'opportunité *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="ex: Déménagement 3 pièces Paris → Lyon"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
                <Input
                  id="estimated_volume"
                  type="number"
                  step="0.1"
                  value={formData.estimated_volume}
                  onChange={(e) => handleInputChange('estimated_volume', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Normale</SelectItem>
                    <SelectItem value="2">2 - Élevée</SelectItem>
                    <SelectItem value="3">3 - Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Budget</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">Budget minimum (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_range_min}
                  onChange={(e) => handleInputChange('budget_range_min', e.target.value)}
                  placeholder="800"
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Budget maximum (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_range_max}
                  onChange={(e) => handleInputChange('budget_range_max', e.target.value)}
                  placeholder="1200"
                />
              </div>
            </div>
          </div>

          {/* Departure Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adresse de départ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="departure_address">Adresse</Label>
                <Input
                  id="departure_address"
                  value={formData.departure_address}
                  onChange={(e) => handleInputChange('departure_address', e.target.value)}
                  placeholder="123 Rue de la Paix"
                />
              </div>
              <div>
                <Label htmlFor="departure_city">Ville *</Label>
                <Input
                  id="departure_city"
                  value={formData.departure_city}
                  onChange={(e) => handleInputChange('departure_city', e.target.value)}
                  placeholder="Paris"
                  required
                />
              </div>
              <div>
                <Label htmlFor="departure_postal_code">Code postal *</Label>
                <Input
                  id="departure_postal_code"
                  value={formData.departure_postal_code}
                  onChange={(e) => handleInputChange('departure_postal_code', e.target.value)}
                  placeholder="75001"
                  required
                />
              </div>
            </div>
          </div>

          {/* Arrival Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adresse d'arrivée</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="arrival_address">Adresse</Label>
                <Input
                  id="arrival_address"
                  value={formData.arrival_address}
                  onChange={(e) => handleInputChange('arrival_address', e.target.value)}
                  placeholder="45 Rue de la République"
                />
              </div>
              <div>
                <Label htmlFor="arrival_city">Ville *</Label>
                <Input
                  id="arrival_city"
                  value={formData.arrival_city}
                  onChange={(e) => handleInputChange('arrival_city', e.target.value)}
                  placeholder="Lyon"
                  required
                />
              </div>
              <div>
                <Label htmlFor="arrival_postal_code">Code postal *</Label>
                <Input
                  id="arrival_postal_code"
                  value={formData.arrival_postal_code}
                  onChange={(e) => handleInputChange('arrival_postal_code', e.target.value)}
                  placeholder="69002"
                  required
                />
              </div>
            </div>
          </div>

          {/* Date and Requirements */}
          <div className="space-y-4">
            <div>
              <Label>Date souhaitée *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${!selectedDate && 'text-muted-foreground'}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="special_requirements">Exigences spéciales</Label>
              <Textarea
                id="special_requirements"
                value={formData.special_requirements}
                onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                placeholder="Ascenseur, piano, objets fragiles..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {opportunity ? 'Mettre à jour' : 'Créer l\'opportunité'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOpportunityDialog;
