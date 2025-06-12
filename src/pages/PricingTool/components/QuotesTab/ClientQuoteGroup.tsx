

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuoteCard } from './QuoteCard';
import QuoteGenerator from '@/components/QuoteGenerator';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  supplier_company: string;
  calculated_price: number;
  supplier_price: number;
  matchmove_margin: number;
  original_quote_amount?: number;
  pricing_breakdown?: any;
  rank: number;
}

interface ClientQuoteGroupProps {
  quotes: GeneratedQuote[];
  onAcceptQuote: (quote: GeneratedQuote) => void;
  onRejectQuote: (quote: GeneratedQuote) => void;
}

export const ClientQuoteGroup = ({ quotes, onAcceptQuote, onRejectQuote }: ClientQuoteGroupProps) => {
  const [suppliersData, setSuppliersData] = useState<any[]>([]);

  useEffect(() => {
    loadSuppliersData();
  }, []);

  const loadSuppliersData = async () => {
    try {
      console.log('🔄 Chargement des données des prestataires pour ClientQuoteGroup...');
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*');

      if (error) throw error;
      console.log('✅ Prestataires chargés pour ClientQuoteGroup:', suppliers?.length || 0);
      console.log('📋 Liste complète des prestataires avec IDs:', suppliers?.map(s => ({ id: s.id, name: s.company_name })));
      setSuppliersData(suppliers || []);
    } catch (error) {
      console.error('❌ Erreur chargement prestataires ClientQuoteGroup:', error);
    }
  };

  const getSupplierData = (supplierId: string, allQuotes: GeneratedQuote[]) => {
    console.log('🔍 Recherche prestataire dans ClientQuoteGroup:', supplierId);
    console.log('📋 IDs disponibles:', suppliersData.map(s => s.id));
    
    // Trouver le quote correspondant pour obtenir le nom de société
    const currentQuote = allQuotes.find(q => q.supplier_id === supplierId);
    if (!currentQuote) {
      console.log('❌ Quote non trouvé pour supplier_id:', supplierId);
      return null;
    }

    console.log('📋 Recherche par nom de société:', currentQuote.supplier_company);
    
    // Rechercher directement par nom de société (méthode la plus fiable)
    let supplier = suppliersData.find(s => 
      s.company_name?.toLowerCase().trim() === currentQuote.supplier_company?.toLowerCase().trim()
    );
    
    // Si pas trouvé, essayer une recherche plus permissive
    if (!supplier) {
      supplier = suppliersData.find(s => 
        s.company_name && currentQuote.supplier_company &&
        (s.company_name.toLowerCase().includes(currentQuote.supplier_company.toLowerCase()) ||
         currentQuote.supplier_company.toLowerCase().includes(s.company_name.toLowerCase()))
      );
      console.log('🔄 Recherche permissive:', supplier ? 'TROUVÉ' : 'NON TROUVÉ');
    }
    
    // En dernier recours, essayer par ID exact
    if (!supplier) {
      supplier = suppliersData.find(s => s.id === supplierId);
      console.log('🔄 Recherche par ID exact:', supplier ? 'TROUVÉ' : 'NON TROUVÉ');
    }
    
    console.log('🔍 Résultat final recherche prestataire:', supplierId, 'trouvé:', supplier ? 'OUI' : 'NON');
    if (supplier) {
      console.log('📋 Données prestataire trouvé:', {
        id: supplier.id,
        company_name: supplier.company_name,
        contact_name: supplier.contact_name,
        email: supplier.email,
        phone: supplier.phone,
        hasBankDetails: !!supplier.bank_details
      });
    } else {
      console.log('❌ Aucun prestataire trouvé pour:', {
        supplierId,
        supplierCompany: currentQuote.supplier_company,
        availableCompanies: suppliersData.map(s => s.company_name)
      });
    }
    return supplier;
  };

  const firstQuote = quotes[0];
  const hasOriginalQuote = firstQuote.original_quote_amount;
  const originalAmount = firstQuote.original_quote_amount;
  const bestCalculatedPrice = Math.min(...quotes.map(q => q.calculated_price));
  const priceDifference = originalAmount ? originalAmount - bestCalculatedPrice : null;
  const exactDistance = firstQuote.pricing_breakdown?.exactDistance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          {firstQuote.client_name}
          <Badge variant="outline" className="ml-2">
            {firstQuote.departure_city} → {firstQuote.arrival_city}
          </Badge>
          
          {exactDistance && (
            <Badge className="bg-blue-100 text-blue-800">
              🗺️ {exactDistance}km (Google Maps)
            </Badge>
          )}
          
          {hasOriginalQuote && (
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-sm bg-blue-50 px-3 py-1 rounded-md">
                <span className="text-muted-foreground">Prix original: </span>
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
                      <AlertTriangle className="h-3 w-3" />
                      -{priceDifference}€
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      +{Math.abs(priceDifference)}€
                    </>
                  )}
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Volume: {firstQuote.estimated_volume}m³ • Date: {format(new Date(firstQuote.desired_date), 'dd/MM/yyyy', { locale: fr })}
          {firstQuote.client_email && ` • ${firstQuote.client_email}`}
          {exactDistance && (
            <div className="text-sm mt-1 text-blue-600">
              🗺️ Distance exacte calculée par Google Maps : {exactDistance}km
            </div>
          )}
          {hasOriginalQuote && priceDifference !== null && (
            <div className="text-sm mt-1">
              <span className={`font-medium ${Math.abs(priceDifference) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(priceDifference) > 50 
                  ? `⚠️ Écart important de ${Math.abs(priceDifference)}€ - vérifier les paramètres`
                  : `✅ Calcul cohérent avec le prix original (distance exacte Google Maps)`
                }
              </span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {quotes.map((quote) => {
            const supplierData = getSupplierData(quote.supplier_id, quotes);
            console.log('🎯 Quote PDF pour:', quote.supplier_company, 'Données prestataire:', supplierData ? 'DISPONIBLES' : 'MANQUANTES');
            
            return (
              <div key={quote.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-green-100 text-green-800">🥇 Meilleur prix</Badge>
                      <h4 className="font-semibold">{quote.supplier_company}</h4>
                      {!supplierData && (
                        <Badge variant="destructive" className="text-xs">
                          ⚠️ Données manquantes
                        </Badge>
                      )}
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
                        departure_postal_code: '',
                        departure_country: null,
                        arrival_address: null,
                        arrival_city: quote.arrival_city,
                        arrival_postal_code: '',
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
                      } : {
                        company_name: quote.supplier_company,
                        contact_name: "Contact non disponible",
                        email: "email@exemple.fr",
                        phone: "01 23 45 67 89",
                        bank_details: undefined
                      }}
                      supplierPrice={quote.supplier_price}
                      matchMoveMargin={quote.pricing_breakdown?.marginPercentage || 0}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRejectQuote(quote)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => onAcceptQuote(quote)}
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
      </CardContent>
    </Card>
  );
};

