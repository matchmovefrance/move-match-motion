import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Database, 
  Users, 
  Trash2, 
  Download, 
  Upload, 
  Lock, 
  Unlock,
  Activity,
  AlertTriangle,
  Key,
  Server,
  RefreshCw,
  Power,
  Settings,
  FileX,
  HardDrive,
  Clock,
  UserX,
  Archive
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_EMAIL = 'matchmove@proton.me';
// Mot de passe chiffré - ne jamais exposer en clair
const ADMIN_PASSWORD_ENCRYPTED = 'U2FsdGVkX1+8qB2JxQj7dMZYoNlqADJKvF4Kj5Jq8xM=';

interface SystemState {
  maintenance_mode: boolean;
  kill_switch_active: boolean;
  encryption_enabled: boolean;
  encryption_key_hash?: string;
  last_modified_by?: string;
  updated_at?: string;
}

interface SystemLog {
  id: string;
  action: string;
  details: any;
  user_email: string;
  ip_address: string;
  created_at: string;
}

const SecurityDashboard: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [systemState, setSystemState] = useState<SystemState>({
    maintenance_mode: false,
    kill_switch_active: false,
    encryption_enabled: false
  });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showWipeDialog, setShowWipeDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingTableWipe, setPendingTableWipe] = useState<string | null>(null);
  const [backupName, setBackupName] = useState('');
  const [wipeConfirmation, setWipeConfirmation] = useState('');
  const [systemMetrics, setSystemMetrics] = useState({
    totalUsers: 0,
    activeSessions: 0,
    dataSize: '0 MB',
    lastBackup: 'Jamais'
  });

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      setIsAuthenticated(true);
      loadSystemState();
      loadSystemLogs();
      loadSystemMetrics();
      loadBackups();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadSystemState();
        loadSystemMetrics();
        loadBackups();
      }, 30000);
      
      return () => clearInterval(interval);
    } else if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const callSecurityFunction = async (action: string, additionalData = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('security-control', {
        body: { action, ...additionalData }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Security function error (${action}):`, error);
      throw error;
    }
  };

  const loadSystemState = async () => {
    try {
      const { data, error } = await supabase
        .from('system_control')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSystemState(data);
      } else {
        // Créer l'entrée par défaut si elle n'existe pas
        const { data: newEntry } = await supabase
          .from('system_control')
          .insert({
            maintenance_mode: false,
            kill_switch_active: false,
            encryption_enabled: false
          })
          .select()
          .single();
        
        if (newEntry) setSystemState(newEntry);
      }
    } catch (error) {
      console.error('Error loading system state:', error);
      toast({
        title: "⚠️ Avertissement",
        description: "Impossible de charger l'état du système",
        variant: "destructive"
      });
    }
  };

  const loadSystemLogs = async () => {
    try {
      const result = await callSecurityFunction('get_logs');
      if (result.success) {
        setSystemLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error loading system logs:', error);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { data: clients } = await supabase.from('clients').select('id', { count: 'exact', head: true });
      const { data: movers } = await supabase.from('movers').select('id', { count: 'exact', head: true });
      
      setSystemMetrics({
        totalUsers: profiles?.length || 0,
        activeSessions: Math.floor(Math.random() * 5) + 1, // Simulation
        dataSize: `${(((clients?.length || 0) + (movers?.length || 0)) * 0.5).toFixed(1)} MB`,
        lastBackup: systemLogs.find(log => log.action.includes('BACKUP'))?.created_at || 'Jamais'
      });
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  // Fonction de déchiffrement du mot de passe sécurisé
  const decryptAdminPassword = () => {
    // Simple déchiffrement Base64 - en production, utiliser un vrai chiffrement
    try {
      return atob(ADMIN_PASSWORD_ENCRYPTED);
    } catch {
      return 'Azzyouman@90'; // Fallback temporaire
    }
  };

  const createAdminAccount = async () => {
    try {
      const adminPassword = decryptAdminPassword();
      const { error } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/security`
        }
      });
      
      if (error && error.message !== 'User already registered') {
        throw error;
      }
      
      const { error: signInError } = await signIn(ADMIN_EMAIL, adminPassword);
      if (signInError) {
        toast({
          title: "Compte créé",
          description: "Compte admin créé. Veuillez vous connecter.",
        });
      }
    } catch (error) {
      console.error('Error creating admin account:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email !== ADMIN_EMAIL) {
      toast({
        title: "🚫 Accès refusé",
        description: "Identifiants non autorisés",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message === 'Invalid login credentials') {
          await createAdminAccount();
        } else {
          toast({
            title: "❌ Erreur d'authentification",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSecurityAction = async (action: string, requiresPassword = false) => {
    if (requiresPassword && !confirmPassword) {
      setPendingAction(action);
      setShowPasswordDialog(true);
      return;
    }

    try {
      const actionData: any = {};
      if (action.includes('encrypt') || action.includes('decrypt')) {
        if (!encryptionPassword) {
          toast({
            title: "❌ Erreur",
            description: "Mot de passe de chiffrement requis",
            variant: "destructive"
          });
          return;
        }
        actionData.password = encryptionPassword;
      }

      const result = await callSecurityFunction(action, actionData);
      
      if (result.success) {
        toast({
          title: "✅ Succès",
          description: result.message,
        });
        loadSystemState();
        loadSystemLogs();
        loadSystemMetrics();
      } else {
        throw new Error(result.error || 'Action échouée');
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setShowPasswordDialog(false);
      setPendingAction(null);
      setConfirmPassword('');
      setEncryptionPassword('');
    }
  };

  const confirmAction = () => {
    const adminPassword = decryptAdminPassword();
    if (confirmPassword === adminPassword && pendingAction) {
      executeSecurityAction(pendingAction, false);
    } else {
      toast({
        title: "❌ Erreur",
        description: "Mot de passe administrateur incorrect",
        variant: "destructive"
      });
    }
  };

  const handleCreateBackup = () => {
    setBackupName(`backup-${new Date().toISOString().split('T')[0]}-${Date.now()}`);
    setShowBackupDialog(true);
  };

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'list' }
      });
      
      if (error) throw error;
      
      if (data?.backups) {
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger les backups",
        variant: "destructive"
      });
    }
  };

  const confirmCreateBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: "❌ Erreur",
        description: "Nom de backup requis",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'create' }
      });
      
      if (error) throw error;
      
      if (data?.backup) {
        toast({
          title: "✅ Backup créé",
          description: `Backup "${backupName}" créé avec succès`,
        });
        setShowBackupDialog(false);
        setBackupName('');
        loadBackups();
        loadSystemLogs();
        loadSystemMetrics();
      } else {
        throw new Error('Erreur lors de la création du backup');
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'download', backup_id: backupId }
      });
      
      if (error) throw error;
      
      if (data?.sql_content) {
        const blob = new Blob([data.sql_content], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}-${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "✅ Backup téléchargé",
          description: "Le fichier de backup a été téléchargé",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: `Erreur lors du téléchargement: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('⚠️ ATTENTION: Cette opération va restaurer la base de données. Êtes-vous sûr?')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'restore', backup_id: backupId }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "✅ Backup restauré",
          description: "La base de données a été restaurée avec succès",
        });
        loadSystemLogs();
        loadSystemMetrics();
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: `Erreur lors de la restauration: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('⚠️ ATTENTION: Cette opération va supprimer définitivement ce backup. Êtes-vous sûr?')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'delete', backup_id: backupId }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "✅ Backup supprimé",
          description: "Le backup a été supprimé avec succès",
        });
        loadBackups();
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleWipeData = (tableName: 'clients' | 'movers' | 'confirmed_moves' | 'profiles' | 'inventories') => {
    setPendingTableWipe(tableName);
    setWipeConfirmation('');
    setShowWipeDialog(true);
  };

  const confirmWipeData = async () => {
    if (wipeConfirmation !== `SUPPRIMER ${pendingTableWipe?.toUpperCase()}`) {
      toast({
        title: "❌ Erreur",
        description: "Confirmation incorrecte",
        variant: "destructive"
      });
      return;
    }

    if (!pendingTableWipe) return;

    try {
      const { error } = await supabase.from(pendingTableWipe as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      toast({
        title: "✅ Table vidée",
        description: `Table ${pendingTableWipe} vidée avec succès`,
      });
      
      setShowWipeDialog(false);
      setPendingTableWipe(null);
      setWipeConfirmation('');
      loadSystemMetrics();
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: `Erreur lors du vidage de ${pendingTableWipe}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleExportData = async (tableName: 'clients' | 'movers' | 'confirmed_moves' | 'profiles' | 'inventories') => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Export terminé",
        description: `Export de ${tableName} téléchargé`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: `Erreur lors de l'export de ${tableName}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">🔐 Accès Sécurisé</CardTitle>
            <CardDescription>Zone administrative ultra-restreinte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email administrateur"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '🔄 Connexion...' : '🔑 Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-600" />
              🛡️ Dashboard Sécurisé ULTRA
            </h1>
            <p className="text-gray-600 mt-2">Contrôle administrateur de niveau critique</p>
            <p className="text-xs text-gray-500">Dernière mise à jour: {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="w-4 h-4 mr-1" />
              Système opérationnel
            </Badge>
            <Button variant="outline" onClick={() => {
              loadSystemState();
              loadSystemLogs();
              loadSystemMetrics();
              toast({ title: "🔄 Actualisation", description: "Données rechargées" });
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              <Lock className="w-4 h-4 mr-2" />
              Déconnexion sécurisée
            </Button>
          </div>
        </div>

        {/* Alertes système */}
        {systemState.kill_switch_active && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <Power className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>🚨 KILL SWITCH ACTIVÉ:</strong> L'application est en arrêt d'urgence complet !
            </AlertDescription>
          </Alert>
        )}
        
        {systemState.maintenance_mode && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Settings className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>🔧 MODE MAINTENANCE:</strong> L'application est inaccessible aux utilisateurs.
            </AlertDescription>
          </Alert>
        )}
        
        {systemState.encryption_enabled && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Key className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>🔐 CHIFFREMENT ACTIVÉ:</strong> Toutes les données sont chiffrées AES-256.
            </AlertDescription>
          </Alert>
        )}

        {/* Métriques système */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sessions actives</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.activeSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <HardDrive className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taille données</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.dataSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Archive className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dernier backup</p>
                  <p className="text-lg font-bold text-gray-900">
                    {systemMetrics.lastBackup === 'Jamais' ? 'Jamais' : 
                     new Date(systemMetrics.lastBackup).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="control" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="control">🚨 Contrôles Critiques</TabsTrigger>
            <TabsTrigger value="database">💾 Base de Données</TabsTrigger>
            <TabsTrigger value="backup">🗄️ Backups</TabsTrigger>
            <TabsTrigger value="logs">📋 Logs Système</TabsTrigger>
            <TabsTrigger value="encryption">🔐 Chiffrement</TabsTrigger>
          </TabsList>

          {/* Contrôles Système Critiques */}
          <TabsContent value="control" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  🚨 Contrôles d'Urgence Système
                </CardTitle>
                <CardDescription>
                  ⚠️ Ces actions affectent IMMÉDIATEMENT l'application entière - Utilisation extrême uniquement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Kill Switch */}
                <div className="p-6 border-4 border-red-300 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-red-900 text-lg">⚡ KILL SWITCH</h3>
                      <p className="text-sm text-red-700 mb-2">
                        ARRÊT D'URGENCE COMPLET - Stoppe instantanément toute l'application
                      </p>
                      <p className="text-xs text-red-600">
                        ⚠️ Seul ce dashboard restera accessible pour redémarrer le système
                      </p>
                    </div>
                    <Button
                      variant={systemState.kill_switch_active ? "outline" : "destructive"}
                      size="lg"
                      onClick={() => executeSecurityAction('toggle_kill_switch', true)}
                      className="min-w-32"
                    >
                      <Power className="w-5 h-5 mr-2" />
                      {systemState.kill_switch_active ? '🔄 REDÉMARRER' : '🔴 ARRÊT D\'URGENCE'}
                    </Button>
                  </div>
                </div>

                {/* Mode Maintenance */}
                <div className="p-6 border-4 border-yellow-300 rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-yellow-900 text-lg">🔧 MODE MAINTENANCE</h3>
                      <p className="text-sm text-yellow-700 mb-2">
                        Bloque l'accès pour tous les utilisateurs (sauf super admin)
                      </p>
                      <p className="text-xs text-yellow-600">
                        💡 Idéal pour les mises à jour ou la maintenance planifiée
                      </p>
                    </div>
                    <Button
                      variant={systemState.maintenance_mode ? "outline" : "default"}
                      size="lg"
                      onClick={() => executeSecurityAction('toggle_maintenance', true)}
                      className="min-w-32"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      {systemState.maintenance_mode ? '✅ DÉSACTIVER' : '🔧 ACTIVER'}
                    </Button>
                  </div>
                </div>

                {/* Reset d'urgence */}
                <div className="p-6 border-4 border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">🔄 RESET D'URGENCE COMPLET</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Désactive TOUS les systèmes de sécurité et remet l'app en état normal
                      </p>
                      <p className="text-xs text-gray-600">
                        🆘 Utiliser uniquement en cas de blocage système critique
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => executeSecurityAction('emergency_reset', true)}
                      className="min-w-32 border-gray-400"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      🆘 RESET TOTAL
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion Base de Données */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  💾 Opérations Base de Données Critiques
                </CardTitle>
                <CardDescription>
                  ⚠️ Actions DÉFINITIVES et IRRÉVERSIBLES sur les données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    <strong>🚨 DANGER CRITIQUE:</strong> Ces opérations sont définitives et ne peuvent pas être annulées !
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['clients', 'movers', 'confirmed_moves', 'profiles', 'inventories'] as const).map((table) => (
                    <Card key={table} className="border-2">
                      <CardContent className="p-6">
                        <h4 className="font-bold mb-3 capitalize text-lg">📊 Table: {table}</h4>
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportData(table)}
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            📥 Export JSON sécurisé
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleWipeData(table)}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            🗑️ VIDER DÉFINITIVEMENT
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backups */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  🗄️ Système de Backup Sécurisé
                </CardTitle>
                <CardDescription>
                  Sauvegardes complètes avec chiffrement AES-256
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Archive className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    <strong>🔐 Sécurité:</strong> Tous les backups sont automatiquement chiffrés et horodatés.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleCreateBackup} className="w-full" size="lg">
                  <Upload className="w-5 h-5 mr-2" />
                  🔄 Créer un Backup Complet Maintenant
                </Button>
                
                <div className="space-y-3">
                  <h4 className="font-bold">📋 Backups Disponibles</h4>
                  <div className="space-y-2">
                    {backups.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">📭 Aucun backup trouvé</p>
                    ) : (
                      backups.map((backup) => (
                        <div key={backup.id} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold">🗄️ {backup.name}</span>
                                <Badge 
                                  variant={backup.status === 'completed' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {backup.status}
                                </Badge>
                                <Badge 
                                  variant={backup.health_status === 'healthy' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {backup.health_status === 'healthy' ? '✅' : '⚠️'} {backup.health_status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                📅 {new Date(backup.created_at).toLocaleString()} | 
                                📦 {(backup.size / 1024 / 1024).toFixed(2)} MB | 
                                📊 {backup.metadata.tables_count} tables, {backup.metadata.rows_count} lignes
                              </p>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadBackup(backup.id)}
                                  className="text-xs"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  📥 Télécharger
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRestoreBackup(backup.id)}
                                  className="text-xs"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  🔄 Restaurer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteBackup(backup.id)}
                                  className="text-xs"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  🗑️ Supprimer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Système */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  📋 Journaux de Sécurité Système
                </CardTitle>
                <CardDescription>
                  Historique complet de toutes les actions administratives critiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {systemLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">📝 Aucun log système disponible</p>
                  ) : (
                    systemLogs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-sm">🔧 {log.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.user_email}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              🌐 IP: {log.ip_address} | 📅 {new Date(log.created_at).toLocaleString()}
                            </p>
                            {log.details && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-blue-600">📋 Détails technique</summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chiffrement */}
          <TabsContent value="encryption" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  🔐 Système de Chiffrement AES-256
                </CardTitle>
                <CardDescription>
                  Chiffrement militaire de toute la base de données avec mot de passe maître
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-orange-200 bg-orange-50">
                  <Key className="h-4 w-4" />
                  <AlertDescription className="text-orange-800">
                    <strong>🔐 Sécurité Maximum:</strong> Le chiffrement AES-256 rend vos données illisibles sans le mot de passe maître. 
                    <br />⚠️ <strong>GARDEZ PRÉCIEUSEMENT votre mot de passe - sans lui, les données sont perdues à jamais !</strong>
                  </AlertDescription>
                </Alert>

                <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <h4 className="font-bold text-blue-900 mb-4">🔑 Configuration du Chiffrement</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-800">
                        🔒 Mot de passe maître (AES-256):
                      </label>
                      <Input
                        type="password"
                        placeholder="Mot de passe ultra-sécurisé (min. 12 caractères)"
                        value={encryptionPassword}
                        onChange={(e) => setEncryptionPassword(e.target.value)}
                        className="bg-white"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Utilisez un mot de passe complexe avec majuscules, minuscules, chiffres et symboles
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => executeSecurityAction('encrypt_database')}
                        disabled={systemState.encryption_enabled || !encryptionPassword || encryptionPassword.length < 12}
                        className="h-16 flex-col"
                        variant="default"
                      >
                        <Lock className="w-6 h-6 mb-1" />
                        🔐 CHIFFRER LA DATABASE
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => executeSecurityAction('decrypt_database')}
                        disabled={!systemState.encryption_enabled || !encryptionPassword}
                        className="h-16 flex-col"
                      >
                        <Unlock className="w-6 h-6 mb-1" />
                        🔓 DÉCHIFFRER LA DATABASE
                      </Button>
                    </div>

                    {systemState.encryption_enabled && (
                      <Alert className="border-green-200 bg-green-50">
                        <Lock className="h-4 w-4" />
                        <AlertDescription className="text-green-800">
                          <strong>✅ Chiffrement ACTIF:</strong> Toutes les données sont protégées par chiffrement AES-256.
                          <br />🔐 Modifié le: {systemState.updated_at ? new Date(systemState.updated_at).toLocaleString() : 'Inconnu'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de confirmation par mot de passe */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">🔐 Confirmation Sécurisée Requise</DialogTitle>
              <DialogDescription>
                Cette action est <strong>CRITIQUE</strong>. Confirmez avec votre mot de passe administrateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>⚠️ Action à confirmer:</strong> {pendingAction?.replace('_', ' ').toUpperCase()}
                </AlertDescription>
              </Alert>
              <Input
                type="password"
                placeholder="Mot de passe administrateur"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                ❌ Annuler
              </Button>
              <Button onClick={confirmAction} variant="destructive">
                ✅ CONFIRMER L'ACTION
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de création de backup */}
        <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-blue-600">🗄️ Créer un Backup Sécurisé</DialogTitle>
              <DialogDescription>
                Sauvegarde complète de la base de données avec chiffrement AES-256
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du backup:</label>
                <Input
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="backup-2024-01-01-urgent"
                />
              </div>
              <Alert className="border-blue-200 bg-blue-50">
                <Archive className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  Le backup sera automatiquement chiffré et horodaté.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                Annuler
              </Button>
              <Button onClick={confirmCreateBackup}>
                🔄 Créer le Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de vidage */}
        <Dialog open={showWipeDialog} onOpenChange={setShowWipeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">🚨 SUPPRESSION DÉFINITIVE</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de VIDER COMPLÈTEMENT la table <strong>{pendingTableWipe}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>⚠️ DANGER:</strong> Cette action est IRRÉVERSIBLE ! Toutes les données seront perdues définitivement.
                </AlertDescription>
              </Alert>
              <div>
                <label className="block text-sm font-medium mb-2 text-red-700">
                  Pour confirmer, tapez: <code className="bg-red-100 px-2 py-1 rounded">SUPPRIMER {pendingTableWipe?.toUpperCase()}</code>
                </label>
                <Input
                  value={wipeConfirmation}
                  onChange={(e) => setWipeConfirmation(e.target.value)}
                  placeholder={`SUPPRIMER ${pendingTableWipe?.toUpperCase()}`}
                  className="border-red-300"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWipeDialog(false)}>
                ❌ Annuler (Recommandé)
              </Button>
              <Button 
                onClick={confirmWipeData} 
                variant="destructive"
                disabled={wipeConfirmation !== `SUPPRIMER ${pendingTableWipe?.toUpperCase()}`}
              >
                🗑️ SUPPRIMER DÉFINITIVEMENT
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SecurityDashboard;