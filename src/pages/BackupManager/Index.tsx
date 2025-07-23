import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Backup {
  id: string;
  name: string;
  created_at: string;
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  health_status: 'healthy' | 'warning' | 'error';
  sql_file_url?: string;
  metadata: {
    tables_count: number;
    rows_count: number;
    functions_count: number;
    policies_count: number;
  };
}

const BackupManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const response = await supabase.functions.invoke('backup-manager', {
        body: { action: 'list' }
      });

      if (response.error) throw response.error;
      setBackups(response.data?.backups || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les backups: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const response = await supabase.functions.invoke('backup-manager', {
        body: { action: 'create' }
      });

      if (response.error) throw response.error;

      toast({
        title: "Backup créé",
        description: "Le backup de la base de données a été créé avec succès"
      });

      await loadBackups();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le backup: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir restaurer cette version ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('backup-manager', {
        body: { action: 'restore', backup_id: backupId }
      });

      if (response.error) throw response.error;

      toast({
        title: "Restauration réussie",
        description: "La base de données a été restaurée avec succès"
      });

      await loadBackups();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer le backup: " + error.message,
        variant: "destructive"
      });
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await supabase.functions.invoke('backup-manager', {
        body: { action: 'download', backup_id: backup.id }
      });

      if (response.error) throw response.error;

      // Créer un lien de téléchargement
      const blob = new Blob([response.data.sql_content], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backup.name}_${backup.created_at.split('T')[0]}.sql`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement démarré",
        description: "Le fichier SQL va être téléchargé"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le backup: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce backup ?')) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('backup-manager', {
        body: { action: 'delete', backup_id: backupId }
      });

      if (response.error) throw response.error;

      toast({
        title: "Backup supprimé",
        description: "Le backup a été supprimé avec succès"
      });

      await loadBackups();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le backup: " + error.message,
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Sain</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Database className="h-8 w-8" />
              <span>Gestionnaire de Backups</span>
            </h1>
            <p className="text-gray-600">Gérez les backups et la restauration de votre base de données</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={loadBackups}
              variant="outline"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>{isCreatingBackup ? 'Création...' : 'Créer un Backup'}</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Backups</p>
                  <p className="text-xl font-bold">{backups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Backups Sains</p>
                  <p className="text-xl font-bold">
                    {backups.filter(b => b.health_status === 'healthy').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Dernier Backup</p>
                  <p className="text-sm font-medium">
                    {backups.length > 0 
                      ? new Date(backups[0]?.created_at).toLocaleDateString('fr-FR')
                      : 'Aucun'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Taille Totale</p>
                  <p className="text-sm font-medium">
                    {formatFileSize(backups.reduce((acc, b) => acc + b.size, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backups List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement des backups...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun backup disponible</p>
                <p className="text-sm">Créez votre premier backup pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div key={backup.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(backup.status)}
                        <div>
                          <h3 className="font-medium">{backup.name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(backup.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {getHealthBadge(backup.health_status)}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-600">
                          <p>{formatFileSize(backup.size)}</p>
                          <p>{backup.metadata.tables_count} tables, {backup.metadata.rows_count} lignes</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup)}
                            className="flex items-center space-x-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>SQL</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreBackup(backup.id)}
                            disabled={backup.status !== 'completed'}
                            className="flex items-center space-x-1"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Restaurer</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteBackup(backup.id)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackupManager;