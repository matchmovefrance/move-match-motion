
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, X, MapPin, User, Calendar, Package, TrendingUp, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { PricingCalculationDetails } from '../PricingCalculationDetails';

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
  quote_type?: 'competitive' | 'standard' | 'premium';
}

interface QuoteCardProps {
  quote: GeneratedQuote;
  onAccept: (quote: GeneratedQuote) => void;
  onReject: (quote: GeneratedQuote) => void;
}

export const QuoteCard = ({ quote, onAccept, onReject }: QuoteCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
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

  const getQuoteTypeBadge = (type?: string) => {
    switch (type) {
      case 'competitive':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Compétitif</Badge>;
      case 'standard':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Standard</Badge>;
      case 'premium':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Premium</Badge>;
      default:
        return null;
    }
  };

  const marginPercentage = quote.pricing_breakdown?.marginPercentage || 
    ((quote.matchmove_margin / quote.supplier_price) * 100);
  
  const isMarginValid = marginPercentage >= 39 && marginPercentage <= 41;

  return (
    <TableRow className="border-b">
      <TableCell>
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{quote.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {quote.departure_city} → {quote.arrival_city}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-3 w-3" />
                  {quote.estimated_volume}m³
                  <Calendar className="h-3 w-3 ml-2" />
                  {new Date(quote.desired_date).toLocaleDateString()}
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <PricingCalculationDetails quote={quote} />
            </CollapsibleContent>
          </div>
        </Collapsible>
      </TableCell>
      
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{quote.supplier_company}</div>
          <div className="text-sm text-muted-foreground">{quote.supplier_name}</div>
          {getQuoteTypeBadge(quote.quote_type)}
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="space-y-1">
          {getRankBadge(quote.rank)}
          <div className="text-xs text-muted-foreground">
            {quote.pricing_breakdown?.exactDistance}km
          </div>
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Prix prestataire</div>
          <div className="font-medium text-blue-600">{quote.supplier_price.toLocaleString()}€</div>
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm text-muted-foreground">Marge</span>
            {isMarginValid ? (
              <Badge variant="default" className="text-xs">✓</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">⚠</Badge>
            )}
          </div>
          <div className="font-medium text-orange-600">
            +{quote.matchmove_margin.toLocaleString()}€
          </div>
          <div className="text-xs text-muted-foreground">
            ({marginPercentage.toFixed(1)}%)
          </div>
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Prix final</div>
          <div className="text-lg font-bold text-green-600">
            {quote.calculated_price.toLocaleString()}€
          </div>
          {quote.original_quote_amount && (
            <div className="text-xs text-muted-foreground">
              Budget: {quote.original_quote_amount.toLocaleString()}€
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
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
            <Check className="h-4 w-4 mr-1" />
            Accepter
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
