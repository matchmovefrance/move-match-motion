
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from '@/integrations/supabase/types';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { DownloadIcon, Mail, CheckCircle, FileText, BarChart3, MapPin } from 'lucide-react';
import { loadGoogleMapsScript, calculateDistanceByPostalCode } from '@/lib/google-maps-config';

type PricingOpportunity = Tables<'pricing_opportunities'>;
type Supplier = Tables<'suppliers'>;

interface BestPricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: PricingOpportunity | null;
  suppliers: Supplier[];
}

interface CalculatedOffer {
  supplier: Supplier;
  price: number;
  formula: string;
  distance?: number;
}

const BestPricesDialog = ({ open, onOpenChange, opportunity, suppliers }: BestPricesDialogProps) => {
  const { toast } = useToast();
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);
  const [calculatedOffers, setCalculatedOffers] = useState<CalculatedOffer[]>([]);

  // Charger Google Maps et calculer la distance réelle
  useEffect(() => {
    const calculateRealDistance = async () => {
      if (!opportunity || !open) return;

      setIsLoadingDistance(true);
      try {
        await loadGoogleMapsScript();
        
        const distanceResult = await calculateDistanceByPostalCode(
          opportunity.departure_postal_code,
          opportunity.arrival_postal_code,
          opportunity.departure_city,
          opportunity.arrival_city
        );

        if (distanceResult) {
          setCalculatedDistance(distanceResult.distance);
          console.log(`Distance réelle calculée: ${distanceResult.distance}km entre ${opportunity.departure_postal_code} et ${opportunity.arrival_postal_code}`);
        } else {
          // Fallback sur l'estimation basée sur le volume en cas d'échec
          const fallbackDistance = Math.max(10, (opportunity.estimated_volume || 0) * 2);
          setCalculatedDistance(fallbackDistance);
          console.warn('Utilisation de la distance de fallback:', fallbackDistance);
        }
      } catch (error) {
        console.error('Erreur lors du calcul de distance:', error);
        // Fallback sur l'estimation basée sur le volume
        const fallbackDistance = Math.max(10, (opportunity.estimated_volume || 0) * 2);
        setCalculatedDistance(fallbackDistance);
      } finally {
        setIsLoadingDistance(false);
      }
    };

    calculateRealDistance();
  }, [opportunity, open]);

  // Calculer les offres quand la distance est disponible
  useEffect(() => {
    if (!opportunity || calculatedDistance === null) {
      setCalculatedOffers([]);
      return;
    }

    const offers = suppliers
      .filter(supplier => supplier.is_active && supplier.pricing_model)
      .map(supplier => {
        const pricingModel = supplier.pricing_model as any;
        let price = 0;
        let formula = '';
        
        if (pricingModel) {
          const basePrice = pricingModel.basePrice || 0;
          const volumeRate = pricingModel.volumeRate || 0;
          const volume = opportunity.estimated_volume || 0;
          const distance = calculatedDistance;
          const distanceRate = volume > 20 && pricingModel.distanceRateHighVolume ? 
            pricingModel.distanceRateHighVolume : (pricingModel.distanceRate || 0);
          
          // Calcul de base
          price = basePrice + (volume * volumeRate) + (distance * distanceRate);
          formula = `Base (${basePrice}€) + Volume (${volume} × ${volumeRate}€) + Distance (${distance}km × ${distanceRate}€)`;
          
          // Supplément volume
          if (volume > (pricingModel.volumeSupplementThreshold1 || 20)) {
            price += pricingModel.volumeSupplementFee1 || 0;
            formula += ` + Supp. vol 1 (${pricingModel.volumeSupplementFee1 || 0}€)`;
          }
          
          if (volume > (pricingModel.volumeSupplementThreshold2 || 29)) {
            price += pricingModel.volumeSupplementFee2 || 0;
            formula += ` + Supp. vol 2 (${pricingModel.volumeSupplementFee2 || 0}€)`;
          }
          
          // Multiplicateur de temps
          if (pricingModel.timeMultiplier && pricingModel.timeMultiplier !== 1) {
            price = price * pricingModel.timeMultiplier;
            formula += ` × Multiplicateur (${pricingModel.timeMultiplier})`;
          }
          
          // Prix minimum
          if (pricingModel.minimumPrice && price < pricingModel.minimumPrice) {
            formula += ` → Prix minimum: ${pricingModel.minimumPrice}€`;
            price = pricingModel.minimumPrice;
          }
        }
        
        return {
          supplier,
          price,
          formula,
          distance: calculatedDistance
        };
      })
      .sort((a, b) => a.price - b.price);

    setCalculatedOffers(offers);
  }, [opportunity, suppliers, calculatedDistance]);
  
  // Prendre les 4 meilleures offres
  const bestOffers = calculatedOffers.slice(0, 4);
  
  const handleDownloadPdf = () => {
    if (!opportunity || !calculatedDistance) return;
    
    try {
      setIsPdfGenerating(true);
      
      const doc = new jsPDF();
      
      // Entête
      doc.setFontSize(20);
      doc.text("Comparatif de prix", 105, 20, { align: "center" });
      
      // Informations sur l'opportunité
      doc.setFontSize(12);
      doc.text(`Opportunité: ${opportunity.title}`, 20, 40);
      doc.text(`De: ${opportunity.departure_city} (${opportunity.departure_postal_code})`, 20, 50);
      doc.text(`À: ${opportunity.arrival_city} (${opportunity.arrival_postal_code})`, 20, 60);
      doc.text(`Volume estimé: ${opportunity.estimated_volume} m³`, 20, 70);
      doc.text(`Distance calculée: ${calculatedDistance} km (Google Maps)`, 20, 80);
      
      // Tableau des meilleures offres
      doc.text("Les meilleures offres:", 20, 100);
      
      let yPosition = 110;
      bestOffers.forEach((offer, index) => {
        doc.text(`${index + 1}. ${offer.supplier.company_name}: ${offer.price.toLocaleString('fr-FR')} €`, 30, yPosition);
        yPosition += 10;
        doc.setFontSize(9);
        const formulas = doc.splitTextToSize(`   Formule: ${offer.formula}`, 160);
        formulas.forEach(line => {
          doc.text(line, 30, yPosition);
          yPosition += 7;
        });
        doc.setFontSize(12);
        yPosition += 5;
      });
      
      // Footer
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('fr-FR');
      doc.text(`Document généré le ${currentDate}`, 105, 280, { align: "center" });
      
      doc.save(`comparatif-prix-${opportunity.title.replace(/\s+/g, '-')}.pdf`);
      
      toast({
        title: "Succès",
        description: "Le PDF a été généré avec succès",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  if (!opportunity) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Meilleures offres de prix
          </DialogTitle>
          <DialogDescription>
            Comparaison des meilleures offres pour {opportunity.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Détails de l'opportunité</h3>
            <p className="text-sm text-muted-foreground">
              Départ: {opportunity.departure_city} ({opportunity.departure_postal_code})
            </p>
            <p className="text-sm text-muted-foreground">
              Arrivée: {opportunity.arrival_city} ({opportunity.arrival_postal_code})
            </p>
            <p className="text-sm text-muted-foreground">Volume: {opportunity.estimated_volume} m³</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Distance: {isLoadingDistance ? 'Calcul en cours...' : 
                  calculatedDistance ? `${calculatedDistance} km (Google Maps)` : 'Non calculée'}
              </span>
            </div>
            {opportunity.budget_range_min && opportunity.budget_range_max && (
              <p className="text-sm text-muted-foreground">
                Budget client: {opportunity.budget_range_min} - {opportunity.budget_range_max}€
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">{bestOffers.length} offres trouvées</h3>
            <p className="text-sm text-muted-foreground">
              Basées sur {calculatedOffers.length} fournisseurs actifs avec modèle de prix
            </p>
            <div className="flex space-x-2 mt-2">
              <Button 
                size="sm" 
                onClick={handleDownloadPdf} 
                disabled={isPdfGenerating || bestOffers.length === 0 || !calculatedDistance}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                {isPdfGenerating ? 'Génération...' : 'Télécharger en PDF'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={bestOffers.length === 0}
              >
                <Mail className="h-4 w-4" />
                Envoyer par email
              </Button>
            </div>
          </div>
        </div>
        
        {isLoadingDistance && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Calcul de la distance via Google Maps...</p>
          </div>
        )}
        
        {!isLoadingDistance && bestOffers.length > 0 ? (
          <div className="space-y-4">
            {bestOffers.map((offer, index) => (
              <Card key={index} className={`p-4 ${index === 0 ? 'bg-blue-50 border-blue-200' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{offer.supplier.company_name}</h3>
                      {index === 0 && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Meilleure offre
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{offer.supplier.city}, {offer.supplier.postal_code}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{offer.price.toLocaleString('fr-FR')} €</div>
                    {opportunity.budget_range_max && (
                      <Badge variant={offer.price <= opportunity.budget_range_max ? "outline" : "destructive"} className="mt-1">
                        {offer.price <= opportunity.budget_range_max ? 'Dans le budget' : 'Hors budget'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 text-xs bg-gray-50 p-2 rounded text-gray-600">
                  <div className="flex items-start gap-1">
                    <FileText className="h-3 w-3 mt-0.5" />
                    <div>{offer.formula}</div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" size="sm">Contact</Button>
                  <Button variant="outline" size="sm">Voir détails</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : !isLoadingDistance ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {calculatedDistance === null ? 
                'Impossible de calculer la distance. Vérifiez les codes postaux.' :
                'Aucune offre disponible. Vérifiez que vos fournisseurs ont des modèles de prix configurés.'
              }
            </p>
          </div>
        ) : null}

      </DialogContent>
    </Dialog>
  );
};

export default BestPricesDialog;
