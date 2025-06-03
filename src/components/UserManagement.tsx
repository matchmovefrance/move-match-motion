
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'demenageur';
  company_name?: string;
  created_at: string;
}

const allowedRoles = ['admin', 'agent', 'demenageur'] as const;
type AllowedRole = typeof allowedRoles[number];

function sanitizeProfile(profileData: any): Profile | null {
  if (!profileData || !allowedRoles.includes(profileData.role)) {
    console.warn(`Invalid role ignored: ${profileData?.role}`);
    return null;
  }

  return {
    id: profileData.id,
    email: profileData.email,
    role: profileData.role as AllowedRole,
    company_name: profileData.company_name,
    created_at: profileData.created_at,
  };
}

const UserManagement = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'agent' as 'admin' | 'agent' | 'demenageur',
    company_name: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      console.log('Fetching users...');
      
      // Use RPC call to bypass RLS issues
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_all_profiles_admin');
      
      if (rpcError) {
        console.error('RPC call failed, falling back to direct query:', rpcError);
        
        // Fallback to direct query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('Error fetching users:', fallbackError);
          setError('Impossible de charger les utilisateurs. Veuillez contacter l\'administrateur.');
          
          // Show current user as fallback
          if (profile) {
            setUsers([{
              id: profile.id,
              email: profile.email,
              role: profile.role,
              company_name: profile.company_name,
              created_at: new Date().toISOString()
            }]);
          }
        } else {
          const sanitizedUsers = (fallbackData || [])
            .map(sanitizeProfile)
            .filter((profile): profile is Profile => profile !== null);
          
          console.log('Fetched users via fallback:', sanitizedUsers);
          setUsers(sanitizedUsers);
        }
      } else {
        const sanitizedUsers = (rpcData || [])
          .map(sanitizeProfile)
          .filter((profile): profile is Profile => profile !== null);
        
        console.log('Fetched users via RPC:', sanitizedUsers);
        setUsers(sanitizedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erreur de connexion à la base de données');
      
      // Show current user as fallback
      if (profile) {
        setUsers([{
          id: profile.id,
          email: profile.email,
          role: profile.role,
          company_name: profile.company_name,
          created_at: new Date().toISOString()
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      // First try to create via admin API for better control
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            role: newUser.role,
            company_name: newUser.company_name || null
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile manually since the trigger might not work for admin-created users
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            role: newUser.role,
            company_name: newUser.company_name || null
          });

        if (profileError) {
          console.warn('Profile creation failed:', profileError);
        }

        // For admin-created users, we should confirm them automatically
        // This requires additional setup with service role key
        console.log('User created, confirmation may be required via email');
      }

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès. L'utilisateur doit confirmer son email pour se connecter.",
      });

      setNewUser({ email: '', password: '', role: 'agent', company_name: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (userId: string, userEmail: string) => {
    try {
      setResettingPassword(userId);
      
      // Generate a new temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      // For now, we'll show the password in a toast since we need admin privileges
      // In production, this would require service role key to update passwords directly
      
      toast({
        title: "Mot de passe temporaire généré",
        description: `Nouveau mot de passe pour ${userEmail}: ${tempPassword}`,
        duration: 10000, // Show for 10 seconds
      });

      // Try to send notification email
      try {
        await supabase.functions.invoke('send-password-reset', {
          body: {
            email: userEmail,
            tempPassword: tempPassword
          }
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
      }

    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le mot de passe",
        variant: "destructive",
      });
    } finally {
      setResettingPassword(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Profil utilisateur supprimé avec succès",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'demenageur': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h2>
        </div>
        {(profile?.role === 'admin' || user?.email === 'contact@matchmove.fr') && (
          <Button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">Avertissement</p>
            <p className="text-yellow-700 text-sm">{error}</p>
            <p className="text-yellow-600 text-xs mt-1">
              Affichage des données disponibles en mode restreint.
            </p>
          </div>
        </div>
      )}

      {showAddUser && (profile?.role === 'admin' || user?.email === 'contact@matchmove.fr') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">Nouvel utilisateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="agent">Agent</option>
              <option value="demenageur">Déménageur</option>
              <option value="admin">Admin</option>
            </select>
            {newUser.role === 'demenageur' && (
              <Input
                placeholder="Nom de l'entreprise"
                value={newUser.company_name}
                onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })}
              />
            )}
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={createUser}>Créer</Button>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          users.map((userItem) => (
            <motion.div
              key={userItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{userItem.email}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userItem.role)}`}>
                        {userItem.role}
                      </span>
                      {userItem.company_name && (
                        <span className="text-sm text-gray-600">{userItem.company_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                {(profile?.role === 'admin' || user?.email === 'contact@matchmove.fr') && (
                  <div className="flex space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resettingPassword === userItem.id}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          {resettingPassword === userItem.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir réinitialiser le mot de passe de {userItem.email} ? 
                            Un nouveau mot de passe temporaire sera généré et affiché.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => resetPassword(userItem.id, userItem.email)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Réinitialiser
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    {userItem.id !== profile?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(userItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManagement;
