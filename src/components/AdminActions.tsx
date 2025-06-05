
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetMatchCounters = async () => {
    try {
      setLoading(true);
      
      // Remettre à zéro les compteurs de matches
      const { error: matchError } = await supabase
        .from('move_matches')
        .delete()
        .neq('id', 0); // Supprimer tous les matches

      if (matchError) throw matchError;

      // Remettre à zéro les statuts de match dans client_requests
      const { error: clientError } = await supabase
        .from('client_requests')
        .update({
          is_matched: false,
          matched_at: null,
          match_status: null
        })
        .neq('id', 0);

      if (clientError) throw clientError;

      toast({
        title: "Compteurs remis à zéro",
        description: "Tous les compteurs de matches ont été remis à zéro avec succès.",
      });

    } catch (error) {
      console.error('Erreur lors de la remise à zéro:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la remise à zéro des compteurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Actions d'administration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-2">Remise à zéro des compteurs</h4>
          <p className="text-sm text-orange-700 mb-4">
            Cette action supprimera tous les matches et remettra les compteurs du tableau de bord à zéro.
            Cette action est irréversible.
          </p>
          <Button
            onClick={resetMatchCounters}
            disabled={loading}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {loading ? 'Remise à zéro...' : 'Remettre à zéro les compteurs'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminActions;
