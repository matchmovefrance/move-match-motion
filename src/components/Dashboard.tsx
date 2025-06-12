
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientList from './ClientList';
import ServiceProviders from './ServiceProviders';
import PublicLinkManager from './PublicLinkManager';
import MatchFinder from './MatchFinder';
import MoveManagement from './MoveManagement';
import UserManagement from './UserManagement';
import MoverList from './MoverList';
import DatabaseTestPanel from './DatabaseTestPanel';
import MatchAnalytics from './MatchAnalytics';
import AdminActions from './AdminActions';
import RoleDebugPanel from './RoleDebugPanel';

const Dashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Tableau de bord - Gestion de déménagements
      </h1>
      
      <RoleDebugPanel />
      
      <Tabs defaultValue="test-db" className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="test-db">Tests DB</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="movers">Déménageurs</TabsTrigger>
          <TabsTrigger value="moves">Déménagements</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="matches">Correspondances</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="links">Liens publics</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test-db" className="mt-6">
          <DatabaseTestPanel />
        </TabsContent>
        
        <TabsContent value="clients" className="mt-6">
          <ClientList />
        </TabsContent>
        
        <TabsContent value="movers" className="mt-6">
          <MoverList />
        </TabsContent>
        
        <TabsContent value="moves" className="mt-6">
          <MoverList />
        </TabsContent>
        
        <TabsContent value="services" className="mt-6">
          <ServiceProviders />
        </TabsContent>
        
        <TabsContent value="matches" className="mt-6">
          <MatchFinder />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <MatchAnalytics />
        </TabsContent>
        
        <TabsContent value="links" className="mt-6">
          <PublicLinkManager />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="admin" className="mt-6">
          <AdminActions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
