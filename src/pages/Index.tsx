
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Truck, Target, MapPin, Map, Calendar, UserCog, Link } from 'lucide-react';
import Analytics from '@/components/Analytics';
import ClientList from '@/components/ClientList';
import MoveManagement from '@/components/MoveManagement';
import MatchFinder from '@/components/MatchFinder';
import ServiceProviders from '@/components/ServiceProviders';
import GoogleMap from '@/components/GoogleMap';
import MoverCalendar from '@/components/MoverCalendar';
import UserManagement from '@/components/UserManagement';
import PublicLinkManager from '@/components/PublicLinkManager';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
    }
  }, [user, profile, navigate]);

  if (!user || !profile) {
    return null;
  }

  const renderTabComponent = (tabId: string) => {
    switch (tabId) {
      case 'analytics': return <Analytics />;
      case 'clients': return <ClientList />;
      case 'moves': return <MoveManagement />;
      case 'matching': return <MatchFinder />;
      case 'providers': return <ServiceProviders />;
      case 'map': return <GoogleMap />;
      case 'calendar': return <MoverCalendar />;
      case 'users': return <UserManagement />;
      case 'links': return <PublicLinkManager />;
      default: return <div>Contenu de l'onglet non trouvé.</div>;
    }
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: Analytics },
    { id: 'clients', label: 'Clients', icon: Users, component: ClientList },
    { id: 'moves', label: 'Déménagements', icon: Truck, component: MoveManagement },
    { id: 'matching', label: 'Matching', icon: Target, component: MatchFinder },
    { id: 'providers', label: 'Prestataires', icon: MapPin, component: ServiceProviders },
    { id: 'map', label: 'Carte', icon: Map, component: GoogleMap },
    { id: 'calendar', label: 'Calendrier', icon: Calendar, component: MoverCalendar },
    ...(profile?.role === 'admin' ? [
      { id: 'users', label: 'Utilisateurs', icon: UserCog, component: UserManagement },
      { id: 'links', label: 'Liens publics', icon: Link, component: PublicLinkManager }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12">
        {/* Barre de navigation */}
        <nav className="flex space-x-4 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`group flex items-center space-x-2 px-4 py-2 rounded-md text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Contenu de l'onglet actif */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {renderTabComponent(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default Index;
