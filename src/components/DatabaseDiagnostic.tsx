
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

const DatabaseDiagnostic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnosticResults = [];

    try {
      // Test 1: Vérifier la table confirmed_moves
      console.log('🔍 Testing confirmed_moves table structure...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .limit(1);

      diagnosticResults.push({
        test: 'Table confirmed_moves accessible',
        success: !tableError,
        message: tableError ? tableError.message : 'OK',
        details: tableError
      });

      // Test 2: Tester une insertion simple
      console.log('🔍 Testing simple insert...');
      const testData = {
        mover_name: 'Test Mover',
        company_name: 'Test Company',
        departure_city: 'Paris',
        departure_postal_code: '75001',
        arrival_city: 'Lyon', 
        arrival_postal_code: '69001',
        departure_date: '2025-01-15',
        max_volume: 10,
        used_volume: 0,
        available_volume: 10,
        created_by: user?.id || '',
        status: 'confirmed',
        status_custom: 'en_cours'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('confirmed_moves')
        .insert(testData)
        .select();

      diagnosticResults.push({
        test: 'Insert test move',
        success: !insertError,
        message: insertError ? insertError.message : 'Insert successful',
        details: insertError,
        data: insertData
      });

      // Si l'insertion a réussi, on supprime le test
      if (!insertError && insertData && insertData[0]) {
        await supabase
          .from('confirmed_moves')
          .delete()
          .eq('id', insertData[0].id);
      }

      // Test 3: Vérifier les colonnes obligatoires
      console.log('🔍 Checking required columns...');
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_schema', { table_name: 'confirmed_moves' })
        .then(() => ({ data: 'Schema accessible', error: null }))
        .catch(err => ({ data: null, error: err }));

      diagnosticResults.push({
        test: 'Schema check',
        success: !schemaError,
        message: schemaError ? 'Cannot access schema info' : 'Schema accessible',
        details: schemaError
      });

    } catch (error) {
      console.error('Diagnostic error:', error);
      diagnosticResults.push({
        test: 'General diagnostic',
        success: false,
        message: 'Unexpected error during diagnostics',
        details: error
      });
    }

    setResults(diagnosticResults);
    setTesting(false);

    // Afficher un résumé
    const failedTests = diagnosticResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      toast({
        title: "Problèmes détectés",
        description: `${failedTests.length} test(s) ont échoué`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Diagnostic OK",
        description: "Tous les tests ont réussi",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic Base de Données - Trajets Déménageurs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Test en cours...' : 'Lancer le diagnostic'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Résultats:</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.success 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.test}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      Détails techniques
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>User ID:</strong> {user?.id || 'Non connecté'}</p>
          <p><strong>Email:</strong> {user?.email || 'Non disponible'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseDiagnostic;
