
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
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

const UserManagement = () => {
  const { user: loggedInUser, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'agent',
    company_name: ''
  });
  const { toast } = useToast();

  // Vérifier si l'utilisateur connecté est admin
  const isAdmin = profile?.role === 'admin' || loggedInUser?.email === 'contact@matchmove.fr';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      
      if (!isAdmin) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être administrateur pour voir les utilisateurs",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Utiliser la fonction sécurisée get_all_profiles
      const { data, error } = await supabase.rpc('get_all_profiles');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Users fetched successfully:', data);
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      let errorMessage = "Impossible de charger les utilisateurs";
      
      if (error.message?.includes('Access denied')) {
        errorMessage = "Accès refusé : vous devez être administrateur pour voir les utilisateurs";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!loggedInUser || !isAdmin) {
      toast({
        title: "Erreur",
        description: "Vous devez être administrateur pour ajouter un utilisateur",
        variant: "destructive",
      });
      return;
    }

    // Validation des champs obligatoires
    if (!newUser.email.trim() || !newUser.password.trim()) {
      toast({
        title: "Erreur",
        description: "L'email et le mot de passe sont obligatoires",
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

    // Validation mot de passe
    if (newUser.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating user:', { email: newUser.email, role: newUser.role });
      
      // Créer l'utilisateur via l'API auth de Supabase
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password.trim(),
        options: {
          data: { 
            role: newUser.role,
            company_name: newUser.company_name.trim() || null
          }
        }
      });

      if (error) {
        console.error('Supabase error creating user:', error);
        throw error;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);

        toast({
          title: "Succès",
          description: "Utilisateur ajouté avec succès",
        });

        setNewUser({ email: '', password: '', role: 'agent', company_name: '' });
        setShowAddForm(false);
        
        // Attendre un peu avant de recharger la liste pour que le trigger se soit exécuté
        setTimeout(() => {
          fetchUsers();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      
      let errorMessage = "Impossible d'ajouter l'utilisateur";
      
      if (error.code === '23505') {
        errorMessage = "Un utilisateur avec cette adresse email existe déjà";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Un utilisateur avec cette adresse email existe déjà";
      } else if (error.message?.includes('Signup is disabled')) {
        errorMessage = "L'inscription est désactivée. Veuillez contacter l'administrateur.";
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
    if (!editingUser || !isAdmin) {
      toast({
        title: "Erreur",
        description: "Vous devez être administrateur pour modifier un utilisateur",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Updating user:', editingUser.id, editingUser.role);
      
      // Mettre à jour le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: editingUser.role,
          company_name: editingUser.company_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (profileError) {
        console.error('Error updating user:', profileError);
        throw profileError;
      }

      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour l'utilisateur: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast({
        title: "Erreur",
        description: "Vous devez être administrateur pour supprimer un utilisateur",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Deleting user and all associated data:', userId);
      
      // Utiliser la fonction delete_user_and_data sécurisée
      const { error: functionError } = await supabase.rpc('delete_user_and_data', {
        user_uuid: userId
      });

      if (functionError) {
        console.error('Error calling delete_user_and_data function:', functionError);
        throw functionError;
      }

      toast({
        title: "Succès",
        description: "Utilisateur et toutes ses données supprimés avec succès",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      let errorMessage = "Impossible de supprimer l'utilisateur";
      if (error.message?.includes('Access denied')) {
        errorMessage = "Accès refusé : vous devez être administrateur pour supprimer des utilisateurs";
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
              <span>Rôle: {user.role || 'Non défini'}</span>
            </div>
            {user.company_name && (
              <div className="text-sm text-gray-600">
                Entreprise: {user.company_name}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-3">
              Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
        
        {isAdmin && (
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
                    Cette action supprimera définitivement l'utilisateur et toutes ses données associées.
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
        )}
      </div>
    </motion.div>
  );

  const renderUserListItem = (user: User) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{user.email}</h4>
            <p className="text-sm text-gray-600">Rôle: {user.role || 'Non défini'}</p>
            {user.company_name && (
              <p className="text-xs text-gray-500">Entreprise: {user.company_name}</p>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(user.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
      {isAdmin && (
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
                  Cette action supprimera définitivement l'utilisateur et toutes ses données associées.
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
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Accès refusé</h3>
        <p className="text-gray-600 text-center">
          Vous devez être administrateur pour accéder à la gestion des utilisateurs.
        </p>
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
              placeholder="Email *"
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
                placeholder="Mot de passe (min. 6 caractères) *"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            )}
            <Input
              placeholder="Nom de l'entreprise"
              value={editingUser ? (editingUser.company_name || '') : newUser.company_name}
              onChange={(e) => editingUser 
                ? setEditingUser({...editingUser, company_name: e.target.value})
                : setNewUser({...newUser, company_name: e.target.value})
              }
            />
            <Select 
              value={editingUser?.role || newUser.role}
              onValueChange={(value) => {
                if (editingUser) {
                  setEditingUser({...editingUser, role: value})
                } else {
                  setNewUser({...newUser, role: value})
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un rôle" />
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

      {/* Status info */}
      {users.length === 0 && !loading && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-gray-600">
            Commencez par ajouter des utilisateurs à votre système.
          </p>
        </div>
      )}

      {/* ListView with search and pagination */}
      {users.length > 0 && (
        <ListView
          items={users}
          searchFields={['email', 'role', 'company_name']}
          renderCard={renderUserCard}
          renderListItem={renderUserListItem}
          searchPlaceholder="Rechercher par email, rôle ou entreprise..."
          emptyStateMessage="Aucun utilisateur trouvé"
          emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
          itemsPerPage={10}
        />
      )}
    </div>
  );
};

export default UserManagement;
