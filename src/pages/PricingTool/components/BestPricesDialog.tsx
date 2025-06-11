import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, TrendingDown, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import PriceComparisonTable from './PriceComparisonTable';
import { validationService } from '@/services/validationService';
import { useAuth } from '@/contexts/AuthContext';

interface BestPricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: any;
}

const BestPricesDialog = ({ open, onOpenChange, opportunity }: BestPricesDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matchMoveMargin, setMatchMoveMargin] = useState(40); // 40% par défaut

  // Charger les prestataires depuis les trajets confirmés
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-for-pricing'],
    queryFn: async () => {
      console.log('🏢 Chargement des prestataires pour tarification...');
      
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('mover_id, mover_name, company_name, contact_email, contact_phone')
        .not('mover_id', 'is', null);
      
      if (error) {
        console.error('Erreur chargement prestataires:', error);
        return [];
      }
      
      // Créer des prestataires uniques avec modèles de tarification par défaut
      const uniqueSuppliersMap = new Map();
      
      data?.forEach((move) => {
        const key = `${move.mover_name}-${move.company_name}`;
        if (!uniqueSuppliersMap.has(key)) {
          uniqueSuppliersMap.set(key, {
            id: `move-supplier-${move.mover_id}`,
            mover_name: move.mover_name,
            company_name: move.company_name,
            contact_email: move.contact_email,
            contact_phone: move.contact_phone,
            is_active: true,
            priority_level: 1 + Math.floor(Math.random() * 3), // 1-3 pour variété
            pricing_model: {
              basePrice: 120 + Math.random() * 80, // 120-200€
              volumeRate: 8 + Math.random() * 6, // 8-14€/m³
              distanceRate: 0.8 + Math.random() * 0.4, // 0.8-1.2€/km
              distanceRateHighVolume: 1.8 + Math.random() * 0.6, // 1.8-2.4€/km
              floorRate: 40 + Math.random() * 20, // 40-60€/étage
              packingRate: 4 + Math.random() * 3, // 4-7€/carton
              unpackingRate: 4 + Math.random() * 3,
              dismantleRate: 15 + Math.random() * 10, // 15-25€/meuble
              reassembleRate: 15 + Math.random() * 10,
              carryingDistanceFee: 80 + Math.random() * 40, // 80-120€
              carryingDistanceThreshold: 8 + Math.random() * 4, // 8-12m
              heavyItemsFee: 150 + Math.random() * 100, // 150-250€
              volumeSupplementThreshold1: 18 + Math.random() * 4, // 18-22m³
              volumeSupplementFee1: 120 + Math.random() * 60, // 120-180€
              volumeSupplementThreshold2: 26 + Math.random() * 6, // 26-32m³
              volumeSupplementFee2: 140 + Math.random() * 80, // 140-220€
              furnitureLiftFee: 400 + Math.random() * 200, // 400-600€
              furnitureLiftThreshold: 3 + Math.random() * 2, // 3-5 étages
              parkingFeeEnabled: Math.random() > 0.7,
              parkingFeeAmount: Math.random() > 0.7 ? 50 + Math.random() * 50 : 0,
              timeMultiplier: 0.9 + Math.random() * 0.3, // 0.9-1.2
              minimumPrice: 180 + Math.random() * 40, // 180-220€
              matchMoveMargin: matchMoveMargin, // Utiliser la marge définie
            }
          });
        }
      });
      
      const uniqueSuppliers = Array.from(uniqueSuppliersMap.values());
      console.log('✅ Prestataires pour tarification chargés:', uniqueSuppliers.length);
      return uniqueSuppliers;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: open && !!user,
  });

  const calculatePriceForSupplier = (supplier: any, opportunity: any) => {
    const pricingModel = supplier.pricing_model || {};
    
    // Simulation des données de devis basées sur l'opportunité
    const estimatedDistance = Math.floor(Math.random() * 50) + 10; // 10-60 km
    const estimatedFloors = Math.floor(Math.random() * 3) + 1; // 1-3 étages
    const packingBoxes = Math.floor(opportunity.estimated_volume * 2); // 2 cartons par m³
    const heavyItems = Math.random() > 0.7; // 30% chance d'objets lourds
    const carryingDistance = Math.floor(Math.random() * 20) + 5; // 5-25m
    
    let supplierPrice = pricingModel.basePrice || 150;
    
    // Volume
    supplierPrice += opportunity.estimated_volume * (pricingModel.volumeRate || 10);
    
    // Distance avec condition volume
    const distanceRate = opportunity.estimated_volume > 20 ? (pricingModel.distanceRateHighVolume || 2) : (pricingModel.distanceRate || 1);
    supplierPrice += estimatedDistance * distanceRate;
    
    // Étages
    supplierPrice += estimatedFloors * (pricingModel.floorRate || 50);
    
    // Emballage
    supplierPrice += packingBoxes * (pricingModel.packingRate || 5);
    
    // Démontage/Remontage (estimation)
    const furnitureItems = Math.floor(opportunity.estimated_volume / 5);
    supplierPrice += furnitureItems * (pricingModel.dismantleRate || 20);
    supplierPrice += furnitureItems * (pricingModel.reassembleRate || 20);
    
    // Distance de portage
    if (carryingDistance > (pricingModel.carryingDistanceThreshold || 10)) {
      supplierPrice += pricingModel.carryingDistanceFee || 100;
    }
    
    // Objets lourds
    if (heavyItems) {
      supplierPrice += pricingModel.heavyItemsFee || 200;
    }
    
    // Suppléments volume
    if (opportunity.estimated_volume > (pricingModel.volumeSupplementThreshold1 || 20)) {
      supplierPrice += pricingModel.volumeSupplementFee1 || 150;
    }
    if (opportunity.estimated_volume > (pricingModel.volumeSupplementThreshold2 || 29)) {
      supplierPrice += pricingModel.volumeSupplementFee2 || 160;
    }
    
    // Stationnement
    if (pricingModel.parkingFeeEnabled) {
      supplierPrice += pricingModel.parkingFeeAmount || 0;
    }
    
    // Multiplicateur de temps avec variation par prestataire
    supplierPrice *= (pricingModel.timeMultiplier || 1);
    
    // Prix minimum
    supplierPrice = Math.max(supplierPrice, pricingModel.minimumPrice || 200);
    
    // Ajouter la marge MatchMove configurée
    const currentMargin = pricingModel.matchMoveMargin || matchMoveMargin;
    const matchMoveMarginAmount = (supplierPrice * currentMargin) / 100;
    const totalWithMargin = supplierPrice + matchMoveMarginAmount;
    
    return {
      supplierPrice: Math.round(supplierPrice),
      matchMoveMargin: Math.round(matchMoveMarginAmount),
      total: Math.round(totalWithMargin),
      details: {
        estimatedDistance,
        estimatedFloors,
        packingBoxes,
        heavyItems,
        carryingDistance,
        furnitureItems,
        config: pricingModel,
        marginPercentage: currentMargin
      }
    };
  };

  const performPriceSearch = async () => {
    if (!opportunity || !suppliers?.length) {
      toast({
        title: "Erreur",
        description: "Aucun prestataire disponible ou opportunité invalide",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('🔍 DÉBUT recherche prix pour:', opportunity.title);
      console.log(`📊 Marge MatchMove: ${matchMoveMargin}%`);

      // Générer des devis pour chaque prestataire avec leur marge configurée
      const quotes = suppliers.map((supplier) => {
        // Mettre à jour la marge dans le modèle du prestataire
        if (supplier.pricing_model) {
          supplier.pricing_model.matchMoveMargin = matchMoveMargin;
        }
        
        const pricing = calculatePriceForSupplier(supplier, opportunity);
        
        return {
          id: `quote-${supplier.id}`,
          supplier: {
            id: supplier.id,
            company_name: supplier.company_name,
            contact_name: supplier.mover_name,
            email: supplier.contact_email || '',
            phone: supplier.contact_phone || '',
            city: 'Non spécifié',
            country: 'France',
            is_active: supplier.is_active,
            priority_level: supplier.priority_level
          },
          supplier_price: pricing.supplierPrice,
          matchmove_margin: pricing.matchMoveMargin,
          price: pricing.total,
          estimated_duration: ['1-2 jours', '2-3 jours', '3-4 jours'][Math.floor(Math.random() * 3)],
          includes_packing: true,
          includes_insurance: Math.random() > 0.3,
          includes_storage: Math.random() > 0.4,
          rating: 3.5 + Math.random() * 1.5,
          response_time: ['2h', '4h', '6h', '24h'][Math.floor(Math.random() * 4)],
          client_name: 'Client Principal',
          status: 'pending',
          notes: `Devis calculé avec marge MatchMove ${pricing.details.marginPercentage}%`,
          pricing_details: pricing.details
        };
      });

      // Trier par prix et prendre les 5 meilleurs
      const sortedQuotes = quotes.sort((a, b) => a.price - b.price);
      const bestQuotes = sortedQuotes.slice(0, 5);

      console.log('📋 Devis générés:', quotes.length);
      console.log('🏆 5 meilleurs prix:', bestQuotes.map(q => q.price));

      const results = {
        total_quotes: quotes.length,
        best_price: bestQuotes.length > 0 ? bestQuotes[0].price : 0,
        validation_status: 'success',
        quotes: bestQuotes,
        margin_percentage: matchMoveMargin
      };

      setSearchResults(results);
      
      toast({
        title: "Recherche terminée",
        description: `${bestQuotes.length} meilleurs devis trouvés avec marge ${matchMoveMargin}%`,
      });

    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les prix",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAcceptQuote = async (quote: any) => {
    try {
      console.log('✅ Acceptation devis:', quote.id);
      
      setSearchResults(prev => ({
        ...prev,
        quotes: prev.quotes.map(q => 
          q.id === quote.id 
            ? { ...q, status: 'accepted' }
            : q
        )
      }));

      toast({
        title: "Devis accepté",
        description: `Le devis de ${quote.supplier.company_name} a été accepté`,
      });
    } catch (error) {
      console.error('❌ Erreur acceptation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter le devis",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuote = async (quote: any) => {
    try {
      console.log('❌ Rejet devis:', quote.id);
      
      setSearchResults(prev => ({
        ...prev,
        quotes: prev.quotes.filter(q => q.id !== quote.id),
        total_quotes: prev.total_quotes - 1
      }));

      toast({
        title: "Devis refusé",
        description: `Le devis de ${quote.supplier.company_name} a été refusé`,
      });
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser le devis",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = (quote: any) => {
    console.log('📄 Export PDF pour:', quote.id);
    toast({
      title: "PDF en cours de génération",
      description: `Téléchargement du devis de ${quote.supplier.company_name}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-blue-600" />
            Recherche des meilleurs prix - Pricing Tool
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Comparaison automatique des tarifs pour: {opportunity?.title || 'Opportunité non sélectionnée'}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {!searchResults && !isSearching && (
            <div className="space-y-6">
              {/* Configuration de la marge MatchMove */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Configuration MatchMove</h3>
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="margin" className="text-sm font-medium">
                    Marge MatchMove (%):
                  </Label>
                  <Input
                    id="margin"
                    type="number"
                    value={matchMoveMargin}
                    onChange={(e) => setMatchMoveMargin(Number(e.target.value))}
                    className="w-24"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-muted-foreground">
                    Cette marge sera ajoutée au prix prestataire
                  </span>
                </div>
              </div>

              <div className="text-center py-8">
                <div className="mb-4">
                  <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Prêt à rechercher les meilleurs prix</h3>
                  <p className="text-muted-foreground mb-4">
                    {suppliers?.length || 0} prestataires disponibles avec modèles de tarification configurés
                  </p>
                </div>
                
                <Button
                  onClick={performPriceSearch}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!suppliers?.length || !opportunity}
                >
                  {!suppliers?.length ? 'Aucun prestataire disponible' : `LANCER LA RECHERCHE (Marge ${matchMoveMargin}%)`}
                </Button>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Calcul des prix en cours...</h3>
              <p className="text-muted-foreground">Application des modèles de tarification avec marge {matchMoveMargin}%</p>
            </div>
          )}

          {searchResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Meilleurs devis</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{searchResults.quotes.length}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Meilleur prix</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{searchResults.best_price.toLocaleString()}€</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Marge MatchMove</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{searchResults.margin_percentage}%</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">Prestataires</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{suppliers?.length || 0}</p>
                </div>
              </div>

              <PriceComparisonTable 
                opportunity={opportunity}
                quotes={searchResults.quotes}
                onAcceptQuote={handleAcceptQuote}
                onRejectQuote={handleRejectQuote}
                onExportPDF={handleExportPDF}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BestPricesDialog;
