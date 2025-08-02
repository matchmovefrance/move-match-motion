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
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ADMIN_EMAIL = 'elmourabitazeddine@gmail.com';
const ADMIN_PASSWORD = 'Azzyouman@90';

const SecurityDashboard: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [systemState, setSystemState] = useState({
    maintenance_mode: false,
    kill_switch_active: false,
    encryption_enabled: false
  });
  const [systemLogs, setSystemLogs] = useState([]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      setIsAuthenticated(true);
      loadSystemState();
      loadSystemLogs();
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
      const result = await callSecurityFunction('get_status');
      if (result.success) {
        setSystemState(result.data);
      }
    } catch (error) {
      console.error('Error loading system state:', error);
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

  const createAdminAccount = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          emailRedirectTo: `${window.location.origin}/security`
        }
      });
      
      if (error && error.message !== 'User already registered') {
        throw error;
      }
      
      const { error: signInError } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
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
        title: "Accès refusé",
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
            title: "Erreur d'authentification",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
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
            title: "Erreur",
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
          title: "Succès",
          description: result.message,
        });
        loadSystemState();
        loadSystemLogs();
      } else {
        throw new Error(result.error || 'Action échouée');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
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
    if (confirmPassword === ADMIN_PASSWORD && pendingAction) {
      executeSecurityAction(pendingAction, false);
    } else {
      toast({
        title: "Erreur",
        description: "Mot de passe incorrect",
        variant: "destructive"
      });
    }
  };

  const handleWipeData = async (tableName: 'clients' | 'movers' | 'confirmed_moves' | 'profiles') => {
    if (!confirm(`⚠️ DANGER: Vider définitivement la table ${tableName} ?\n\nCette action est IRRÉVERSIBLE !`)) return;
    
    try {
      const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: `Table ${tableName} vidée avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors du vidage de ${tableName}`,
        variant: "destructive"
      });
    }
  };

  const handleExportData = async (tableName: 'clients' | 'movers' | 'confirmed_moves' | 'profiles') => {
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
        title: "Succès",
        description: `Export de ${tableName} téléchargé`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'export de ${tableName}`,
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
            <CardTitle className="text-2xl">Accès Sécurisé</CardTitle>
            <CardDescription>Zone administrative restreinte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
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
                {isLoading ? 'Connexion...' : 'Se connecter'}
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
              Dashboard Sécurisé
            </h1>
            <p className="text-gray-600 mt-2">Contrôle administrateur avancé</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="w-4 h-4 mr-1" />
              Système actif
            </Badge>
            <Button variant="outline" onClick={loadSystemState}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              <Lock className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* État du système - Alertes */}
        {systemState.kill_switch_active && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>KILL SWITCH ACTIVÉ:</strong> L'application est en arrêt d'urgence !
            </AlertDescription>
          </Alert>
        )}
        
        {systemState.maintenance_mode && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Settings className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>MODE MAINTENANCE:</strong> L'application est en maintenance.
            </AlertDescription>
          </Alert>
        )}
        
        {systemState.encryption_enabled && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Key className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>CHIFFREMENT ACTIVÉ:</strong> Les données sont chiffrées.
            </AlertDescription>
          </Alert>
        )}

        {/* Cartes de statut */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">État DB</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemState.kill_switch_active ? 'Arrêt' : 'Actif'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemState.maintenance_mode ? 'ON' : 'OFF'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Key className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chiffrement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemState.encryption_enabled ? 'ON' : 'OFF'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Power className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kill Switch</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemState.kill_switch_active ? 'ON' : 'OFF'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="control" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control">Contrôles Critiques</TabsTrigger>
            <TabsTrigger value="database">Base de Données</TabsTrigger>
            <TabsTrigger value="logs">Logs Système</TabsTrigger>
            <TabsTrigger value="encryption">Chiffrement</TabsTrigger>
          </TabsList>

          {/* Contrôles Système Critiques */}
          <TabsContent value="control" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Contrôles d'Urgence
                </CardTitle>
                <CardDescription>
                  ⚠️ Ces actions affectent immédiatement l'application entière
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Kill Switch */}
                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-red-900">KILL SWITCH</h3>
                      <p className="text-sm text-red-700">
                        Arrêt d'urgence complet de l'application. Seul ce dashboard restera accessible.
                      </p>
                    </div>
                    <Button
                      variant={systemState.kill_switch_active ? "outline" : "destructive"}
                      onClick={() => executeSecurityAction('toggle_kill_switch', true)}
                    >
                      <Power className="w-4 h-4 mr-2" />
                      {systemState.kill_switch_active ? 'DÉSACTIVER' : 'ACTIVER'}
                    </Button>
                  </div>
                </div>

                {/* Mode Maintenance */}
                <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-yellow-900">MODE MAINTENANCE</h3>
                      <p className="text-sm text-yellow-700">
                        Bloque l'accès pour tous les utilisateurs sauf les administrateurs.
                      </p>
                    </div>
                    <Button
                      variant={systemState.maintenance_mode ? "outline" : "default"}
                      onClick={() => executeSecurityAction('toggle_maintenance', true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {systemState.maintenance_mode ? 'DÉSACTIVER' : 'ACTIVER'}
                    </Button>
                  </div>
                </div>

                {/* Reset d'urgence */}
                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">RESET D'URGENCE</h3>
                      <p className="text-sm text-gray-700">
                        Désactive tous les systèmes de sécurité et remet l'application en état normal.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => executeSecurityAction('emergency_reset', true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      RESET COMPLET
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
                  Opérations Base de Données
                </CardTitle>
                <CardDescription>
                  Opérations critiques sur la base de données - Actions irréversibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ ATTENTION: Ces opérations sont définitives et irréversibles !
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['clients', 'movers', 'confirmed_moves', 'profiles'] as const).map((table) => (
                    <div key={table} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 capitalize">{table}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportData(table)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleWipeData(table)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Vider
                        </Button>
                      </div>
                    </div>
                  ))}
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
                  Logs Système
                </CardTitle>
                <CardDescription>
                  Historique des actions administratives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {systemLogs.length === 0 ? (
                    <p className="text-gray-500">Aucun log disponible</p>
                  ) : (
                    systemLogs.map((log: any) => (
                      <div key={log.id} className="p-3 border rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{log.action}</span>
                            <p className="text-gray-600">{log.user_email}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.details && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
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
                  Système de Chiffrement
                </CardTitle>
                <CardDescription>
                  Chiffrement AES-256 de la base de données avec mot de passe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Le chiffrement protège vos données mais peut ralentir les performances. 
                    Conservez précieusement votre mot de passe de chiffrement !
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mot de passe de chiffrement:
                    </label>
                    <Input
                      type="password"
                      placeholder="Mot de passe sécurisé"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => executeSecurityAction('encrypt_database')}
                      disabled={systemState.encryption_enabled || !encryptionPassword}
                      className="flex-1"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Chiffrer la Base de Données
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => executeSecurityAction('decrypt_database')}
                      disabled={!systemState.encryption_enabled || !encryptionPassword}
                      className="flex-1"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Déchiffrer la Base de Données
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de confirmation par mot de passe */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmation Sécurisée</DialogTitle>
              <DialogDescription>
                Cette action est critique. Veuillez confirmer avec votre mot de passe administrateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Mot de passe administrateur"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Annuler
              </Button>
              <Button onClick={confirmAction} variant="destructive">
                Confirmer l'Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SecurityDashboard;