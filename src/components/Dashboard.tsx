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
import { useAuth, useToast } from '@/hooks';
import { supabase } from '@/lib/supabase';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    clients: 0,
    moves: 0,
    movers: 0,
    matches: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [diagnostics, setDiagnostics] = useState({
    pendingRequests: 0,
    confirmedMoves: 0,
    activeMovers: 0,
    totalMatches: 0
  });

  const periods = [
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '3 derniers mois' },
    { value: 'all', label: 'Tout' }
  ];

  const calculateDateFilter = (period: string) => {
    if (period === 'all') return null;
    
    const date = new Date();
    date.setDate(date.getDate() - parseInt(period));
    return date.toISOString();
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard stats...');
      
      const dateFilter = calculateDateFilter(selectedPeriod);
      
      // Compter les clients depuis client_requests
      const clientsQuery = supabase
        .from('client_requests')
        .select('id', { count: 'exact', head: true });
      
      if (dateFilter) {
        clientsQuery.gte('created_at', dateFilter);
      }
      
      const { count: clientsCount, error: clientsError } = await clientsQuery;
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      }

      // Compter les démenagements confirmés depuis confirmed_moves
      const movesQuery = supabase
        .from('confirmed_moves')
        .select('id', { count: 'exact', head: true });
      
      if (dateFilter) {
        movesQuery.gte('created_at', dateFilter);
      }
      
      const { count: movesCount, error: movesError } = await movesQuery;
      
      if (movesError) {
        console.error('Error fetching moves:', movesError);
      }

      // Compter les démenageurs depuis movers
      const moversQuery = supabase
        .from('movers')
        .select('id', { count: 'exact', head: true });
      
      if (dateFilter) {
        moversQuery.gte('created_at', dateFilter);
      }
      
      const { count: moversCount, error: moversError } = await moversQuery;
      
      if (moversError) {
        console.error('Error fetching movers:', moversError);
      }

      // Compter les correspondances depuis move_matches
      const matchesQuery = supabase
        .from('move_matches')
        .select('id', { count: 'exact', head: true });
      
      if (dateFilter) {
        matchesQuery.gte('created_at', dateFilter);
      }
      
      const { count: matchesCount, error: matchesError } = await matchesQuery;
      
      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
      }

      setStats({
        clients: clientsCount || 0,
        moves: movesCount || 0,
        movers: moversCount || 0,
        matches: matchesCount || 0
      });

      // Diagnostics pour les KPIs
      const { count: pendingCount } = await supabase
        .from('client_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: confirmedCount } = await supabase
        .from('confirmed_moves')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'in_progress']);

      const { count: activeMoversCount } = await supabase
        .from('movers')
        .select('id', { count: 'exact', head: true });

      const { count: totalMatchesCount } = await supabase
        .from('move_matches')
        .select('id', { count: 'exact', head: true });

      setDiagnostics({
        pendingRequests: pendingCount || 0,
        confirmedMoves: confirmedCount || 0,
        activeMovers: activeMoversCount || 0,
        totalMatches: totalMatchesCount || 0
      });

      console.log('✅ Stats loaded:', {
        clients: clientsCount,
        moves: movesCount,
        movers: moversCount,
        matches: matchesCount
      });

    } catch (error) {
      console.error('Error in fetchStats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

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
          <MoveManagement />
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
