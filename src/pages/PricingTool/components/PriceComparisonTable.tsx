
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Star, TrendingUp, TrendingDown, Download, FileText, Mail, Phone, User } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Supplier = Tables<'suppliers'>;
type PricingOpportunity = Tables<'pricing_opportunities'>;

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
  client_name?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface PriceComparisonTableProps {
  opportunity: PricingOpportunity;
  quotes: Quote[];
  onSelectQuote?: (quote: Quote) => void;
  onExportPDF?: (quote: Quote) => void;
  onAcceptQuote?: (quote: Quote) => void;
  onRejectQuote?: (quote: Quote) => void;
}

const PriceComparisonTable = ({ 
  opportunity, 
  quotes, 
  onSelectQuote, 
  onExportPDF, 
  onAcceptQuote,
  onRejectQuote
}: PriceComparisonTableProps) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);

  const getBestPrice = () => {
    return Math.min(...quotes.map(q => q.price));
  };

  const getWorstPrice = () => {
    return Math.max(...quotes.map(q => q.price));
  };

  const getPriceVariant = (price: number) => {
    const bestPrice = getBestPrice();
    const worstPrice = getWorstPrice();
    
    if (price === bestPrice) return 'best';
    if (price === worstPrice) return 'worst';
    return 'normal';
  };

  const getPriceColor = (variant: string) => {
    switch (variant) {
      case 'best': return 'text-green-600 font-bold';
      case 'worst': return 'text-red-600';
      default: return 'text-foreground';
    }
  };

  const handleSelectQuote = (quote: Quote) => {
    setSelectedQuoteId(quote.id);
    onSelectQuote?.(quote);
  };

  const handleShowDetails = (quote: Quote) => {
    setDetailQuote(quote);
    setShowDetailDialog(true);
  };

  const handleAccept = (quote: Quote) => {
    onAcceptQuote?.(quote);
  };

  const handleReject = (quote: Quote) => {
    onRejectQuote?.(quote);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with opportunity info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Comparaison des devis - {opportunity.title}</span>
              <Badge variant="secondary" className="text-sm">
                {quotes.length} devis en attente
              </Badge>
            </CardTitle>
            <CardDescription>
              {opportunity.departure_city} → {opportunity.arrival_city} • {opportunity.estimated_volume}m³
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Comparison Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Fournisseur</TableHead>
                  <TableHead className="text-center">Client</TableHead>
                  <TableHead className="text-center">Prix total</TableHead>
                  <TableHead className="text-center">Durée</TableHead>
                  <TableHead className="text-center">Services inclus</TableHead>
                  <TableHead className="text-center">Délai réponse</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => {
                  const priceVariant = getPriceVariant(quote.price);
                  const isSelected = selectedQuoteId === quote.id;
                  
                  return (
                    <TableRow 
                      key={quote.id} 
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectQuote(quote)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{quote.supplier.company_name}</span>
                            {priceVariant === 'best' && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Meilleur prix
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {quote.supplier.city}
                          </div>
                          {quote.supplier.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {quote.supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{quote.client_name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className={`text-lg font-bold ${getPriceColor(priceVariant)}`}>
                            {quote.price.toLocaleString()}€
                          </div>
                          {priceVariant === 'best' && (
                            <div className="flex items-center justify-center text-green-600 text-xs">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Économie maximale
                            </div>
                          )}
                          {priceVariant === 'worst' && (
                            <div className="flex items-center justify-center text-red-600 text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{((quote.price - getBestPrice()) / getBestPrice() * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{quote.estimated_duration}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex items-center gap-1">
                            {quote.includes_packing ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs">Emballage</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {quote.includes_insurance ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs">Assurance</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {quote.includes_storage ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs">Stockage</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="text-sm">{quote.response_time}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowDetails(quote);
                                  }}
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Voir détails</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExportPDF?.(quote);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Télécharger PDF</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(quote);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(quote);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary and recommendations */}
        {quotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommandations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Meilleur prix</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {getBestPrice().toLocaleString()}€
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Économie de {((getWorstPrice() - getBestPrice())).toLocaleString()}€
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Prix moyen</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(quotes.reduce((sum, q) => sum + q.price, 0) / quotes.length).toLocaleString()}€
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Sur {quotes.length} devis
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">Clients concernés</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(quotes.map(q => q.client_name)).size}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Clients différents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du devis - {detailQuote?.supplier.company_name}</DialogTitle>
              <DialogDescription>
                Client: {detailQuote?.client_name}
              </DialogDescription>
            </DialogHeader>
            
            {detailQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Informations générales</h4>
                    <div className="text-sm space-y-1">
                      <div>Prix: <span className="font-bold">{detailQuote.price.toLocaleString()}€</span></div>
                      <div>Durée estimée: {detailQuote.estimated_duration}</div>
                      <div>Temps de réponse: {detailQuote.response_time}</div>
                      <div>Note: {detailQuote.rating}/5 ⭐</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Services inclus</h4>
                    <div className="text-sm space-y-1">
                      <div className={detailQuote.includes_packing ? 'text-green-600' : 'text-red-600'}>
                        {detailQuote.includes_packing ? '✓' : '✗'} Emballage
                      </div>
                      <div className={detailQuote.includes_insurance ? 'text-green-600' : 'text-red-600'}>
                        {detailQuote.includes_insurance ? '✓' : '✗'} Assurance
                      </div>
                      <div className={detailQuote.includes_storage ? 'text-green-600' : 'text-red-600'}>
                        {detailQuote.includes_storage ? '✓' : '✗'} Stockage
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Contact fournisseur</h4>
                  <div className="text-sm space-y-1">
                    <div>Email: {detailQuote.supplier.email}</div>
                    <div>Téléphone: {detailQuote.supplier.phone}</div>
                    <div>Adresse: {detailQuote.supplier.address}, {detailQuote.supplier.city}</div>
                  </div>
                </div>

                {detailQuote.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded">{detailQuote.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => onExportPDF?.(detailQuote)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleReject(detailQuote)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                  <Button 
                    onClick={() => handleAccept(detailQuote)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default PriceComparisonTable;
