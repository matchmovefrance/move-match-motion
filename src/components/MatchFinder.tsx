
import { useState } from 'react';
import { Target, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleMatches } from '@/components/SimpleMatches';
import ClientToClientMatches from './ClientToClientMatches';

const MatchFinder = () => {
  const [activeTab, setActiveTab] = useState('client-to-client');

  return (
    <div>
      <Tabs defaultValue="client-to-client" className="w-full">
        <TabsList>
          <TabsTrigger value="client-to-client">
            <Users className="h-4 w-4 mr-2" />
            Client-à-Client
          </TabsTrigger>
          <TabsTrigger value="simple">
            <Target className="h-4 w-4 mr-2" />
            Simple
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
