
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ClipboardList, Users2, Settings, CircleDollarSign, BarChart3, Plus, CheckCircle, Archive } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import OpportunitiesTab from './components/OpportunitiesTab';
import SuppliersTab from './components/SuppliersTab';
import QuotesTab from './components/QuotesTab';
import AcceptedQuotesTab from './components/AcceptedQuotesTab';
import HistoryTab from './components/HistoryTab';
import CreateOpportunityDialog from './components/CreateOpportunityDialog';
import { useToast } from '@/hooks/use-toast';

const PricingTool = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState('opportunities');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) setTheme('dark');
  }, []);

  // Requête optimisée pour les statistiques avec filtrage des données demo
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['pricing-stats'],
    queryFn: async () => {
      console.log('📊 Chargement des statistiques...');
      
      const [clientsData, movesRaw, quotesRaw] = await Promise.all([
        supabase.from('clients').select('id, status'),
        supabase.from('confirmed_moves').select('mover_id, mover_name, company_name').not('mover_id', 'is', null),
        supabase
          .from('quotes')
          .select(`
            id, 
            status, 
            created_by,
            supplier:suppliers(company_name)
          `)
          .eq('created_by', user?.id)
      ]);

      // Compter les clients uniques depuis clients
      const totalClients = clientsData.data?.length || 0;
      const activeClients = clientsData.data?.filter(c => ['pending', 'confirmed'].includes(c.status)).length || 0;
      const completedClients = clientsData.data?.filter(c => ['completed', 'cancelled', 'closed'].includes(c.status)).length || 0;

      // Compter les prestataires uniques depuis les trajets (sans demo)
      const uniqueSuppliersMap = new Map();
      movesRaw.data?.forEach((move) => {
        const companyName = move.company_name?.toLowerCase() || '';
        const moverName = move.mover_name?.toLowerCase() || '';
        
        // Filtrer les prestataires demo
        const isDemo = companyName.includes('demo') || 
                      companyName.includes('test') || 
                      moverName.includes('demo') ||
                      moverName.includes('test');
        
        if (!isDemo) {
          const key = `${move.mover_name}-${move.company_name}`;
          if (!uniqueSuppliersMap.has(key)) {
            uniqueSuppliersMap.set(key, {
              mover_name: move.mover_name,
              company_name: move.company_name,
              is_active: true
            });
          }
        }
      });

      const uniqueSuppliers = Array.from(uniqueSuppliersMap.values());

      // Filtrer les devis sans les prestataires demo
      const validQuotes = quotesRaw.data?.filter(quote => {
        const supplierName = quote.supplier?.company_name?.toLowerCase() || '';
        const isDemo = supplierName.includes('demo') || 
                      supplierName.includes('test') || 
                      supplierName.includes('exemple') ||
                      supplierName.includes('sample');
        return !isDemo && quote.supplier;
      }) || [];

      const stats = {
        totalClients,
        activeClients,
        completedClients,
        totalSuppliers: uniqueSuppliers.length,
        activeSuppliers: uniqueSuppliers.filter(s => s.is_active).length,
        totalQuotes: validQuotes.length,
        pendingQuotes: validQuotes.filter(q => q.status === 'pending').length,
        acceptedQuotes: validQuotes.filter(q => q.status === 'accepted').length,
      };

      console.log('✅ Statistiques chargées (sans demo):', stats);
      return stats;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!user,
  });

  const handleKeyboard = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      setShowCreateDialog(true);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${theme === 'dark' ? 'dark' : ''}`}>
      <header className="border-b border-border bg-card p-4 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold">Pricing Tool</h1>
                <p className="text-sm text-muted-foreground">MatchMove quotation system</p>
              </div>
            </div>
            
            {!statsLoading && stats && (
              <div className="hidden md:flex items-center gap-4 ml-8">
                <Badge variant="outline" className="text-xs">
                  {stats.activeClients}/{stats.totalClients} clients actifs
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.activeSuppliers}/{stats.totalSuppliers} prestataires
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.pendingQuotes} devis en attente
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.completedClients} terminés
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Nouvelle opportunité
              <kbd className="hidden sm:inline-flex ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Ctrl+N
              </kbd>
            </Button>
            
            <span className="text-sm font-medium">{user?.email}</span>
            <button 
              onClick={() => window.close()} 
              className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
            >
              Retour à l'App
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Tableau de bord des devis</h2>
          <p className="text-muted-foreground">
            Générez des devis compétitifs, gérez vos clients et prestataires, consultez l'historique.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-8 h-12">
            <TabsTrigger value="opportunities" className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
              {stats?.activeClients > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.activeClients}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2 text-sm">
              <Users2 className="h-4 w-4" />
              <span className="hidden sm:inline">Prestataires</span>
              {stats?.activeSuppliers > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.activeSuppliers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Moteur de devis</span>
              {stats?.pendingQuotes > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.pendingQuotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Devis acceptés</span>
              {stats?.acceptedQuotes > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.acceptedQuotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-sm">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
              {stats?.completedClients > 0 && (
                <Badge variant="outline" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.completedClients}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-6">
            <OpportunitiesTab />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <SuppliersTab />
          </TabsContent>

          <TabsContent value="quotes" className="space-y-6">
            <QuotesTab />
          </TabsContent>

          <TabsContent value="accepted" className="space-y-6">
            <AcceptedQuotesTab />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab />
          </TabsContent>
        </Tabs>

        {/* Coming Soon Features */}
        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Fonctionnalités à venir</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Suggestions de prix IA</span>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Éditeur de formules dynamiques</span>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Comparaison visuelle des devis</span>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Portail prestataire sécurisé</span>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Exports PDF et rapports Excel</span>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Support multi-langues (FR/EN/DE)</span>
            </div>
          </div>
        </div>
      </main>

      <CreateOpportunityDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};

export default PricingTool;
