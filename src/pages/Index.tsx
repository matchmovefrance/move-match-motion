
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Truck, Target, Map, Settings, Calendar, TrendingUp, Shield, Calculator, Package } from 'lucide-react';
import Analytics from '@/components/Analytics';
import ClientList from '@/components/ClientList';
import MoveManagement from '@/components/MoveManagement';
import MatchFinder from '@/components/MatchFinder';
import MatchAnalytics from '@/components/MatchAnalytics';
import ServiceProviders from '@/components/ServiceProviders';
import GoogleMap from '@/components/GoogleMap';
import { MoverCalendarTab } from '@/components/MoverCalendarTab';
import UserManagement from '@/components/UserManagement';
import PublicLinkManager from '@/components/PublicLinkManager';
import AdminActions from '@/components/AdminActions';
import DiagnosticTab from '@/components/DiagnosticTab';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Set default tab based on user role
    if (profile?.role === 'demenageur') {
      setActiveTab('calendar');
    }
  }, [user, profile, navigate]);

  if (!user) {
    return null;
  }

  const handlePricingToolClick = () => {
    window.open('/pricing-tool', '_blank');
  };

  const handleVolumeCalculatorClick = () => {
    window.open('/volume-calculator', '_blank');
  };

  const handleTruckOptimizerClick = () => {
    window.open('/truck-optimizer', '_blank');
  };

  const renderTabComponent = (tabId: string) => {
    switch (tabId) {
      case 'analytics': return <Analytics />;
      case 'clients': return <ClientList />;
      case 'moves': return <MoveManagement />;
      case 'matching': return <MatchFinder />;
      case 'match-analytics': return <MatchAnalytics />;
      case 'providers': return <ServiceProviders />;
      case 'map': return <GoogleMap />;
      case 'calendar': return <MoverCalendarTab />;
      case 'diagnostic': return <DiagnosticTab />;
      case 'admin-actions': return <AdminActions />;
      case 'management': 
        return (
          <div className="space-y-8">
            {/* Seuls les admins voient la gestion des utilisateurs */}
            {(profile?.role === 'admin') && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h2>
                <UserManagement />
              </div>
            )}
            {/* Admins et agents voient les liens publics */}
            {(profile?.role === 'admin' || profile?.role === 'agent') && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Liens Publics</h2>
                <PublicLinkManager />
              </div>
            )}
          </div>
        );
      default: return <div>Contenu de l'onglet non trouvé.</div>;
    }
  };

  const getTabs = () => {
    // Admins complets 
    const isFullAdmin = profile?.role === 'admin';
    
    if (profile?.role === 'demenageur') {
      // Déménageur users only see the calendar
      return [
        { id: 'calendar', label: 'Mon Planning', icon: Calendar }
      ];
    }

    // Tabs de base pour admin et agent
    const baseTabs = [
      { id: 'analytics', label: 'Tableau de bord', icon: BarChart3 },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'moves', label: 'Déménagements', icon: Truck },
      { id: 'matching', label: 'Matching', icon: Target },
      { id: 'match-analytics', label: 'Analytics Matchs', icon: TrendingUp },
      { id: 'providers', label: 'Prestataires', icon: Settings },
      { id: 'map', label: 'Carte', icon: Map },
      { id: 'diagnostic', label: 'Diagnostic', icon: Shield },
    ];

    // Les agents et admins voient la gestion (mais contenu différent)
    if (profile?.role === 'admin' || profile?.role === 'agent') {
      baseTabs.push({ id: 'management', label: 'Gestion', icon: Settings });
    }

    // Seuls les admins complets voient les actions admin
    if (isFullAdmin) {
      baseTabs.push({ id: 'admin-actions', label: 'Admin', icon: Shield });
    }

    return baseTabs;
  };

  const tabs = getTabs();

  return (
    <div className="container mx-auto py-8">

      {/* Navigation */}
      <nav className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`group flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Contenu de l'onglet actif */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        {renderTabComponent(activeTab)}
      </div>
    </div>
  );
};

export default Index;
