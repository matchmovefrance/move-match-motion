
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Euro, MapPin, Calendar, Package, Users, TrendingUp, CheckCircle, X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { pricingEngine } from './PricingEngine';

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

const QuotesTab = () => {
  const { toast } = useToast();
  const [generatedQuotes, setGeneratedQuotes] = useState<GeneratedQuote[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charger les demandes clients actives
  const { data: activeClients, refetch: refetchClients } = useQuery({
    queryKey: ['active-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Générer automatiquement les devis au chargement
  useEffect(() => {
    if (activeClients?.length && generatedQuotes.length === 0) {
      generateAllQuotes();
    }
  }, [activeClients]);

  const generateAllQuotes = async () => {
    if (!activeClients?.length) return;
    
    setIsGenerating(true);
    console.log('🔄 Génération des devis avec le nouveau moteur...');
    
    setGeneratedQuotes([]);
    
    try {
      const allQuotes: GeneratedQuote[] = [];
      
      // Utiliser le nouveau moteur de pricing pour chaque client
      for (const client of activeClients) {
        const clientQuotes = await pricingEngine.generateQuotesForClient(client);
        allQuotes.push(...clientQuotes);
      }
      
      setGeneratedQuotes(allQuotes);
      console.log('✅ Devis générés avec le nouveau moteur:', allQuotes.length);
      
      toast({
        title: "Devis générés",
        description: `${allQuotes.length} devis calculés avec le moteur de pricing cohérent`,
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
      console.log('✅ Acceptation devis:', quote.id);
      
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(),
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'accepted',
          notes: `Devis généré automatiquement - Rang #${quote.rank} pour ${quote.client_name}`,
          cost_breakdown: quote.pricing_breakdown,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      setGeneratedQuotes(prev => prev.filter(q => q.id !== quote.id));
      
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
      console.log('❌ Rejet devis:', quote.id);
      
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(),
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'rejected',
          notes: `Devis rejeté - Rang #${quote.rank} pour ${quote.client_name}`,
          cost_breakdown: quote.pricing_breakdown,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      setGeneratedQuotes(prev => prev.filter(q => q.id !== quote.id));
      
      toast({
        title: "Devis rejeté",
        description: `Le devis de ${quote.supplier_company} pour ${quote.client_name} a été rejeté`,
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

  // Grouper les devis par client
  const quotesByClient = generatedQuotes.reduce((acc, quote) => {
    if (!acc[quote.client_id]) {
      acc[quote.client_id] = [];
    }
    acc[quote.client_id].push(quote);
    return acc;
  }, {} as Record<number, GeneratedQuote[]>);

  return (
    <div className="space-y-6">
      {/* En-tête du moteur de devis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Moteur de devis intelligent - Prix cohérents et reproductibles
          </CardTitle>
          <CardDescription>
            <strong className="text-green-600">✅ NOUVEAU MOTEUR</strong> - Calculs cohérents basés sur les critères exacts de chaque prestataire.
            <br />
            <strong className="text-blue-600">🎯 PRIX IDENTIQUES</strong> - Les prix sont maintenant calculés de manière reproductible et cohérente.
            <br />
            <strong className="text-purple-600">📊 DÉTAIL COMPLET</strong> - Décomposition complète : prix prestataire + marge MatchMove = prix final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activeClients?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Clients actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{pricingEngine.getSuppliers().length}</div>
                <div className="text-sm text-muted-foreground">Prestataires</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{generatedQuotes.length}</div>
                <div className="text-sm text-muted-foreground">Devis générés</div>
              </div>
            </div>
            
            <Button 
              onClick={generateAllQuotes}
              disabled={isGenerating || !activeClients?.length}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {generatedQuotes.length > 0 ? 'Recalculer tous les devis' : 'Générer tous les devis'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats des devis par client */}
      {Object.keys(quotesByClient).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(quotesByClient).map(([clientId, quotes]) => {
            const hasOriginalQuote = quotes[0].original_quote_amount;
            const originalAmount = quotes[0].original_quote_amount;
            const bestCalculatedPrice = Math.min(...quotes.map(q => q.calculated_price));
            const priceDifference = originalAmount ? originalAmount - bestCalculatedPrice : null;
            
            return (
              <Card key={clientId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    {quotes[0].client_name}
                    <Badge variant="outline" className="ml-2">
                      {quotes[0].departure_city} → {quotes[0].arrival_city}
                    </Badge>
                    
                    {/* Comparaison prix original vs calculé */}
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
                    Volume: {quotes[0].estimated_volume}m³ • Date: {format(new Date(quotes[0].desired_date), 'dd/MM/yyyy', { locale: fr })}
                    {quotes[0].client_email && ` • ${quotes[0].client_email}`}
                    {hasOriginalQuote && priceDifference !== null && (
                      <div className="text-sm mt-1">
                        <span className={`font-medium ${Math.abs(priceDifference) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                          {Math.abs(priceDifference) > 50 
                            ? `⚠️ Écart important de ${Math.abs(priceDifference)}€ - vérifier les paramètres`
                            : `✅ Calcul cohérent avec le prix original`
                          }
                        </span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getRankBadge(quote.rank)}
                              <h4 className="font-semibold">{quote.supplier_company}</h4>
                              <span className="text-sm text-muted-foreground">{quote.supplier_name}</span>
                            </div>
                            
                            {/* Décomposition détaillée du prix */}
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
                                  Distance estimée: {quote.pricing_breakdown.estimatedDistance}km • 
                                  Étages: {quote.pricing_breakdown.estimatedFloors}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : isGenerating ? (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Calcul des devis avec le nouveau moteur...</h3>
            <p className="text-muted-foreground">
              Utilisation des critères de pricing exacts pour des prix cohérents et reproductibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Prêt à générer des devis cohérents</h3>
            <p className="text-muted-foreground mb-4">
              {!activeClients?.length 
                ? 'Aucun client actif trouvé'
                : 'Cliquez sur "Générer tous les devis" pour utiliser le nouveau moteur'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuotesTab;
