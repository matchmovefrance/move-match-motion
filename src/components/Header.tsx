
import { LogOut, User } from 'lucide-react';
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <img 
              src="https://matchmove.fr/wp-content/uploads/2024/02/Logo-Matchmove-e1709213815530.png" 
              alt="MatchMove Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">MatchMove</h1>
              <p className="text-sm text-gray-500">Gestion de Déménagements</p>
            </div>
          </div>
          
          <img 
            src="https://cdn.shopify.com/s/files/1/2412/8291/files/Trustpilot-for-mobile.png?v=1660896135" 
            alt="Trustpilot" 
            className="h-10 w-auto"
          />
        </div>

        <div className="flex items-center space-x-4">
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
