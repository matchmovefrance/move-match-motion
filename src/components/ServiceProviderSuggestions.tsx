
import { useState, useEffect } from 'react';
import { Search, Building, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceProvider {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
}

interface ServiceProviderSuggestionsProps {
  onSelectProvider: (provider: ServiceProvider) => void;
  label?: string;
  placeholder?: string;
}

const ServiceProviderSuggestions: React.FC<ServiceProviderSuggestionsProps> = ({
  onSelectProvider,
  label = "Sélectionner un prestataire",
  placeholder = "Rechercher un prestataire..."
}) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProviders(providers);
    } else {
      const filtered = providers.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProviders(filtered);
    }
  }, [searchTerm, providers]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;
      setProviders(data || []);
      setFilteredProviders(data || []);
    } catch (error) {
      console.error('Error fetching service providers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires de services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = (provider: ServiceProvider) => {
    onSelectProvider(provider);
    setSearchTerm(`${provider.company_name} - ${provider.name}`);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  if (providers.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de prestataires
  }

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      
      {isOpen && filteredProviders.length > 0 && (
        <Card className="absolute z-50 w-full max-h-60 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelectProvider(provider)}
              >
                <div className="flex items-start space-x-3">
                  <Building className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {provider.company_name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {provider.name}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{provider.city}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{provider.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{provider.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {isOpen && filteredProviders.length === 0 && searchTerm && (
        <Card className="absolute z-50 w-full shadow-lg">
          <CardContent className="p-3 text-center text-gray-500">
            Aucun prestataire trouvé pour "{searchTerm}"
          </CardContent>
        </Card>
      )}
      
      {/* Overlay pour fermer les suggestions quand on clique ailleurs */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ServiceProviderSuggestions;
