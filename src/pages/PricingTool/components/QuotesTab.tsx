
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Euro, MapPin, Calendar, Package, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PricingResult {
  opportunity_id: string;
  opportunity_title: string;
  route: string;
  volume: number;
  date: string;
  best_price: number;
  supplier_name: string;
  margin: number;
  client_price: number;
}

interface PricingModel {
  basePrice?: number;
  volumeRate?: number;
  distanceRate?: number;
  minimumPrice?: number;
  matchMoveMargin?: number;
}

const QuotesTab = () => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [pricingResults, setPricingResults] = useState<PricingResult[]>([]);

  // Compter les opportunités actives
  const { data: stats } = useQuery({
    queryKey: ['pricing-opportunities-stats'],
    queryFn: async () => {
      const { data: opportunities } = await supabase
        .from('pricing_opportunities')
        .select('id, status')
        .in('status', ['draft', 'active', 'pending']);

      const { data: clientRequests } = await supabase
        .from('client_requests')
        .select('id, status')
        .in('status', ['pending', 'confirmed']);

      return {
        opportunities: opportunities?.length || 0,
        clientRequests: clientRequests?.length || 0,
      };
    },
  });

  const searchBestPrices = async () => {
    setIsSearching(true);
    try {
      console.log('🔍 Recherche des meilleurs prix...');

      // Récupérer les opportunités actives
      const { data: opportunities, error: oppError } = await supabase
        .from('pricing_opportunities')
        .select('*')
        .in('status', ['draft', 'active', 'pending']);

      if (oppError) throw oppError;

      // Récupérer les prestataires avec leurs modèles de tarification
      const { data: suppliers, error: suppError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);

      if (suppError) throw suppError;

      // Filtrer les prestataires demo
      const validSuppliers = suppliers?.filter(supplier => {
        const companyName = supplier.company_name?.toLowerCase() || '';
        const isDemo = companyName.includes('demo') || 
                      companyName.includes('test') || 
                      companyName.includes('exemple') ||
                      companyName.includes('sample');
        return !isDemo;
      }) || [];

      const results: PricingResult[] = [];

      // Pour chaque opportunité, calculer le meilleur prix
      opportunities?.forEach(opportunity => {
        let bestPrice = Infinity;
        let bestSupplier = '';
        let bestMargin = 0;

        validSuppliers.forEach(supplier => {
          if (supplier.pricing_model && typeof supplier.pricing_model === 'object') {
            const model = supplier.pricing_model as PricingModel;
            
            // Calcul simplifié du prix
            const basePrice = model.basePrice || 150;
            const volumePrice = (opportunity.estimated_volume || 0) * (model.volumeRate || 10);
            const distancePrice = 100 * (model.distanceRate || 1); // Distance estimée
            
            const supplierPrice = Math.max(
              basePrice + volumePrice + distancePrice,
              model.minimumPrice || 200
            );

            if (supplierPrice < bestPrice) {
              bestPrice = supplierPrice;
              bestSupplier = supplier.company_name;
              bestMargin = model.matchMoveMargin || 40;
            }
          }
        });

        if (bestPrice !== Infinity) {
          const clientPrice = bestPrice * (1 + bestMargin / 100);
          
          results.push({
            opportunity_id: opportunity.id,
            opportunity_title: opportunity.title,
            route: `${opportunity.departure_city} → ${opportunity.arrival_city}`,
            volume: opportunity.estimated_volume,
            date: opportunity.desired_date,
            best_price: bestPrice,
            supplier_name: bestSupplier,
            margin: bestMargin,
            client_price: clientPrice,
          });
        }
      });

      // Trier par meilleur prix
      results.sort((a, b) => a.client_price - b.client_price);
      
      setPricingResults(results);
      
      toast({
        title: "Recherche terminée",
        description: `${results.length} devis calculés avec les meilleurs prix`,
      });

    } catch (error) {
      console.error('❌ Erreur recherche prix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer les prix",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du moteur de devis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Moteur de recherche des meilleurs prix
          </CardTitle>
          <CardDescription>
            Analysez automatiquement les opportunités et clients en cours pour trouver les meilleurs prix basés sur vos modèles de tarification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.opportunities || 0}</div>
                <div className="text-sm text-muted-foreground">Opportunités actives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.clientRequests || 0}</div>
                <div className="text-sm text-muted-foreground">Demandes clients</div>
              </div>
            </div>
            
            <Button 
              onClick={searchBestPrices}
              disabled={isSearching}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Recherche en cours...' : 'Rechercher les meilleurs prix'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de la recherche */}
      {pricingResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Résultats - Meilleurs prix trouvés
            </CardTitle>
            <CardDescription>
              Prix calculés automatiquement selon vos modèles de tarification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pricingResults.map((result, index) => (
                <div key={result.opportunity_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1} Meilleur prix
                        </Badge>
                        <h3 className="font-semibold">{result.opportunity_title}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span>{result.route}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          <span>{result.volume}m³</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>{new Date(result.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span>{result.supplier_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Prix fournisseur</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {result.best_price.toLocaleString()}€
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Marge: {result.margin}%
                      </div>
                      <div className="text-xl font-bold text-green-600 flex items-center gap-1">
                        <Euro className="h-5 w-5" />
                        {Math.round(result.client_price).toLocaleString()}€
                      </div>
                      <div className="text-xs text-muted-foreground">Prix client final</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun résultat */}
      {!isSearching && pricingResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune recherche effectuée</h3>
            <p className="text-muted-foreground mb-4">
              Cliquez sur "Rechercher les meilleurs prix" pour analyser vos opportunités et trouver les tarifs optimaux.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuotesTab;
