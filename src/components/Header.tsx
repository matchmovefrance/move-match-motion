
import { LogOut, User, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleDisplay = (role: string, email: string) => {
    // Emails admin hardcodés
    if (email === 'contact@matchmove.fr' || email === 'pierre@matchmove.fr') {
      return 'Administrateur';
    }
    
    // Mapping des rôles
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrateur',
      'agent': 'Agent',
      'client': 'Client',
      'demenageur': 'Déménageur',
      'service_provider': 'Prestataire'
    };
    
    return roleMap[role] || role;
  };

  const openPricingTool = () => {
    window.open('/pricing-tool', '_blank');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="https://matchmove.fr/wp-content/uploads/2024/02/Logo-Matchmove-e1709213815530.png" 
            alt="MatchMove Logo" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Matchmove.io</h1>
            <p className="text-sm text-gray-500">Gestion de Déménagements</p>
          </div>
        </div>

        
        <div className="flex items-center space-x-4">
          {/* Tools Menu */}
          {(user?.email && profile?.role !== 'demenageur') && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors"
              >
                <span className="h-3.5 w-3.5 text-center">🎯</span>
                Matching
              </button>
              
              <button 
                onClick={() => window.open('/pricing-tool', '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
              >
                <CircleDollarSign className="h-3.5 w-3.5" />
                Devis
              </button>
              
              <button 
                onClick={() => window.open('/volume-calculator', '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50 transition-colors"
              >
                <span className="h-3.5 w-3.5 text-center">📏</span>
                Volume
              </button>

              <button 
                onClick={() => window.open('/truck-optimizer', '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-md hover:bg-orange-50 transition-colors"
              >
                <span className="h-3.5 w-3.5 text-center">📦</span>
                3D
              </button>
            </div>
          )}

          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500">
              {profile?.role ? getRoleDisplay(profile.role, user?.email || '') : 'Chargement...'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user?.email ? getInitials(user.email) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
