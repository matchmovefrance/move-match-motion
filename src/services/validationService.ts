
import { supabase } from '@/integrations/supabase/client';
import { mainAppApi } from './mainAppApi';

interface ValidationResult {
  status: 'success' | 'partial' | 'error';
  validation: {
    hasPricingButton: boolean;
    dbConnected: boolean;
    clientsLoaded: number;
    priceComparisonsWorking: boolean;
    mainAppConnected: boolean;
    suppliersLoaded: number;
  };
  errors?: string[];
  warnings?: string[];
}

class ValidationService {
  /**
   * Validation complète du Pricing Tool
   */
  async validatePricingTool(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validation = {
      hasPricingButton: false,
      dbConnected: false,
      clientsLoaded: 0,
      priceComparisonsWorking: false,
      mainAppConnected: false,
      suppliersLoaded: 0
    };

    try {
      // 1. Vérifier la présence du bouton de pricing
      console.log('🔍 Test 1: Vérification du bouton de pricing...');
      validation.hasPricingButton = this.checkPricingButtonExists();
      
      if (!validation.hasPricingButton) {
        errors.push('Bouton "Trouver des prix" manquant dans l\'interface');
      }

      // 2. Tester la connexion à la base de données locale
      console.log('🔍 Test 2: Connexion base de données locale...');
      const dbResult = await this.testLocalDatabase();
      validation.dbConnected = dbResult.connected;
      validation.clientsLoaded = dbResult.clientsCount;
      
      if (!validation.dbConnected) {
        errors.push('Connexion à la base de données locale échouée');
      }

      // 3. Tester la connexion à la MAIN APP
      console.log('🔍 Test 3: Connexion MAIN APP...');
      validation.mainAppConnected = await this.testMainAppConnection();
      
      if (!validation.mainAppConnected) {
        warnings.push('MAIN APP indisponible - mode fallback activé');
      }

      // 4. Charger et vérifier les fournisseurs
      console.log('🔍 Test 4: Chargement des fournisseurs...');
      const suppliersResult = await this.testSuppliersLoading();
      validation.suppliersLoaded = suppliersResult.count;
      
      if (validation.suppliersLoaded === 0) {
        errors.push('Aucun fournisseur disponible pour les comparaisons');
      }

      // 5. Tester le workflow de comparaison de prix
      console.log('🔍 Test 5: Workflow comparaison de prix...');
      validation.priceComparisonsWorking = await this.testPriceComparisons();
      
      if (!validation.priceComparisonsWorking) {
        errors.push('Système de comparaison de prix défaillant');
      }

      // Déterminer le statut global
      let status: 'success' | 'partial' | 'error' = 'success';
      
      if (errors.length > 0) {
        status = 'error';
      } else if (warnings.length > 0) {
        status = 'partial';
      }

      const result: ValidationResult = {
        status,
        validation,
        ...(errors.length > 0 && { errors }),
        ...(warnings.length > 0 && { warnings })
      };

      console.log('✅ Validation terminée:', result);
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      return {
        status: 'error',
        validation,
        errors: [`Erreur critique de validation: ${error.message}`]
      };
    }
  }

  /**
   * Vérifie la présence du bouton de pricing dans le DOM
   */
  private checkPricingButtonExists(): boolean {
    try {
      // Vérifier par ID
      const buttonById = document.getElementById('pricing-submit');
      
      // Vérifier par data-testid
      const buttonByTestId = document.querySelector('[data-testid="find-prices-button"]');
      
      // Vérifier par texte du bouton
      const buttonByText = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent?.includes('TROUVER DES PRIX'));

      const exists = !!(buttonById || buttonByTestId || buttonByText);
      
      console.log(`🔘 Bouton pricing trouvé: ${exists}`);
      if (exists) {
        console.log('🔘 Méthodes de détection:', {
          byId: !!buttonById,
          byTestId: !!buttonByTestId,
          byText: !!buttonByText
        });
      }
      
      return exists;
    } catch (error) {
      console.error('Erreur lors de la vérification du bouton:', error);
      return false;
    }
  }

  /**
   * Teste la connexion à la base de données locale
   */
  private async testLocalDatabase(): Promise<{ connected: boolean; clientsCount: number }> {
    try {
      // Test de connexion avec timeout
      const { data: opportunities, error: oppError } = await supabase
        .from('pricing_opportunities')
        .select('id')
        .limit(1);

      if (oppError) {
        console.error('❌ Erreur DB opportunities:', oppError);
        return { connected: false, clientsCount: 0 };
      }

      // Compter les clients
      const { count: clientsCount, error: countError } = await supabase
        .from('client_requests')
        .select('id', { count: 'exact' });

      if (countError) {
        console.warn('⚠️ Erreur lors du comptage des clients:', countError);
      }

      console.log('✅ DB locale connectée, clients trouvés:', clientsCount || 0);
      return { 
        connected: true, 
        clientsCount: clientsCount || 0 
      };

    } catch (error) {
      console.error('❌ Erreur de connexion DB locale:', error);
      return { connected: false, clientsCount: 0 };
    }
  }

  /**
   * Teste la connexion à la MAIN APP
   */
  private async testMainAppConnection(): Promise<boolean> {
    try {
      return await mainAppApi.testConnection();
    } catch (error) {
      console.error('❌ Test connexion MAIN APP échoué:', error);
      return false;
    }
  }

  /**
   * Teste le chargement des fournisseurs
   */
  private async testSuppliersLoading(): Promise<{ count: number }> {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('id')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erreur chargement fournisseurs:', error);
        return { count: 0 };
      }

      const count = suppliers?.length || 0;
      console.log(`🏢 Fournisseurs actifs: ${count}`);
      
      return { count };

    } catch (error) {
      console.error('❌ Erreur test fournisseurs:', error);
      return { count: 0 };
    }
  }

  /**
   * Teste le système de comparaison de prix
   */
  private async testPriceComparisons(): Promise<boolean> {
    try {
      // Test avec des données simulées
      const mockOpportunity = {
        id: 'test-opportunity',
        title: 'Test Validation',
        estimated_volume: 20,
        departure_city: 'Paris',
        arrival_city: 'Lyon'
      };

      // Tenter de générer des devis de test
      const quotes = await mainAppApi.requestQuotes(mockOpportunity);
      
      const working = Array.isArray(quotes) && quotes.length > 0;
      console.log(`💰 Test comparaison prix: ${working ? 'OK' : 'FAILED'}, devis: ${quotes.length}`);
      
      return working;

    } catch (error) {
      console.error('❌ Test comparaison prix échoué:', error);
      return false;
    }
  }

  /**
   * Génère un rapport de validation pour l'utilisateur
   */
  generateValidationReport(result: ValidationResult): string {
    const { status, validation, errors, warnings } = result;
    
    let report = `🔧 RAPPORT DE VALIDATION PRICING TOOL\n`;
    report += `Status global: ${status.toUpperCase()}\n\n`;
    
    report += `✅ Vérifications:\n`;
    report += `  - Bouton pricing visible: ${validation.hasPricingButton ? 'OUI' : 'NON'}\n`;
    report += `  - Base de données connectée: ${validation.dbConnected ? 'OUI' : 'NON'}\n`;
    report += `  - Clients chargés: ${validation.clientsLoaded}\n`;
    report += `  - MAIN APP connectée: ${validation.mainAppConnected ? 'OUI' : 'NON'}\n`;
    report += `  - Fournisseurs disponibles: ${validation.suppliersLoaded}\n`;
    report += `  - Comparaisons prix fonctionnelles: ${validation.priceComparisonsWorking ? 'OUI' : 'NON'}\n\n`;
    
    if (errors && errors.length > 0) {
      report += `❌ ERREURS CRITIQUES:\n`;
      errors.forEach(error => report += `  - ${error}\n`);
      report += `\n`;
    }
    
    if (warnings && warnings.length > 0) {
      report += `⚠️ AVERTISSEMENTS:\n`;
      warnings.forEach(warning => report += `  - ${warning}\n`);
      report += `\n`;
    }
    
    report += `📊 JSON de validation:\n`;
    report += JSON.stringify({ status, validation }, null, 2);
    
    return report;
  }
}

// Instance singleton
export const validationService = new ValidationService();

// Export pour les tests
export { ValidationService };
export type { ValidationResult };
