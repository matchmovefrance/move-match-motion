
import { useState } from 'react';
import { Target, Truck, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleMatches } from '@/components/SimpleMatches';
import { ProfessionalMatches } from '@/components/ProfessionalMatches';
import ClientToClientMatches from './ClientToClientMatches';

const MatchFinder = () => {
  const [activeTab, setActiveTab] = useState('simple');

  return (
    <div>
      <Tabs defaultValue="simple" className="w-full">
        <TabsList>
          {/* Onglets */}
          <TabsTrigger value="simple">
            <Target className="h-4 w-4 mr-2" />
            Simple
          </TabsTrigger>
          <TabsTrigger value="client-to-client">
            <Users className="h-4 w-4 mr-2" />
            Client-à-Client
          </TabsTrigger>
          <TabsTrigger value="professional">
            <Truck className="h-4 w-4 mr-2" />
            Professionnel
          </TabsTrigger>
        </TabsList>

        {/* Contenus des onglets */}
        <TabsContent value="simple">
          <SimpleMatches />
        </TabsContent>
        <TabsContent value="client-to-client">
          <ClientToClientMatches />
        </TabsContent>
        <TabsContent value="professional">
          <ProfessionalMatches />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchFinder;
