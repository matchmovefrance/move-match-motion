
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'demenageur';
  company_name?: string;
  created_at: string;
}

// Function to validate and sanitize profile data
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
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter and sanitize profiles with valid roles
      const sanitizedUsers = (data || [])
        .map(sanitizeProfile)
        .filter((profile): profile is Profile => profile !== null);
      
      setUsers(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      // Use regular signup instead of admin.createUser
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

      // If signup succeeded, manually create/update the profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            role: newUser.role,
            company_name: newUser.company_name || null
          });

        if (profileError) throw profileError;
      }

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
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

  const deleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      // Note: We can only delete the profile, not the auth user without admin privileges
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
        <Button
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {showAddUser && (
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
        {users.map((user) => (
          <motion.div
            key={user.id}
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
                  <h3 className="font-semibold text-gray-800">{user.email}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.company_name && (
                      <span className="text-sm text-gray-600">{user.company_name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteUser(user.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
