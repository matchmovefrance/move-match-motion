
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Euro, MapPin, Calendar, Package, Users, TrendingUp, CheckCircle, X, Loader2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PricingModel {
  basePrice?: number;
  volumeRate?: number;
  distanceRate?: number;
  minimumPrice?: number;
  matchMoveMargin?: number;
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
  original_quote_amount?: number; // Prix original du client
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

  // Charger les prestataires depuis les trajets confirmés
  const { data: suppliers, refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers-for-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('mover_id, mover_name, company_name, contact_email, contact_phone')
        .not('mover_id', 'is', null);
      
      if (error) return [];
      
      // Créer des prestataires uniques avec modèles de tarification
      const uniqueSuppliersMap = new Map();
      
      data?.forEach((move) => {
        const key = `${move.mover_name}-${move.company_name}`;
        if (!uniqueSuppliersMap.has(key)) {
          uniqueSuppliersMap.set(key, {
            id: `supplier-${move.mover_id}`,
            mover_name: move.mover_name,
            company_name: move.company_name,
            contact_email: move.contact_email,
            contact_phone: move.contact_phone,
            pricing_model: {
              basePrice: 120 + Math.random() * 80,
              volumeRate: 8 + Math.random() * 6,
              distanceRate: 0.8 + Math.random() * 0.4,
              minimumPrice: 180 + Math.random() * 40,
              matchMoveMargin: 35 + Math.random() * 15, // Marge variable par prestataire
            }
          });
        }
      });
      
      const uniqueSuppliers = Array.from(uniqueSuppliersMap.values());
      console.log('✅ Prestataires chargés:', uniqueSuppliers.length);
      return uniqueSuppliers;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Générer automatiquement les devis au chargement
  useEffect(() => {
    if (activeClients?.length && suppliers?.length && generatedQuotes.length === 0) {
      generateAllQuotes();
    }
  }, [activeClients, suppliers]);

  // 🎯 CORRECTION: Utiliser la MÊME logique que dans OpportunitiesTab
  const calculatePriceForClient = (client: any, supplier: any) => {
    const pricingModel = supplier.pricing_model as PricingModel;
    
    // Calculer le prix de base du prestataire (SANS marge MatchMove)
    let basePrice = pricingModel.basePrice || 150;
    basePrice += (client.estimated_volume || 0) * (pricingModel.volumeRate || 10);
    basePrice += 50 * (pricingModel.distanceRate || 1); // Distance estimée
    basePrice = Math.max(basePrice, pricingModel.minimumPrice || 200);
    
    // 🎯 IMPORTANT: Appliquer la marge MatchMove spécifique du prestataire
    const matchMoveMargin = pricingModel.matchMoveMargin || 40; // Marge du prestataire
    const finalPrice = basePrice * (1 + matchMoveMargin / 100);
    
    console.log(`💰 Calcul ${supplier.company_name} pour ${client.name || `Client #${client.id}`}:`);
    console.log(`   📊 Prix base: ${basePrice}€`);
    console.log(`   💎 Marge MatchMove: ${matchMoveMargin}%`);
    console.log(`   🎯 Prix final: ${Math.round(finalPrice)}€`);
    console.log(`   🔍 Prix original client: ${client.quote_amount || 'Non défini'}€`);
    
    return Math.round(finalPrice);
  };

  const generateAllQuotes = async () => {
    if (!activeClients?.length || !suppliers?.length) return;
    
    setIsGenerating(true);
    console.log('🔄 Génération/Régénération des devis...');
    
    // 🎯 CORRECTION: Vider d'abord la liste pour une vraie régénération
    setGeneratedQuotes([]);
    
    try {
      // 🎯 CORRECTION: Refetch les données pour avoir les dernières variables
      await Promise.all([refetchClients(), refetchSuppliers()]);
      
      const allQuotes: GeneratedQuote[] = [];
      
      // Pour chaque client, calculer les prix avec tous les prestataires
      activeClients.forEach((client) => {
        const clientQuotes: Array<GeneratedQuote & { price: number }> = [];
        
        suppliers.forEach((supplier) => {
          const price = calculatePriceForClient(client, supplier);
          
          clientQuotes.push({
            id: `quote-${client.id}-${supplier.id}-${Date.now()}`,
            client_id: client.id,
            client_name: client.name || `Client #${client.id}`,
            client_email: client.email || '',
            departure_city: client.departure_city,
            arrival_city: client.arrival_city,
            estimated_volume: client.estimated_volume,
            desired_date: client.desired_date,
            supplier_id: supplier.id,
            supplier_name: supplier.mover_name,
            supplier_company: supplier.company_name,
            calculated_price: price,
            original_quote_amount: client.quote_amount, // 🎯 AJOUT: Prix original du client
            price: price,
            rank: 0
          });
        });
        
        // Trier par prix et prendre les 3 meilleurs
        clientQuotes.sort((a, b) => a.price - b.price);
        const top3 = clientQuotes.slice(0, 3).map((quote, index) => ({
          ...quote,
          rank: index + 1
        }));
        
        allQuotes.push(...top3);
      });
      
      setGeneratedQuotes(allQuotes);
      console.log('✅ Devis générés/régénérés:', allQuotes.length);
      
      toast({
        title: "Devis régénérés",
        description: `${allQuotes.length} devis recalculés avec les dernières variables de prix`,
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
      
      // Créer le devis accepté dans la base - CORRECTION: utiliser client_id comme string
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(), // Convertir en string
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'accepted',
          notes: `Devis généré automatiquement - Rang #${quote.rank} pour ${quote.client_name}`,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Retirer le devis de la liste
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
      
      // Créer le devis rejeté dans la base - CORRECTION: utiliser client_id comme string
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(), // Convertir en string
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'rejected',
          notes: `Devis rejeté - Rang #${quote.rank} pour ${quote.client_name}`,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Retirer le devis de la liste
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
            Moteur de devis automatique - 3 meilleurs prix par client
          </CardTitle>
          <CardDescription>
            Génération automatique des 3 meilleurs devis pour chaque client actif avec tous les prestataires disponibles.
            <strong className="text-orange-600 ml-2">✨ Marge MatchMove variable par prestataire (35-50%)</strong>
            <br />
            <strong className="text-red-600">⚠️ Les prix sont recalculés avec les paramètres actuels - peuvent différer des prix originaux</strong>
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
                <div className="text-2xl font-bold text-green-600">{suppliers?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Prestataires</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{generatedQuotes.length}</div>
                <div className="text-sm text-muted-foreground">Devis générés</div>
              </div>
            </div>
            
            <Button 
              onClick={generateAllQuotes}
              disabled={isGenerating || !activeClients?.length || !suppliers?.length}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {generatedQuotes.length > 0 ? 'Regénérer tous les devis' : 'Générer tous les devis'}
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
            const priceDifference = originalAmount && originalAmount - bestCalculatedPrice;
            
            return (
              <Card key={clientId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    {quotes[0].client_name}
                    <Badge variant="outline" className="ml-2">
                      {quotes[0].departure_city} → {quotes[0].arrival_city}
                    </Badge>
                    
                    {/* 🎯 AJOUT: Comparaison prix original vs calculé */}
                    {hasOriginalQuote && (
                      <div className="flex items-center gap-2 ml-auto">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Prix original: </span>
                          <span className="font-semibold text-blue-600">{originalAmount}€</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Meilleur prix: </span>
                          <span className="font-semibold text-green-600">{bestCalculatedPrice}€</span>
                        </div>
                        {priceDifference && (
                          <Badge 
                            variant={priceDifference > 0 ? "destructive" : "default"}
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {priceDifference > 0 ? `-${priceDifference}€` : `+${Math.abs(priceDifference)}€`}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Volume: {quotes[0].estimated_volume}m³ • Date: {format(new Date(quotes[0].desired_date), 'dd/MM/yyyy', { locale: fr })}
                    {quotes[0].client_email && ` • ${quotes[0].client_email}`}
                    {hasOriginalQuote && priceDifference && (
                      <div className="text-sm mt-1">
                        <span className={`font-medium ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {priceDifference > 0 
                            ? `⚠️ Écart de ${priceDifference}€ - prix recalculé plus bas que l'original`
                            : `✅ Prix recalculé cohérent avec l'original`
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
                            <div className="flex items-center gap-3 mb-2">
                              {getRankBadge(quote.rank)}
                              <h4 className="font-semibold">{quote.supplier_company}</h4>
                              <span className="text-sm text-muted-foreground">{quote.supplier_name}</span>
                            </div>
                            
                            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                              <Euro className="h-5 w-5" />
                              {quote.calculated_price.toLocaleString()}€
                              <span className="text-sm text-orange-600 font-normal">(marge MatchMove incluse)</span>
                              
                              {/* 🎯 AJOUT: Indicateur de différence avec prix original */}
                              {hasOriginalQuote && (
                                <span className="text-sm text-muted-foreground font-normal">
                                  vs {originalAmount}€ original
                                </span>
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
            <h3 className="text-lg font-medium mb-2">Génération des devis en cours...</h3>
            <p className="text-muted-foreground">
              Calcul des 3 meilleurs prix pour chaque client avec tous les prestataires disponibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun devis à générer</h3>
            <p className="text-muted-foreground mb-4">
              {!activeClients?.length 
                ? 'Aucun client actif trouvé'
                : !suppliers?.length 
                ? 'Aucun prestataire disponible'
                : 'Cliquez sur "Générer tous les devis" pour commencer'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuotesTab;
