
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SyncStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

interface SyncIssue {
  type: 'duplicate' | 'orphaned' | 'missing_relation';
  table: string;
  message: string;
  data?: any;
}

const SyncStatusDialog = ({ isOpen, onClose, onSyncComplete }: SyncStatusDialogProps) => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<SyncIssue[]>([]);
  const [fixing, setFixing] = useState(false);

  const checkSyncStatus = async () => {
    if (!user) return;
    
    setChecking(true);
    const foundIssues: SyncIssue[] = [];

    try {
      // Vérifier les doublons clients
      const { data: clients } = await supabase
        .from('clients')
        .select('email, count(*)')
        .eq('created_by', user.id);

      // Vérifier les relations client_requests sans client
      const { data: orphanedRequests } = await supabase
        .from('client_requests')
        .select('id, client_id')
        .eq('created_by', user.id);

      if (orphanedRequests) {
        for (const request of orphanedRequests) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('id', request.client_id)
            .eq('created_by', user.id)
            .single();

          if (!client) {
            foundIssues.push({
              type: 'orphaned',
              table: 'client_requests',
              message: `Demande client ${request.id} sans client associé`,
              data: request
            });
          }
        }
      }

      // Vérifier les doublons prestataires
      const { data: providers } = await supabase
        .from('service_providers')
        .select('email, created_by')
        .eq('created_by', user.id);

      if (providers) {
        const emailCounts: { [key: string]: number } = {};
        providers.forEach(p => {
          emailCounts[p.email] = (emailCounts[p.email] || 0) + 1;
        });

        Object.entries(emailCounts).forEach(([email, count]) => {
          if (count > 1) {
            foundIssues.push({
              type: 'duplicate',
              table: 'service_providers',
              message: `Email ${email} dupliqué ${count} fois`,
              data: { email, count }
            });
          }
        });
      }

      setIssues(foundIssues);
    } catch (error) {
      console.error('Erreur lors de la vérification de synchronisation:', error);
    } finally {
      setChecking(false);
    }
  };

  const fixIssues = async () => {
    if (!user) return;
    
    setFixing(true);
    try {
      for (const issue of issues) {
        if (issue.type === 'orphaned' && issue.table === 'client_requests') {
          // Supprimer les demandes orphelines
          await supabase
            .from('client_requests')
            .delete()
            .eq('id', issue.data.id)
            .eq('created_by', user.id);
        }
        
        if (issue.type === 'duplicate' && issue.table === 'service_providers') {
          // Garder seulement le premier prestataire avec cet email
          const { data: duplicates } = await supabase
            .from('service_providers')
            .select('id, created_at')
            .eq('email', issue.data.email)
            .eq('created_by', user.id)
            .order('created_at', { ascending: true });

          if (duplicates && duplicates.length > 1) {
            // Supprimer tous sauf le premier
            const toDelete = duplicates.slice(1);
            for (const dup of toDelete) {
              await supabase
                .from('service_providers')
                .delete()
                .eq('id', dup.id)
                .eq('created_by', user.id);
            }
          }
        }
      }

      setIssues([]);
      onSyncComplete();
    } catch (error) {
      console.error('Erreur lors de la correction:', error);
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      checkSyncStatus();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Statut de synchronisation</span>
          </DialogTitle>
          <DialogDescription>
            Vérification de la synchronisation entre l'application et la base de données
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {checking && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Vérification en cours...</span>
            </div>
          )}

          {!checking && issues.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Aucun problème de synchronisation détecté. L'application et la base de données sont synchronisées.
              </AlertDescription>
            </Alert>
          )}

          {!checking && issues.length > 0 && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {issues.length} problème(s) de synchronisation détecté(s)
                </AlertDescription>
              </Alert>

              {issues.map((issue, index) => (
                <div key={index} className="p-3 border rounded-lg bg-yellow-50">
                  <p className="text-sm font-medium text-yellow-800">
                    {issue.table}: {issue.message}
                  </p>
                </div>
              ))}

              <Button 
                onClick={fixIssues} 
                disabled={fixing}
                className="w-full"
              >
                {fixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Correction en cours...
                  </>
                ) : (
                  'Corriger automatiquement'
                )}
              </Button>
            </div>
          )}

          <div className="flex space-x-3">
            <Button variant="outline" onClick={checkSyncStatus} disabled={checking}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-vérifier
            </Button>
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SyncStatusDialog;
