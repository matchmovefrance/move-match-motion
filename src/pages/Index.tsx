
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Truck, ArrowRight, LogOut, Activity, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import MatchFinder from '../components/MatchFinder';
import MoveManagement from '../components/MoveManagement';
import ClientList from '../components/ClientList';
import MoverList from '../components/MoverList';
import UserManagement from '../components/UserManagement';
import MoverCalendar from '../components/MoverCalendar';
import GoogleMap from '../components/GoogleMap';
import PublicLinkManager from '../components/PublicLinkManager';
import ServiceProviders from '../components/ServiceProviders';
import Analytics from '../components/Analytics';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    confirmedMoves: 0,
    activeClients: 0,
    foundMatches: 0,
    optimizedVolume: 0
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      // Get confirmed moves
      const { data: moves } = await supabase
        .from('confirmed_moves')
        .select('used_volume');

      // Get active clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id');

      // Get matches
      const { data: matches } = await supabase
        .from('move_matches')
        .select('id');

      // Calculate stats
      const confirmedMoves = moves?.length || 0;
      const activeClients = clients?.length || 0;
      const foundMatches = matches?.length || 0;
      const optimizedVolume = moves?.reduce((sum, move) => sum + (Number(move.used_volume) || 0), 0) || 0;

      setStats({
        confirmedMoves,
        activeClients,
        foundMatches,
        optimizedVolume
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const realStats = [
    { label: 'Trajets confirmés', value: stats.confirmedMoves.toString(), icon: Truck, color: 'blue' },
    { label: 'Clients actifs', value: stats.activeClients.toString(), icon: Users, color: 'green' },
    { label: 'Matchs trouvés', value: stats.foundMatches.toString(), icon: Search, color: 'purple' },
    { label: 'Volume optimisé', value: `${stats.optimizedVolume.toFixed(1)}m³`, icon: MapPin, color: 'orange' },
  ];

  const getTabsForRole = () => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: MapPin },
    ];

    if (profile?.role === 'admin') {
      return [
        ...baseTabs,
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'matching', label: 'Matching', icon: Search },
        { id: 'moves', label: 'Déménagements', icon: Truck },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'movers', label: 'Déménageurs', icon: Truck },
        { id: 'providers', label: 'Prestataires', icon: MapPin },
        { id: 'users', label: 'Utilisateurs', icon: Settings },
        { id: 'public-links', label: 'Liens publics', icon: Search },
      ];
    } else if (profile?.role === 'agent') {
      return [
        ...baseTabs,
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'matching', label: 'Matching', icon: Search },
        { id: 'moves', label: 'Déménagements', icon: Truck },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'movers', label: 'Déménageurs', icon: Truck },
        { id: 'providers', label: 'Prestataires', icon: MapPin },
        { id: 'public-links', label: 'Liens publics', icon: Search },
      ];
    } else if (profile?.role === 'demenageur') {
      return [
        { id: 'calendar', label: 'Mon Agenda', icon: Calendar },
      ];
    }
    return baseTabs;
  };

  const tabs = getTabsForRole();

  // Set default tab based on role
  useEffect(() => {
    if (profile?.role === 'demenageur') {
      setActiveTab('calendar');
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="https://matchmove.fr/wp-content/uploads/2024/02/Logo-Matchmove-e1709213815530.png" 
                  alt="MatchMove Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MatchMove.io
                </h1>
                <p className="text-xs text-gray-600">{profile?.role} - {profile?.email}</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              {/* Compact navigation for large menus */}
              <nav className="hidden md:flex space-x-1 bg-gray-100 rounded-lg p-1 max-w-4xl overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                    }`}
                  >
                    <tab.icon className="h-3 w-3" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
              
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && profile?.role !== 'demenageur' && (
            <motion.div
              key="dashboard"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {/* Welcome Section */}
              <div className="mb-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-gray-800 mb-2"
                >
                  Tableau de bord
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600"
                >
                  Optimisez vos déménagements grâce à notre algorithme de matching intelligent
                </motion.p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {realStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 3) }}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Google Map */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Carte des trajets</h3>
                <GoogleMap />
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Analytics />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <MoverCalendar />
            </motion.div>
          )}

          {activeTab === 'matching' && (
            <motion.div
              key="matching"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <MatchFinder />
            </motion.div>
          )}

          {activeTab === 'moves' && (
            <motion.div
              key="moves"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <MoveManagement />
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div
              key="clients"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ClientList />
            </motion.div>
          )}

          {activeTab === 'movers' && (
            <motion.div
              key="movers"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <MoverList />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <UserManagement />
            </motion.div>
          )}

          {activeTab === 'providers' && (
            <motion.div
              key="providers"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ServiceProviders />
            </motion.div>
          )}

          {activeTab === 'public-links' && (
            <motion.div
              key="public-links"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <PublicLinkManager />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
