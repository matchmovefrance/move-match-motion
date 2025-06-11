
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Search, Loader2, RefreshCw } from 'lucide-react';
import { pricingEngine } from './PricingEngine';
import { ClientQuoteGroup } from './QuotesTab/ClientQuoteGroup';
import { useQuotes } from './QuotesTab/useQuotes';

const QuotesTab = () => {
  const {
    activeClients,
    generatedQuotes,
    isGenerating,
    generateAllQuotes,
    handleAcceptQuote,
    handleRejectQuote
  } = useQuotes();

  // Grouper les devis par client
  const quotesByClient = generatedQuotes.reduce((acc, quote) => {
    if (!acc[quote.client_id]) {
      acc[quote.client_id] = [];
    }
    acc[quote.client_id].push(quote);
    return acc;
  }, {} as Record<number, typeof generatedQuotes>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Moteur de devis intelligent - Distances exactes Google Maps
          </CardTitle>
          <CardDescription>
            <strong className="text-green-600">✅ NOUVEAU MOTEUR</strong> - Calculs cohérents basés sur les critères exacts de chaque prestataire.
            <br />
            <strong className="text-blue-600">🗺️ GOOGLE MAPS API</strong> - Distances exactes calculées via l'API Google Maps avec codes postaux.
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
                  Calcul Google Maps en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {generatedQuotes.length > 0 ? 'Recalculer avec Google Maps' : 'Générer avec Google Maps'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(quotesByClient).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(quotesByClient).map(([clientId, quotes]) => (
            <ClientQuoteGroup
              key={clientId}
              quotes={quotes}
              onAcceptQuote={handleAcceptQuote}
              onRejectQuote={handleRejectQuote}
            />
          ))}
        </div>
      ) : isGenerating ? (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Calcul des devis avec Google Maps API...</h3>
            <p className="text-muted-foreground">
              Utilisation des distances exactes Google Maps pour des prix précis et cohérents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Prêt à générer des devis avec Google Maps</h3>
            <p className="text-muted-foreground mb-4">
              {!activeClients?.length 
                ? 'Aucun client actif trouvé'
                : 'Cliquez sur "Générer avec Google Maps" pour utiliser les distances exactes'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuotesTab;
