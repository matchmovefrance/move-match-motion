
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, CheckCircle, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pricingEngine } from './PricingEngine';
import { supabase } from '@/integrations/supabase/client';
import QuoteGenerator from '@/components/QuoteGenerator';

interface BestPricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: any;
}

interface GeneratedQuote {
  id: string;
  client_id: number;
  client_name: string;
  client_email: string;
  departure_city: string;
  arrival_city: string;
  estimated_volume: number;
  desired_date: string;
  supplier_id: string;
  supplier_name: string;
  supplier_company: string;
  calculated_price: number;
  supplier_price: number;
  matchmove_margin: number;
  original_quote_amount?: number;
  pricing_breakdown?: any;
  rank: number;
}

const BestPricesDialog = ({ open, onOpenChange, opportunity }: BestPricesDialogProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotes, setQuotes] = useState<GeneratedQuote[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);

  useEffect(() => {
    if (open && opportunity) {
      generateQuotes();
      loadSuppliersData();
    }
  }, [open, opportunity]);

  const loadSuppliersData = async () => {
    try {
      console.log('🔄 Chargement des données des prestataires...');
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*');

      if (error) throw error;
      console.log('✅ Prestataires chargés:', suppliers?.length || 0);
      setSuppliersData(suppliers || []);
    } catch (error) {
      console.error('❌ Erreur chargement prestataires:', error);
    }
  };

  const generateQuotes = async () => {
    if (!opportunity) return;
    
    setIsGenerating(true);
    console.log('🔄 Génération des devis avec moteur de pricing unifié...');
    
    try {
      const clientForPricing = {
        id: opportunity.id,
        name: opportunity.name,
        email: opportunity.email,
        departure_city: opportunity.departure_city,
        departure_postal_code: opportunity.departure_postal_code,
        arrival_city: opportunity.arrival_city,
        arrival_postal_code: opportunity.arrival_postal_code,
        estimated_volume: opportunity.estimated_volume,
        desired_date: opportunity.desired_date,
        quote_amount: opportunity.budget_max || opportunity.quote_amount
      };

      console.log(`🗺️ Calcul distances exactes pour ${clientForPricing.name}: ${clientForPricing.departure_postal_code} -> ${clientForPricing.arrival_postal_code}`);
      
      const generatedQuotes = await pricingEngine.generateQuotesForClient(clientForPricing);
      setQuotes(generatedQuotes);
      
      console.log('✅ Devis générés avec moteur unifié:', generatedQuotes.length);
      
      toast({
        title: "Devis générés",
        description: `${generatedQuotes.length} devis calculés avec les mêmes critères que le moteur principal`,
      });
      
    } catch (error) {
      console.error('❌ Erreur génération devis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les devis",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptQuote = async (quote: GeneratedQuote) => {
    try {
      console.log('✅ Acceptation devis depuis clients tab:', quote.id);
      
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(),
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'accepted',
          notes: `Devis accepté depuis l'onglet clients - Rang #${quote.rank} pour ${quote.client_name}`,
          cost_breakdown: quote.pricing_breakdown,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      
      toast({
        title: "Devis accepté",
        description: `Le devis de ${quote.supplier_company} pour ${quote.client_name} a été accepté`,
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

  const handleRejectQuote = async (quote: GeneratedQuote) => {
    try {
      console.log('❌ Rejet devis depuis clients tab:', quote.id);
      
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      
      toast({
        title: "Devis rejeté",
        description: `Le devis de ${quote.supplier_company} a été rejeté`,
      });
      
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le devis",
        variant: "destructive",
      });
    }
  };

  const getSupplierData = (supplierId: string) => {
    const supplier = suppliersData.find(s => s.id === supplierId);
    console.log('🔍 Recherche prestataire:', supplierId, 'trouvé:', supplier ? 'OUI' : 'NON');
    return supplier;
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">🥇 Meilleur prix</Badge>;
      case 2:
        return <Badge className="bg-blue-100 text-blue-800">🥈 2ème prix</Badge>;
      case 3:
        return <Badge className="bg-orange-100 text-orange-800">🥉 3ème prix</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  const originalAmount = opportunity?.budget_max || opportunity?.quote_amount;
  const bestCalculatedPrice = quotes.length > 0 ? Math.min(...quotes.map(q => q.calculated_price)) : null;
  const priceDifference = originalAmount && bestCalculatedPrice ? originalAmount - bestCalculatedPrice : null;
  const exactDistance = quotes[0]?.pricing_breakdown?.exactDistance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Moteur de devis - {opportunity?.name}
            {exactDistance && (
              <Badge className="bg-blue-100 text-blue-800 ml-2">
                🗺️ {exactDistance}km (Google Maps)
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>{opportunity?.departure_city} → {opportunity?.arrival_city}</span>
              <span className="text-muted-foreground">•</span>
              <span>{opportunity?.estimated_volume}m³</span>
            </div>
            
            {originalAmount && bestCalculatedPrice && (
              <div className="flex items-center gap-3 mt-2">
                <div className="text-sm bg-blue-50 px-3 py-1 rounded-md">
                  <span className="text-muted-foreground">Budget client: </span>
                  <span className="font-semibold text-blue-600">{originalAmount}€</span>
                </div>
                <div className="text-sm bg-green-50 px-3 py-1 rounded-md">
                  <span className="text-muted-foreground">Meilleur prix: </span>
                  <span className="font-semibold text-green-600">{bestCalculatedPrice}€</span>
                </div>
                {priceDifference !== null && (
                  <Badge 
                    variant={Math.abs(priceDifference) > 50 ? "destructive" : "default"}
                    className="flex items-center gap-1"
                  >
                    {priceDifference > 0 ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        -{priceDifference}€ d'économie
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        +{Math.abs(priceDifference)}€ dépassement
                      </>
                    )}
                  </Badge>
                )}
              </div>
            )}
            
            {exactDistance && (
              <div className="text-sm mt-2 text-blue-600">
                🗺️ Distance exacte calculée par Google Maps : {exactDistance}km
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isGenerating ? (
            <Card>
              <CardContent className="text-center py-8">
                <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium mb-2">Calcul des devis avec Google Maps API...</h3>
                <p className="text-muted-foreground">
                  Utilisation des distances exactes et du moteur de pricing unifié.
                </p>
              </CardContent>
            </Card>
          ) : quotes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun devis généré</h3>
                <p className="text-muted-foreground">
                  Impossible de générer des devis pour cette opportunité.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {quotes.map((quote) => {
                const supplierData = getSupplierData(quote.supplier_id);
                
                return (
                  <div key={quote.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getRankBadge(quote.rank)}
                          <h4 className="font-semibold">{quote.supplier_company}</h4>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Prix prestataire:</span>
                              <div className="font-semibold text-blue-600">{quote.supplier_price.toLocaleString()}€</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Marge MatchMove:</span>
                              <div className="font-semibold text-orange-600">+{quote.matchmove_margin.toLocaleString()}€</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prix final:</span>
                              <div className="font-bold text-green-600">{quote.calculated_price.toLocaleString()}€</div>
                            </div>
                          </div>
                          {quote.pricing_breakdown && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Marge: {quote.pricing_breakdown.marginPercentage?.toFixed(1)}% • 
                              Distance Google Maps: {quote.pricing_breakdown.exactDistance}km • 
                              Étages: {quote.pricing_breakdown.estimatedFloors} • 
                              Volume: {quote.pricing_breakdown.estimatedVolume}m³
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <QuoteGenerator
                          client={{
                            id: quote.client_id,
                            name: quote.client_name,
                            email: quote.client_email,
                            phone: null,
                            departure_address: null,
                            departure_city: quote.departure_city,
                            departure_postal_code: opportunity?.departure_postal_code || '',
                            departure_country: null,
                            arrival_address: null,
                            arrival_city: quote.arrival_city,
                            arrival_postal_code: opportunity?.arrival_postal_code || '',
                            arrival_country: null,
                            desired_date: quote.desired_date,
                            estimated_volume: quote.estimated_volume,
                            quote_amount: quote.calculated_price,
                          }}
                          supplier={supplierData ? {
                            company_name: supplierData.company_name,
                            contact_name: supplierData.contact_name,
                            email: supplierData.email,
                            phone: supplierData.phone,
                            bank_details: supplierData.bank_details
                          } : undefined}
                          supplierPrice={quote.supplier_price}
                          matchMoveMargin={quote.pricing_breakdown?.marginPercentage || 0}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectQuote(quote)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAcceptQuote(quote)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accepter
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BestPricesDialog;
