
import { useState } from 'react';
import { Target, Users, Search, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SimpleMatches } from '@/components/SimpleMatches';
import ClientToClientMatches from './ClientToClientMatches';
import { GlobalMatchReport } from './GlobalMatchReport';

const MatchFinder = () => {
  const [activeTab, setActiveTab] = useState('client-to-client');
  const [showGlobalReport, setShowGlobalReport] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleGlobalSearch = async () => {
    setIsSearching(true);
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowGlobalReport(true);
    setIsSearching(false);
  };

  if (showGlobalReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Rapport Global de Matching
          </h2>
          <Button 
            variant="outline" 
            onClick={() => setShowGlobalReport(false)}
          >
            Retour aux recherches
          </Button>
        </div>
        <GlobalMatchReport />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Recherche de Correspondances</h2>
        <Button 
          onClick={handleGlobalSearch}
          disabled={isSearching}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? 'Recherche en cours...' : 'Recherche Globale'}
        </Button>
      </div>

      <Tabs defaultValue="client-to-client" className="w-full">
        <TabsList>
          <TabsTrigger value="client-to-client">
            <Users className="h-4 w-4 mr-2" />
            Client-à-Client
          </TabsTrigger>
          <TabsTrigger value="simple">
            <Target className="h-4 w-4 mr-2" />
            Client-Déménageur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="client-to-client">
          <ClientToClientMatches />
        </TabsContent>
        <TabsContent value="simple">
          <SimpleMatches />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchFinder;
