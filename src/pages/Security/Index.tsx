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
  Server
} from 'lucide-react';

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
  const [systemStatus, setSystemStatus] = useState({
    databaseHealth: 'healthy',
    activeUsers: 0,
    totalTables: 0,
    backupCount: 0
  });

  useEffect(() => {
    // Check if user is the authorized admin
    if (user?.email === ADMIN_EMAIL) {
      setIsAuthenticated(true);
      loadSystemStatus();
    } else if (user) {
      // Redirect unauthorized users
      navigate('/');
    }
  }, [user, navigate]);

  const loadSystemStatus = async () => {
    try {
      // Get basic system metrics
      const { data: profiles } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { data: clients } = await supabase.from('clients').select('id', { count: 'exact', head: true });
      
      setSystemStatus({
        databaseHealth: 'healthy',
        activeUsers: profiles?.length || 0,
        totalTables: 15, // Approximate table count
        backupCount: 0
      });
    } catch (error) {
      console.error('Error loading system status:', error);
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
      
      // Try to sign in immediately after signup
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
        // If login fails, try to create the admin account
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

  const handleWipeData = async (tableName: 'clients' | 'movers' | 'confirmed_moves' | 'profiles') => {
    if (!confirm(`Êtes-vous sûr de vouloir vider la table ${tableName} ?`)) return;
    
    try {
      const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: `Table ${tableName} vidée avec succès`,
      });
      loadSystemStatus();
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors du vidage de ${tableName}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateBackup = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'create', name: `security-backup-${Date.now()}` }
      });
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Backup sécurisé créé avec succès",
      });
      loadSystemStatus();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du backup",
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
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
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
            <Button variant="outline" onClick={() => signOut()}>
              <Lock className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">État DB</p>
                  <p className="text-2xl font-bold text-gray-900">Sain</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStatus.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Server className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tables</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStatus.totalTables}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Backups</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStatus.backupCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database">Gestion Base de Données</TabsTrigger>
            <TabsTrigger value="backup">Backups Sécurisés</TabsTrigger>
            <TabsTrigger value="system">Contrôle Système</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Opérations Base de Données
                </CardTitle>
                <CardDescription>
                  Opérations critiques sur la base de données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Attention: Ces opérations sont irréversibles
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

          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Backups Sécurisés
                </CardTitle>
                <CardDescription>
                  Système de sauvegarde chiffré
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleCreateBackup} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Créer un Backup Sécurisé
                </Button>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Backups Disponibles</h4>
                  <div className="text-sm text-gray-600">
                    Aucun backup sécurisé trouvé
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Contrôle Système
                </CardTitle>
                <CardDescription>
                  Fonctions de sécurité avancées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Fonctions de sécurité critiques - Utiliser avec précaution
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Unlock className="w-6 h-6 mb-2" />
                    Mode Maintenance
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Activity className="w-6 h-6 mb-2" />
                    Logs Système
                  </Button>
                  <Button variant="destructive" className="h-20 flex-col">
                    <AlertTriangle className="w-6 h-6 mb-2" />
                    Kill Switch
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Key className="w-6 h-6 mb-2" />
                    Chiffrement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecurityDashboard;