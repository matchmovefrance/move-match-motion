
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Truck, Target, Map, Settings } from 'lucide-react';
import Analytics from '@/components/Analytics';
import ClientList from '@/components/ClientList';
import MoveManagement from '@/components/MoveManagement';
import MatchFinder from '@/components/MatchFinder';
import ServiceProviders from '@/components/ServiceProviders';
import GoogleMap from '@/components/GoogleMap';
import MoverCalendar from '@/components/MoverCalendar';
import UserManagement from '@/components/UserManagement';
import PublicLinkManager from '@/components/PublicLinkManager';
import Header from '@/components/Header';
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
      case 'map': return <GoogleMap />;
      case 'management': 
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Gestion des Services</h2>
              <ServiceProviders />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">Calendrier</h2>
              <MoverCalendar />
            </div>
            {profile?.role === 'admin' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h2>
                  <UserManagement />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-6">Liens Publics</h2>
                  <PublicLinkManager />
                </div>
              </>
            )}
          </div>
        );
      default: return <div>Contenu de l'onglet non trouvé.</div>;
    }
  };

  const tabs = [
    { id: 'analytics', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'moves', label: 'Déménagements', icon: Truck },
    { id: 'matching', label: 'Matching', icon: Target },
    { id: 'map', label: 'Carte', icon: Map },
    { id: 'management', label: 'Gestion', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-8">
        {/* Navigation */}
        <nav className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`group flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
    </div>
  );
};

export default Index;
