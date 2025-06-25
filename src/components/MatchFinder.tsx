
import { useState } from 'react';
import { Target, Users, Search, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SimpleMatches } from '@/components/SimpleMatches';
import ClientToClientMatches from './ClientToClientMatches';
import { GlobalMatchReport } from './GlobalMatchReport';
import { useToast } from '@/hooks/use-toast';
import { ClientToClientMatchingService } from '@/services/ClientToClientMatchingService';
import { SimpleMatchingService } from '@/services/SimpleMatchingService';

const MatchFinder = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('client-to-client');
  const [isSearching, setIsSearching] = useState(false);
  const [globalResults, setGlobalResults] = useState<{
    clientToClient: any[];
    clientToMover: any[];
  } | null>(null);

  const handleGlobalSearch = async () => {
    setIsSearching(true);
    try {
      console.log('🔍 Lancement recherche globale...');
      
      // Recherche client-à-client
      const clientToClientMatches = await ClientToClientMatchingService.findClientToClientMatches();
      
      // Recherche client-déménageur
      const clientToMoverMatches = await SimpleMatchingService.findClientToMoverMatches();

      const results = {
        clientToClient: clientToClientMatches,
        clientToMover: clientToMoverMatches
      };

      setGlobalResults(results);
      
      toast({
        title: "Recherche globale terminée",
        description: `${clientToClientMatches.length} matches C2C et ${clientToMoverMatches.length} matches C2M trouvés`,
      });

    } catch (error) {
      console.error('❌ Erreur recherche globale:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer la recherche globale",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Recherche de Correspondances</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={handleGlobalSearch}
            disabled={isSearching}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Recherche en cours...' : 'Recherche Globale'}
          </Button>
          {globalResults && (
            <Button 
              variant="outline"
              onClick={() => setActiveTab('summary')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Rapport Global
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="client-to-client">
            <Users className="h-4 w-4 mr-2" />
            Client-à-Client
            {globalResults && globalResults.clientToClient.length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                {globalResults.clientToClient.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="simple">
            <Target className="h-4 w-4 mr-2" />
            Client-Déménageur
            {globalResults && globalResults.clientToMover.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                {globalResults.clientToMover.length}
              </span>
            )}
          </TabsTrigger>
          {globalResults && (
            <TabsTrigger value="summary">
              <FileText className="h-4 w-4 mr-2" />
              Rapport Global
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="client-to-client">
          <ClientToClientMatches globalMatches={globalResults?.clientToClient} />
        </TabsContent>
        
        <TabsContent value="simple">
          <SimpleMatches globalMatches={globalResults?.clientToMover} />
        </TabsContent>

        {globalResults && (
          <TabsContent value="summary">
            <GlobalMatchReport 
              clientToClientMatches={globalResults.clientToClient}
              clientToMoverMatches={globalResults.clientToMover}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default MatchFinder;
