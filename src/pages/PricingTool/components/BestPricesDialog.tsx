
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, Mail, Star, Clock, MapPin, Euro } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import QuoteGenerator from '@/components/QuoteGenerator';
import EmailQuoteButton from '@/components/EmailQuoteButton';

type Supplier = Tables<'suppliers'>;
type PricingOpportunity = Tables<'pricing_opportunities'>;

interface BestPriceOffer {
  supplier: Supplier;
  calculatedPrice: number;
  distance: number;
  responseTime: number;
  rating: number;
  savings: number;
  isRecommended: boolean;
}

interface BestPricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: PricingOpportunity;
  suppliers: Supplier[];
}

const BestPricesDialog = ({ open, onOpenChange, opportunity, suppliers }: BestPricesDialogProps) => {
  const [selectedOffer, setSelectedOffer] = useState<BestPriceOffer | null>(null);

  // Simulation du calcul des meilleurs prix
  const calculateBestOffers = (): BestPriceOffer[] => {
    const offers: BestPriceOffer[] = suppliers.map((supplier, index) => {
      const basePrice = (supplier.pricing_model as any)?.basePrice || 500;
      const distanceRate = (supplier.pricing_model as any)?.distanceRate || 1.5;
      const volumeRate = (supplier.pricing_model as any)?.volumeRate || 50;
      
      // Simulation de distance (en réalité, on utiliserait l'API Google Maps)
      const distance = Math.random() * 100;
      const calculatedPrice = basePrice + (distance * distanceRate) + (opportunity.estimated_volume * volumeRate);
      
      return {
        supplier,
        calculatedPrice: Math.round(calculatedPrice),
        distance: Math.round(distance),
        responseTime: Math.round(Math.random() * 24),
        rating: 3.5 + Math.random() * 1.5,
        savings: 0,
        isRecommended: false
      };
    });

    // Trier par prix
    offers.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
    
    // Calculer les économies par rapport au plus cher
    const maxPrice = Math.max(...offers.map(o => o.calculatedPrice));
    offers.forEach(offer => {
      offer.savings = maxPrice - offer.calculatedPrice;
    });

    // Marquer le meilleur comme recommandé
    if (offers.length > 0) {
      offers[0].isRecommended = true;
    }

    return offers.slice(0, 4); // Top 4 offres
  };

  const bestOffers = calculateBestOffers();

  const handleSelectOffer = (offer: BestPriceOffer) => {
    setSelectedOffer(offer);
  };

  const mockClientRequest = {
    id: 1,
    name: 'Client Test',
    email: 'client@test.com',
    phone: '+33 1 23 45 67 89',
    departure_address: opportunity.departure_address,
    departure_city: opportunity.departure_city,
    departure_postal_code: opportunity.departure_postal_code,
    departure_country: opportunity.departure_country,
    arrival_address: opportunity.arrival_address,
    arrival_city: opportunity.arrival_city,
    arrival_postal_code: opportunity.arrival_postal_code,
    arrival_country: opportunity.arrival_country,
    desired_date: opportunity.desired_date,
    estimated_volume: opportunity.estimated_volume,
    quote_amount: selectedOffer?.calculatedPrice || bestOffers[0]?.calculatedPrice || 0
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Meilleures offres pour "{opportunity.title}"
          </DialogTitle>
          <DialogDescription>
            Comparaison des 4 meilleures offres de nos partenaires
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {bestOffers.map((offer, index) => (
            <Card 
              key={offer.supplier.id} 
              className={`relative cursor-pointer transition-all ${
                selectedOffer?.supplier.id === offer.supplier.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleSelectOffer(offer)}
            >
              {offer.isRecommended && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  RECOMMANDÉ
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{offer.supplier.company_name}</CardTitle>
                    <p className="text-sm text-gray-600">{offer.supplier.contact_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
                      <Euro className="h-5 w-5" />
                      {offer.calculatedPrice.toLocaleString()}
                    </div>
                    {offer.savings > 0 && (
                      <p className="text-xs text-green-600">
                        Économie de {offer.savings.toLocaleString()}€
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <MapPin className="h-3 w-3 mx-auto mb-1" />
                    <div className="font-medium">{offer.distance}km</div>
                    <div className="text-gray-500">Distance</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Clock className="h-3 w-3 mx-auto mb-1" />
                    <div className="font-medium">{offer.responseTime}h</div>
                    <div className="text-gray-500">Réponse</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Star className="h-3 w-3 mx-auto mb-1" />
                    <div className="font-medium">{offer.rating.toFixed(1)}</div>
                    <div className="text-gray-500">Note</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    #{index + 1} meilleur prix
                  </Badge>
                  {offer.supplier.priority_level === 1 && (
                    <Badge variant="outline">Partenaire premium</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedOffer && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Offre sélectionnée : {selectedOffer.supplier.company_name}
              </h3>
              <div className="text-2xl font-bold text-green-600">
                {selectedOffer.calculatedPrice.toLocaleString()}€
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <QuoteGenerator client={mockClientRequest} />
              <EmailQuoteButton client={mockClientRequest} />
              <Button 
                variant="default" 
                className="flex items-center gap-2"
                onClick={() => {
                  // Ici on pourrait confirmer la sélection
                  console.log('Offre confirmée:', selectedOffer);
                }}
              >
                Confirmer cette offre
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BestPricesDialog;
