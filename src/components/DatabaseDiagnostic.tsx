
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

      // Test 2: Tester une insertion simple avec tous les champs obligatoires
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
        status_custom: 'en_cours',
        // Champs obligatoires manquants
        mover_id: 1,
        truck_id: 1
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

      // Test 3: Vérifier l'accès aux prestataires (table service_providers)
      console.log('🔍 Checking service_providers table...');
      const { data: providersData, error: providersError } = await supabase
        .from('service_providers')
        .select('id, name, company_name')
        .limit(10);

      const serviceProvidersCount = providersData?.length || 0;

      // Test 4: Compter les prestataires depuis les trajets confirmés (comme dans l'onglet prestataires)
      console.log('🔍 Checking providers from confirmed moves...');
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('mover_id, mover_name, company_name, contact_email, contact_phone')
        .not('mover_id', 'is', null);

      let uniqueProvidersFromMoves = 0;
      if (!movesError && movesData) {
        // Créer un Map pour éviter les doublons basés sur mover_name + company_name
        const uniqueSuppliersMap = new Map();
        
        movesData.forEach((move) => {
          const key = `${move.mover_name}-${move.company_name}`;
          if (!uniqueSuppliersMap.has(key)) {
            uniqueSuppliersMap.set(key, true);
          }
        });

        uniqueProvidersFromMoves = uniqueSuppliersMap.size;
      }

      const totalProviders = serviceProvidersCount + uniqueProvidersFromMoves;

      diagnosticResults.push({
        test: 'Service providers accessible',
        success: !providersError,
        message: providersError ? providersError.message : `${serviceProvidersCount} prestataires en DB`,
        details: providersError
      });

      diagnosticResults.push({
        test: 'Prestataires depuis trajets confirmés',
        success: !movesError,
        message: movesError ? movesError.message : `${uniqueProvidersFromMoves} prestataires depuis trajets`,
        details: movesError
      });

      diagnosticResults.push({
        test: 'Total prestataires disponibles',
        success: true,
        message: `${totalProviders} prestataires au total (${serviceProvidersCount} en DB + ${uniqueProvidersFromMoves} depuis trajets)`,
        details: null
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
