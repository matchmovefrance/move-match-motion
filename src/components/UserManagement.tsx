import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Mail, Shield, Edit, Trash2, Key, RefreshCw } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SyncStatusDialog from './SyncStatusDialog';

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
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'agent',
    company_name: ''
  });
  const [tempPassword, setTempPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Seuls les admins complets (emails hardcodés) peuvent gérer les utilisateurs
  const isFullAdmin = loggedInUser?.email === 'contact@matchmove.fr' || loggedInUser?.email === 'pierre@matchmove.fr';

  useEffect(() => {
    if (isFullAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isFullAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users from database...');
      
      if (!isFullAdmin) {
        console.log('Not full admin, skipping fetch');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_all_profiles');

      if (error) {
        console.error('❌ Error fetching users:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs",
          variant: "destructive",
        });
        setUsers([]);
      } else {
        console.log('✅ Users fetched from DB:', data?.length || 0);
        setUsers(data || []);
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des utilisateurs",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateUserForm = () => {
    if (!newUser.email.trim() || !newUser.password.trim()) {
      toast({
        title: "Erreur",
        description: "L'email et le mot de passe sont obligatoires",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Erreur",
        description: "Adresse email invalide",
        variant: "destructive",
      });
      return false;
    }

    if (newUser.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateEditForm = (user: User) => {
    if (!user.role?.trim()) {
      toast({
        title: "Erreur",
        description: "Le rôle est obligatoire",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const addUser = async () => {
    if (!isFullAdmin) {
      toast({
        title: "Erreur",
        description: "Accès refusé",
        variant: "destructive",
      });
      return;
    }

    if (!validateUserForm()) return;

    try {
      setIsSubmitting(true);
      console.log('📝 Creating user:', newUser.email);
      
      const { data, error } = await supabase.functions.invoke('confirm-user-signup', {
        body: {
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password.trim(),
          role: newUser.role,
          company_name: newUser.company_name.trim() || null
        }
      });

      if (error) {
        console.error('❌ Error creating user:', error);
        throw error;
      }

      if (data?.success) {
        console.log('✅ User created successfully');
        toast({
          title: "Succès",
          description: `L'utilisateur ${newUser.email} a été créé avec succès`,
        });

        setNewUser({ email: '', password: '', role: 'agent', company_name: '' });
        setShowAddForm(false);
        
        // Refresh the user list
        setTimeout(() => {
          fetchUsers();
        }, 1000);
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('❌ Error adding user:', error);
      
      let errorMessage = "Impossible d'ajouter l'utilisateur";
      
      if (error.message?.includes('User already registered') || error.message?.includes('already been registered')) {
        errorMessage = "Un utilisateur avec cette adresse email existe déjà";
      } else if (error.message?.includes('password')) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUser = async () => {
    if (!editingUser || !isFullAdmin) {
      toast({
        title: "Erreur",
        description: "Accès refusé",
        variant: "destructive",
      });
      return;
    }

    if (!validateEditForm(editingUser)) return;

    try {
      setIsSubmitting(true);
      console.log('✏️ Updating user:', editingUser.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: editingUser.role,
          company_name: editingUser.company_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('❌ Error updating user:', error);
        throw error;
      }

      console.log('✅ User updated successfully');
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetUserPassword = async () => {
    if (!resetPasswordUser || !isFullAdmin) {
      toast({
        title: "Erreur",
        description: "Accès refusé",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔑 Resetting password for user:', resetPasswordUser.id);
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: resetPasswordUser.id,
          userEmail: resetPasswordUser.email
        }
      });

      if (error) {
        console.error('❌ Error resetting password:', error);
        throw error;
      }

      if (data?.success) {
        setTempPassword(data.tempPassword);
        console.log('✅ Password reset successfully');
        toast({
          title: "Succès",
          description: "Mot de passe réinitialisé avec succès",
        });
      } else {
        throw new Error(data?.error || 'Erreur lors de la réinitialisation');
      }
    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      toast({
        title: "Erreur",
        description: `Impossible de réinitialiser le mot de passe: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isFullAdmin) {
      toast({
        title: "Erreur",
        description: "Accès refusé",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🗑️ Deleting user:', userId);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: userId
        }
      });

      if (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
      }

      if (data?.success) {
        console.log('✅ User deleted successfully');
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
        });

        // Mettre à jour l'état local immédiatement
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      } else {
        throw new Error(data?.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncComplete = () => {
    setShowSyncDialog(false);
    fetchUsers();
    toast({
      title: "Succès",
      description: "Synchronisation terminée avec succès",
    });
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
        
        {isFullAdmin && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(user)}
              disabled={isSubmitting}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetPasswordUser(user)}
                  className="text-orange-600 hover:text-orange-700"
                  disabled={isSubmitting}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                  <DialogDescription>
                    Générer un nouveau mot de passe temporaire pour {user.email}
                  </DialogDescription>
                </DialogHeader>
                {tempPassword && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-medium text-yellow-800">Nouveau mot de passe temporaire:</p>
                    <p className="text-yellow-900 font-mono bg-yellow-100 p-2 rounded mt-2 break-all">
                      {tempPassword}
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      Communiquez ce mot de passe à l'utilisateur. Il peut maintenant se connecter avec ce mot de passe.
                    </p>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setResetPasswordUser(null);
                      setTempPassword('');
                    }}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Fermer
                  </Button>
                  <Button 
                    onClick={resetUserPassword}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {user.email} ? Cette action supprimera complètement l'utilisateur et toutes ses données de tous les systèmes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteUser(user.id)}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Suppression...' : 'Supprimer'}
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
      {isFullAdmin && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingUser(user)}
            disabled={isSubmitting}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetPasswordUser(user)}
                className="text-orange-600 hover:text-orange-700"
                disabled={isSubmitting}
              >
                <Key className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                <DialogDescription>
                  Générer un nouveau mot de passe temporaire pour {user.email}
                </DialogDescription>
              </DialogHeader>
              {tempPassword && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800">Nouveau mot de passe temporaire:</p>
                  <p className="text-yellow-900 font-mono bg-yellow-100 p-2 rounded mt-2 break-all">
                    {tempPassword}
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Communiquez ce mot de passe à l'utilisateur. Il peut maintenant se connecter avec ce mot de passe.
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button
                  onClick={() => {
                    setResetPasswordUser(null);
                    setTempPassword('');
                  }}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Fermer
                </Button>
                <Button 
                  onClick={resetUserPassword}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                disabled={isSubmitting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer {user.email} ? Cette action supprimera complètement l'utilisateur et toutes ses données de tous les systèmes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteUser(user.id)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Suppression...' : 'Supprimer'}
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

  if (!isFullAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Accès refusé</h3>
        <p className="text-gray-600 text-center">
          Seuls les administrateurs complets peuvent gérer les utilisateurs.
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
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncDialog(true)}
            title="Vérifier la synchronisation"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>
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
              disabled={!!editingUser || isSubmitting}
            />
            {!editingUser && (
              <Input
                placeholder="Mot de passe (min. 6 caractères) *"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                disabled={isSubmitting}
              />
            )}
            <Input
              placeholder="Nom de l'entreprise"
              value={editingUser ? (editingUser.company_name || '') : newUser.company_name}
              onChange={(e) => editingUser 
                ? setEditingUser({...editingUser, company_name: e.target.value})
                : setNewUser({...newUser, company_name: e.target.value})
              }
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
            <Button 
              onClick={editingUser ? updateUser : addUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Chargement...' : (editingUser ? 'Mettre à jour' : 'Ajouter')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setEditingUser(null);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-gray-600">
            Commencez par ajouter des utilisateurs à votre système.
          </p>
        </div>
      ) : (
        <ListView
          items={users}
          searchFields={['email', 'role', 'company_name']}
          renderCard={(user: User) => (
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
                
                {isFullAdmin && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                      disabled={isSubmitting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetPasswordUser(user)}
                          className="text-orange-600 hover:text-orange-700"
                          disabled={isSubmitting}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                          <DialogDescription>
                            Générer un nouveau mot de passe temporaire pour {user.email}
                          </DialogDescription>
                        </DialogHeader>
                        {tempPassword && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="font-medium text-yellow-800">Nouveau mot de passe temporaire:</p>
                            <p className="text-yellow-900 font-mono bg-yellow-100 p-2 rounded mt-2 break-all">
                              {tempPassword}
                            </p>
                            <p className="text-sm text-yellow-700 mt-2">
                              Communiquez ce mot de passe à l'utilisateur. Il peut maintenant se connecter avec ce mot de passe.
                            </p>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              setResetPasswordUser(null);
                              setTempPassword('');
                            }}
                            variant="outline"
                            disabled={isSubmitting}
                          >
                            Fermer
                          </Button>
                          <Button 
                            onClick={resetUserPassword}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer {user.email} ? Cette action supprimera complètement l'utilisateur et toutes ses données de tous les systèmes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Suppression...' : 'Supprimer'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          renderListItem={(user: User) => (
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
              {isFullAdmin && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                    disabled={isSubmitting}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResetPasswordUser(user)}
                        className="text-orange-600 hover:text-orange-700"
                        disabled={isSubmitting}
                      >
                        <Key className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                        <DialogDescription>
                          Générer un nouveau mot de passe temporaire pour {user.email}
                        </DialogDescription>
                      </DialogHeader>
                      {tempPassword && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="font-medium text-yellow-800">Nouveau mot de passe temporaire:</p>
                          <p className="text-yellow-900 font-mono bg-yellow-100 p-2 rounded mt-2 break-all">
                            {tempPassword}
                          </p>
                          <p className="text-sm text-yellow-700 mt-2">
                            Communiquez ce mot de passe à l'utilisateur. Il peut maintenant se connecter avec ce mot de passe.
                          </p>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            setResetPasswordUser(null);
                            setTempPassword('');
                          }}
                          variant="outline"
                          disabled={isSubmitting}
                        >
                          Fermer
                        </Button>
                        <Button 
                          onClick={resetUserPassword}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer {user.email} ? Cette action supprimera complètement l'utilisateur et toutes ses données de tous les systèmes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          )}
          searchPlaceholder="Rechercher par email, rôle ou entreprise..."
          emptyStateMessage="Aucun utilisateur trouvé"
          emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto" />}
          itemsPerPage={10}
        />
      )}

      <SyncStatusDialog
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        onSyncComplete={handleSyncComplete}
      />
    </div>
  );
};

export default UserManagement;
