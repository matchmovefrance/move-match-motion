
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RoleDebugPanel = () => {
  const { user, profile } = useAuth();

  const getRoleDisplay = (role: string, email: string) => {
    if (role === 'admin') {
      return 'Administrateur';
    }
    
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrateur',
      'agent': 'Agent',
      'client': 'Client',
      'demenageur': 'Déménageur',
      'service_provider': 'Prestataire'
    };
    
    return roleMap[role] || role;
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <Card className="mb-6 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Debug: Informations Utilisateur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">ID Utilisateur</p>
            <p className="text-gray-900 font-mono text-xs">{user?.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Rôle (DB)</p>
            <Badge variant="outline">{profile?.role || 'Non défini'}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Rôle (Affiché)</p>
            <Badge className={isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
              {profile?.role ? getRoleDisplay(profile.role, user?.email || '') : 'Chargement...'}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Entreprise</p>
            <p className="text-gray-900">{profile?.company_name || 'Non défini'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Est Admin</p>
            <Badge className={isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {isAdmin ? 'Oui' : 'Non'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleDebugPanel;
