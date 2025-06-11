
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuoteCard } from './QuoteCard';

interface GeneratedQuote {
  id: string;
  client_id: number;
  client_name: string;
  client_email: string;
  departure_city: string;
  arrival_city: string;
  estimated_volume: number;
  desired_date: string;
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
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onAccept={onAcceptQuote}
              onReject={onRejectQuote}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
