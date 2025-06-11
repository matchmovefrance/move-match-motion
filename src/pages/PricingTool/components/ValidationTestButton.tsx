
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validationService } from '@/services/validationService';
import { Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ValidationTestButton = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validationService.validatePricingTool();
      setValidationResult(result);
      console.log('🔧 Résultat de validation détaillé:', result);
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      setValidationResult({
        status: 'error',
        validation: {
          hasPricingButton: false,
          dbConnected: false,
          clientsLoaded: 0,
          priceComparisonsWorking: false,
          mainAppConnected: false,
          suppliersLoaded: 0
        },
        errors: [`Erreur de validation: ${error.message}`]
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Validation du Pricing Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runValidation}
          disabled={isValidating}
          className="w-full"
        >
          {isValidating ? 'Validation en cours...' : 'Lancer la validation complète'}
        </Button>

        {validationResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(validationResult.status)}
              <Badge 
                variant={validationResult.status === 'success' ? 'default' : 
                        validationResult.status === 'partial' ? 'secondary' : 'destructive'}
              >
                {validationResult.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={`p-2 rounded ${validationResult.validation.hasPricingButton ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                ✓ Bouton pricing: {validationResult.validation.hasPricingButton ? 'OUI' : 'NON'}
              </div>
              <div className={`p-2 rounded ${validationResult.validation.dbConnected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                ✓ DB connectée: {validationResult.validation.dbConnected ? 'OUI' : 'NON'}
              </div>
              <div className={`p-2 rounded ${validationResult.validation.clientsLoaded > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                ✓ Clients: {validationResult.validation.clientsLoaded}
              </div>
              <div className={`p-2 rounded ${validationResult.validation.suppliersLoaded > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                ✓ Fournisseurs: {validationResult.validation.suppliersLoaded}
              </div>
            </div>

            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <h4 className="font-bold text-red-800 mb-2">Erreurs:</h4>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-bold text-yellow-800 mb-2">Avertissements:</h4>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="bg-gray-50 border rounded p-3">
              <summary className="font-bold cursor-pointer">JSON Détaillé</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationTestButton;
