
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, AlertTriangle } from 'lucide-react';

interface GeneratedQuote {
  id: string;
  client_id: number;
  client_name: string;
  supplier_company: string;
  calculated_price: number;
  supplier_price: number;
  matchmove_margin: number;
  original_quote_amount?: number;
  pricing_breakdown?: any;
  rank: number;
}

interface QuoteCardProps {
  quote: GeneratedQuote;
  onAccept: (quote: GeneratedQuote) => void;
  onReject: (quote: GeneratedQuote) => void;
}

export const QuoteCard = ({ quote, onAccept, onReject }: QuoteCardProps) => {
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

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(quote)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Rejeter
          </Button>
          
          <Button
            size="sm"
            onClick={() => onAccept(quote)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
};
