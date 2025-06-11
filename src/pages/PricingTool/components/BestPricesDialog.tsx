
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertCircle, CheckCircle, Clock, Calculator, TrendingUp, Download } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import PriceComparisonTable from './PriceComparisonTable';

type PricingOpportunity = Tables<'pricing_opportunities'>;
type Supplier = Tables<'suppliers'>;

interface Quote {
  id: string;
  supplier: Supplier;
  price: number;
  estimated_duration: string;
  includes_packing: boolean;
  includes_insurance: boolean;
  includes_storage: boolean;
  response_time: string;
  rating: number;
  notes?: string;
}

interface BestPricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: PricingOpportunity | null;
  suppliers: Supplier[];
}

const BestPricesDialog = ({ open, onOpenChange, opportunity, suppliers }: BestPricesDialogProps) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Mock function to simulate price search
  const simulatePriceSearch = async () => {
    if (!opportunity) return;

    setIsSearching(true);
    setSearchComplete(false);
    setQuotes([]);

    // Simulate API calls to suppliers
    const mockQuotes: Quote[] = [];
    
    for (let i = 0; i < Math.min(suppliers.length, 5); i++) {
      const supplier = suppliers[i];
      
      // Simulate delay for each supplier response
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Generate mock quote data
      const basePrice = opportunity.estimated_volume * (80 + Math.random() * 40); // 80-120€ per m³
      const quote: Quote = {
        id: `quote-${supplier.id}-${Date.now()}`,
        supplier,
        price: Math.round(basePrice),
        estimated_duration: `${Math.ceil(opportunity.estimated_volume / 10 + Math.random() * 3)} jour(s)`,
        includes_packing: Math.random() > 0.3,
        includes_insurance: Math.random() > 0.2,
        includes_storage: Math.random() > 0.7,
        response_time: `${Math.floor(Math.random() * 24) + 1}h`,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        notes: Math.random() > 0.5 ? 'Disponible aux dates demandées' : undefined
      };
      
      mockQuotes.push(quote);
      setQuotes([...mockQuotes]);
    }

    setIsSearching(false);
    setSearchComplete(true);
    
    toast({
      title: "Recherche terminée",
      description: `${mockQuotes.length} devis reçus pour ${opportunity.title}`,
    });
  };

  useEffect(() => {
    if (open && opportunity && suppliers.length > 0) {
      simulatePriceSearch();
    }
  }, [open, opportunity, suppliers]);

  const handleExportPDF = () => {
    toast({
      title: "Export en cours",
      description: "Le rapport PDF sera téléchargé dans quelques instants.",
    });
  };

  const handleSendToClient = (quote: Quote) => {
    toast({
      title: "Devis envoyé",
      description: `Le devis de ${quote.supplier.company_name} a été envoyé au client.`,
    });
  };

  const handleClose = () => {
    setQuotes([]);
    setSelectedQuote(null);
    setSearchComplete(false);
    setIsSearching(false);
    onOpenChange(false);
  };

  if (!opportunity) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Recherche des meilleurs prix
          </DialogTitle>
          <DialogDescription>
            Comparaison automatique des tarifs pour: {opportunity.title}
          </DialogDescription>
        </DialogHeader>

        {/* Search Status */}
        {isSearching && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-y-4 flex-col">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="text-lg font-medium">Recherche en cours...</h3>
                  <p className="text-muted-foreground">
                    Consultation de {suppliers.length} fournisseurs actifs
                  </p>
                </div>
                
                {/* Progress indicator */}
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Devis reçus: {quotes.length}</span>
                    <span>Total: {suppliers.length}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(quotes.length / Math.min(suppliers.length, 5)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Live quotes as they come in */}
                {quotes.length > 0 && (
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-2">Derniers devis reçus:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {quotes.slice(-3).map((quote) => (
                        <div key={quote.id} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                          <span className="text-sm">{quote.supplier.company_name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{quote.price.toLocaleString()}€</Badge>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {searchComplete && quotes.length > 0 && (
          <PriceComparisonTable
            opportunity={opportunity}
            quotes={quotes}
            onSelectQuote={setSelectedQuote}
            onExportPDF={handleExportPDF}
            onSendToClient={handleSendToClient}
          />
        )}

        {/* No results */}
        {searchComplete && quotes.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium">Aucun devis reçu</h3>
                  <p className="text-muted-foreground">
                    Aucun fournisseur n'a répondu dans les délais impartis.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => simulatePriceSearch()}>
                    <Search className="h-4 w-4 mr-2" />
                    Relancer la recherche
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Fermer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        {searchComplete && quotes.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {quotes.length} devis comparés • Meilleur prix: {Math.min(...quotes.map(q => q.price)).toLocaleString()}€
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              {selectedQuote && (
                <Button onClick={() => handleSendToClient(selectedQuote)}>
                  Envoyer le devis sélectionné
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BestPricesDialog;
