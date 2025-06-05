
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DatabaseTestPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [testing, setTesting] = useState(false);

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    try {
      setTesting(true);
      await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: true }));
      toast({
        title: "Test réussi",
        description: `${testName} fonctionne correctement`,
      });
    } catch (error: any) {
      console.error(`Test failed: ${testName}`, error);
      setTestResults(prev => ({ ...prev, [testName]: false }));
      toast({
        title: "Test échoué",
        description: `${testName}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const testClientOperations = async () => {
    console.log('Testing client operations...');
    
    // Test ajout client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: 'Test Client',
        email: `test-client-${Date.now()}@example.com`,
        phone: '0123456789',
        created_by: user?.id
      })
      .select()
      .single();

    if (clientError) throw clientError;
    console.log('Client created:', clientData);

    // Test suppression client
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientData.id);

    if (deleteError) throw deleteError;
    console.log('Client deleted successfully');
  };

  const testMoverOperations = async () => {
    console.log('Testing mover operations...');
    
    // Test ajout déménageur
    const { data: moverData, error: moverError } = await supabase
      .from('movers')
      .insert({
        name: 'Test Mover',
        company_name: 'Test Company',
        email: `test-mover-${Date.now()}@example.com`,
        phone: '0123456789',
        created_by: user?.id
      })
      .select()
      .single();

    if (moverError) throw moverError;
    console.log('Mover created:', moverData);

    // Test suppression déménageur (CASCADE devrait supprimer les camions)
    const { error: deleteError } = await supabase
      .from('movers')
      .delete()
      .eq('id', moverData.id);

    if (deleteError) throw deleteError;
    console.log('Mover deleted successfully');
  };

  const testTruckOperations = async () => {
    console.log('Testing truck operations...');
    
    // Créer un déménageur d'abord
    const { data: moverData, error: moverError } = await supabase
      .from('movers')
      .insert({
        name: 'Test Mover for Truck',
        company_name: 'Test Company',
        email: `test-mover-truck-${Date.now()}@example.com`,
        phone: '0123456789',
        created_by: user?.id
      })
      .select()
      .single();

    if (moverError) throw moverError;

    // Test ajout camion
    const { data: truckData, error: truckError } = await supabase
      .from('trucks')
      .insert({
        mover_id: moverData.id,
        identifier: 'TEST-TRUCK-001',
        max_volume: 50
      })
      .select()
      .single();

    if (truckError) throw truckError;
    console.log('Truck created:', truckData);

    // Test suppression du déménageur (devrait supprimer le camion en CASCADE)
    const { error: deleteError } = await supabase
      .from('movers')
      .delete()
      .eq('id', moverData.id);

    if (deleteError) throw deleteError;
    console.log('Mover and truck deleted successfully via CASCADE');
  };

  const testMoveOperations = async () => {
    console.log('Testing move operations...');
    
    // Créer un déménageur et un camion d'abord
    const { data: moverData, error: moverError } = await supabase
      .from('movers')
      .insert({
        name: 'Test Mover for Move',
        company_name: 'Test Company',
        email: `test-mover-move-${Date.now()}@example.com`,
        phone: '0123456789',
        created_by: user?.id
      })
      .select()
      .single();

    if (moverError) throw moverError;

    const { data: truckData, error: truckError } = await supabase
      .from('trucks')
      .insert({
        mover_id: moverData.id,
        identifier: 'TEST-TRUCK-MOVE-001',
        max_volume: 50
      })
      .select()
      .single();

    if (truckError) throw truckError;

    // Test ajout déménagement
    const { data: moveData, error: moveError } = await supabase
      .from('confirmed_moves')
      .insert({
        mover_id: moverData.id,
        truck_id: truckData.id,
        departure_city: 'Paris',
        departure_postal_code: '75000',
        arrival_city: 'Lyon',
        arrival_postal_code: '69000',
        departure_date: new Date().toISOString().split('T')[0],
        used_volume: 0,
        status: 'confirmed',
        created_by: user?.id
      })
      .select()
      .single();

    if (moveError) throw moveError;
    console.log('Move created:', moveData);

    // Test suppression du déménageur (devrait supprimer tout en CASCADE)
    const { error: deleteError } = await supabase
      .from('movers')
      .delete()
      .eq('id', moverData.id);

    if (deleteError) throw deleteError;
    console.log('Mover, truck, and move deleted successfully via CASCADE');
  };

  const testServiceProviderOperations = async () => {
    console.log('Testing service provider operations...');
    
    // Test ajout fournisseur de service
    const { data: providerData, error: providerError } = await supabase
      .from('service_providers')
      .insert({
        name: 'Test Provider',
        company_name: 'Test Service Company',
        email: `test-provider-${Date.now()}@example.com`,
        phone: '0123456789',
        address: '123 Test Street',
        city: 'Paris',
        postal_code: '75000',
        created_by: user?.id
      })
      .select()
      .single();

    if (providerError) throw providerError;
    console.log('Service provider created:', providerData);

    // Test suppression fournisseur de service
    const { error: deleteError } = await supabase
      .from('service_providers')
      .delete()
      .eq('id', providerData.id);

    if (deleteError) throw deleteError;
    console.log('Service provider deleted successfully');
  };

  const runAllTests = async () => {
    setTestResults({});
    
    await runTest('Clients (Ajout/Suppression)', testClientOperations);
    await runTest('Déménageurs (Ajout/Suppression)', testMoverOperations);
    await runTest('Camions + CASCADE', testTruckOperations);
    await runTest('Déménagements + CASCADE', testMoveOperations);
    await runTest('Fournisseurs de services', testServiceProviderOperations);
    
    toast({
      title: "Tests terminés",
      description: "Tous les tests de base de données sont terminés",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-6 w-6 text-blue-600" />
          <span>Panneau de test de la base de données</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={runAllTests}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? 'Tests en cours...' : 'Lancer tous les tests'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Clients (Ajout/Suppression)',
            'Déménageurs (Ajout/Suppression)',
            'Camions + CASCADE',
            'Déménagements + CASCADE',
            'Fournisseurs de services'
          ].map((testName) => (
            <motion.div
              key={testName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border rounded-lg p-4 space-y-2"
            >
              <h3 className="font-medium text-sm">{testName}</h3>
              <div className="flex items-center space-x-2">
                {testResults[testName] === true && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {testResults[testName] === false && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {testResults[testName] === undefined && (
                  <div className="h-5 w-5 bg-gray-200 rounded-full" />
                )}
                <span className="text-sm text-gray-600">
                  {testResults[testName] === true ? 'Réussi' :
                   testResults[testName] === false ? 'Échoué' : 'En attente'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  switch (testName) {
                    case 'Clients (Ajout/Suppression)':
                      runTest(testName, testClientOperations);
                      break;
                    case 'Déménageurs (Ajout/Suppression)':
                      runTest(testName, testMoverOperations);
                      break;
                    case 'Camions + CASCADE':
                      runTest(testName, testTruckOperations);
                      break;
                    case 'Déménagements + CASCADE':
                      runTest(testName, testMoveOperations);
                      break;
                    case 'Fournisseurs de services':
                      runTest(testName, testServiceProviderOperations);
                      break;
                  }
                }}
                disabled={testing}
                className="w-full"
              >
                Tester
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Instructions de test:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ces tests vérifient que les opérations CRUD fonctionnent correctement</li>
            <li>• Les tests CASCADE vérifient que les suppressions en chaîne fonctionnent</li>
            <li>• Ouvrez la console du navigateur pour voir les détails des opérations</li>
            <li>• Vérifiez dans Supabase que les données sont bien ajoutées et supprimées</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTestPanel;
