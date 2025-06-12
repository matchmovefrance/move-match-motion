
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
  type: 'duplicate' | 'orphaned' | 'missing_relation' | 'invalid_data';
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
      console.log('🔍 Checking sync status for all tables...');

      // Vérifier les doublons clients
      const { data: clients } = await supabase
        .from('clients')
        .select('email, count(*)')
        .eq('created_by', user.id);

      // Vérifier les clients orphelins dans move_matches
      const { data: orphanedMatches } = await supabase
        .from('move_matches')
        .select('id, client_id');

      if (orphanedMatches) {
        for (const match of orphanedMatches) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('id', match.client_id)
            .single();

          if (!client) {
            foundIssues.push({
              type: 'orphaned',
              table: 'move_matches',
              message: `Match ${match.id} sans client associé`,
              data: match
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

      // Vérifier les doublons déménageurs
      const { data: movers } = await supabase
        .from('movers')
        .select('email, created_by')
        .eq('created_by', user.id);

      if (movers) {
        const moverEmailCounts: { [key: string]: number } = {};
        movers.forEach(m => {
          moverEmailCounts[m.email] = (moverEmailCounts[m.email] || 0) + 1;
        });

        Object.entries(moverEmailCounts).forEach(([email, count]) => {
          if (count > 1) {
            foundIssues.push({
              type: 'duplicate',
              table: 'movers',
              message: `Email déménageur ${email} dupliqué ${count} fois`,
              data: { email, count }
            });
          }
        });
      }

      // Vérifier les camions orphelins
      const { data: orphanedTrucks } = await supabase
        .from('trucks')
        .select('id, mover_id');

      if (orphanedTrucks) {
        for (const truck of orphanedTrucks) {
          const { data: mover } = await supabase
            .from('movers')
            .select('id')
            .eq('id', truck.mover_id)
            .single();

          if (!mover) {
            foundIssues.push({
              type: 'orphaned',
              table: 'trucks',
              message: `Camion ${truck.id} sans déménageur associé`,
              data: truck
            });
          }
        }
      }

      // Vérifier les déménagements orphelins
      const { data: orphanedMoves } = await supabase
        .from('confirmed_moves')
        .select('id, mover_id, truck_id')
        .eq('created_by', user.id);

      if (orphanedMoves) {
        for (const move of orphanedMoves) {
          const { data: mover } = await supabase
            .from('movers')
            .select('id')
            .eq('id', move.mover_id)
            .single();

          const { data: truck } = await supabase
            .from('trucks')
            .select('id')
            .eq('id', move.truck_id)
            .single();

          if (!mover) {
            foundIssues.push({
              type: 'orphaned',
              table: 'confirmed_moves',
              message: `Déménagement ${move.id} sans déménageur associé`,
              data: move
            });
          }

          if (!truck) {
            foundIssues.push({
              type: 'orphaned',
              table: 'confirmed_moves',
              message: `Déménagement ${move.id} sans camion associé`,
              data: move
            });
          }
        }
      }

      console.log('🔍 Sync check completed. Found issues:', foundIssues.length);
      setIssues(foundIssues);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de synchronisation:', error);
    } finally {
      setChecking(false);
    }
  };

  const fixIssues = async () => {
    if (!user) return;
    
    setFixing(true);
    try {
      console.log('🔧 Fixing sync issues...');
      
      for (const issue of issues) {
        console.log('Fixing issue:', issue);
        
        if (issue.type === 'orphaned') {
          if (issue.table === 'move_matches') {
            await supabase
              .from('move_matches')
              .delete()
              .eq('id', issue.data.id);
          } else if (issue.table === 'trucks') {
            await supabase
              .from('trucks')
              .delete()
              .eq('id', issue.data.id);
          } else if (issue.table === 'confirmed_moves') {
            await supabase
              .from('confirmed_moves')
              .delete()
              .eq('id', issue.data.id)
              .eq('created_by', user.id);
          }
        }
        
        if (issue.type === 'duplicate') {
          if (issue.table === 'service_providers') {
            const { data: duplicates } = await supabase
              .from('service_providers')
              .select('id, created_at')
              .eq('email', issue.data.email)
              .eq('created_by', user.id)
              .order('created_at', { ascending: true });

            if (duplicates && duplicates.length > 1) {
              const toDelete = duplicates.slice(1);
              for (const dup of toDelete) {
                await supabase
                  .from('service_providers')
                  .delete()
                  .eq('id', dup.id)
                  .eq('created_by', user.id);
              }
            }
          } else if (issue.table === 'movers') {
            const { data: duplicates } = await supabase
              .from('movers')
              .select('id, created_at')
              .eq('email', issue.data.email)
              .eq('created_by', user.id)
              .order('created_at', { ascending: true });

            if (duplicates && duplicates.length > 1) {
              const toDelete = duplicates.slice(1);
              for (const dup of toDelete) {
                await supabase
                  .from('movers')
                  .delete()
                  .eq('id', dup.id)
                  .eq('created_by', user.id);
              }
            }
          }
        }
      }

      console.log('✅ All sync issues fixed');
      setIssues([]);
      onSyncComplete();
    } catch (error) {
      console.error('❌ Erreur lors de la correction:', error);
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
                Aucun problème de synchronisation détecté. L'application et la base de données sont parfaitement synchronisées.
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
