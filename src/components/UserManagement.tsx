import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Mail, Shield, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListView } from '@/components/ui/list-view';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: string | null;
  created_at: string;
}

const UserManagement = () => {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'agent'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les utilisateurs: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!loggedInUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un utilisateur",
        variant: "destructive",
      });
      return;
    }

    // Validation des champs obligatoires
    if (!newUser.email.trim() || !newUser.password.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    try {
      // Créer l'utilisateur via l'admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password.trim(),
        user_metadata: { role: newUser.role }
      });

      if (error) {
        console.error('Supabase error creating user:', error);
        throw error;
      }

      const newUserId = data.user?.id;

      // Créer un profil utilisateur associé
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          email: newUser.email.trim().toLowerCase(),
          role: newUser.role,
        });

      if (profileError) {
        console.error('Supabase error creating profile:', profileError);
        // Supprimer l'utilisateur créé si la création du profil échoue
        await supabase.auth.admin.deleteUser(newUserId!);
        throw profileError;
      }

      toast({
        title: "Succès",
        description: "Utilisateur ajouté avec succès",
      });

      setNewUser({ email: '', password: '', role: 'agent' });
      setShowAddForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      
      let errorMessage = "Impossible d'ajouter l'utilisateur";
      
      if (error.code === '23505') {
        errorMessage = "Un utilisateur avec cette adresse email existe déjà";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      // Mettre à jour le rôle de l'utilisateur dans la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: editingUser.role })
        .eq('id', editingUser.id);

      if (profileError) {
        console.error('Error updating user role:', profileError);
        throw profileError;
      }

      toast({
        title: "Succès",
        description: "Rôle de l'utilisateur mis à jour avec succès",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le rôle de l'utilisateur: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('Deleting user:', userId);
      
      // Supprimer d'abord le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      // Ensuite supprimer l'utilisateur du système d'authentification via l'admin API
      const { data, error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        throw authError;
      }

      // Mettre à jour l'état local immédiatement après la suppression réussie
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.filter(u => u.id !== userId);
        console.log('Updated users list:', updatedUsers);
        return updatedUsers;
      });

      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès de la base de données et de l'application",
      });

    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'utilisateur: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const renderUserCard = (user: User) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">{user.email}</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Role: {user.role}</span>
            </div>
            <div className="text-xs text-gray-400 mt-3">
              Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingUser(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer l'utilisateur {user.email} ? 
                  Cette action supprimera définitivement l'utilisateur de la base de données et de l'application.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteUser(user.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );

  const renderUserListItem = (user: User) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{user.email}</h4>
            <p className="text-sm text-gray-600">Role: {user.role}</p>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(user.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditingUser(user)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'utilisateur {user.email} ? 
                Cette action supprimera définitivement l'utilisateur de la base de données et de l'application.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUser(user.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

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
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingUser) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Email"
              type="email"
              value={editingUser ? editingUser.email : newUser.email}
              onChange={(e) => editingUser 
                ? setEditingUser({...editingUser, email: e.target.value})
                : setNewUser({...newUser, email: e.target.value})
              }
              disabled={!!editingUser}
            />
            {!editingUser && (
              <Input
                placeholder="Mot de passe"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            )}
            <Select onValueChange={(value) => {
              if (editingUser) {
                setEditingUser({...editingUser, role: value})
              } else {
                setNewUser({...newUser, role: value})
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un rôle" defaultValue={editingUser?.role || newUser.role} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="demenageur">Déménageur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={editingUser ? updateUser : addUser}>
              {editingUser ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setEditingUser(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      {/* ListView with search and pagination */}
      <ListView
        items={users}
        searchFields={['email', 'role']}
        renderCard={renderUserCard}
        renderListItem={renderUserListItem}
        searchPlaceholder="Rechercher par email ou rôle..."
        emptyStateMessage="Aucun utilisateur trouvé"
        emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default UserManagement;
