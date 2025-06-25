
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Target, TrendingUp, CheckCircle, AlertCircle, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ClientToClientMatchingService } from '@/services/ClientToClientMatchingService';
import { SimpleMatchingService } from '@/services/SimpleMatchingService';

interface GlobalMatchData {
  clientToClient: {
    matches: any[];
    totalMatches: number;
    validMatches: number;
    potentialSavings: number;
  };
  clientToMover: {
    matches: any[];
    totalMatches: number;
    validMatches: number;
    coverageRate: number;
  };
  summary: {
    totalClients: number;
    matchedClients: number;
    unmatchedClients: number;
    overallEfficiency: number;
  };
}

export const GlobalMatchReport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GlobalMatchData | null>(null);
  const [activeReportTab, setActiveReportTab] = useState('summary');

  useEffect(() => {
    generateGlobalReport();
  }, []);

  const generateGlobalReport = async () => {
    try {
      setLoading(true);
      console.log('🔍 Génération du rapport global de matching...');

      // Recherche client-à-client
      const clientToClientMatches = await ClientToClientMatchingService.findClientToClientMatches();
      
      // Recherche client-déménageur
      const clientToMoverMatches = await SimpleMatchingService.findClientToMoverMatches();

      // Calculs des statistiques
      const validC2CMatches = clientToClientMatches.filter(m => m.is_valid);
      const validC2MMatches = clientToMoverMatches.filter(m => m.is_valid);
      
      const totalPotentialSavings = clientToClientMatches.reduce((sum, match) => 
        sum + match.savings_estimate.cost_reduction_percent, 0
      );

      const reportData: GlobalMatchData = {
        clientToClient: {
          matches: clientToClientMatches,
          totalMatches: clientToClientMatches.length,
          validMatches: validC2CMatches.length,
          potentialSavings: Math.round(totalPotentialSavings / Math.max(clientToClientMatches.length, 1))
        },
        clientToMover: {
          matches: clientToMoverMatches,
          totalMatches: clientToMoverMatches.length,
          validMatches: validC2MMatches.length,
          coverageRate: Math.round((validC2MMatches.length / Math.max(clientToMoverMatches.length, 1)) * 100)
        },
        summary: {
          totalClients: 0, // Will be calculated from unique clients
          matchedClients: 0,
          unmatchedClients: 0,
          overallEfficiency: Math.round(((validC2CMatches.length + validC2MMatches.length) / 
            Math.max(clientToClientMatches.length + clientToMoverMatches.length, 1)) * 100)
        }
      };

      setData(reportData);

      toast({
        title: "Rapport généré",
        description: `${reportData.clientToClient.totalMatches + reportData.clientToMover.totalMatches} correspondances analysées`,
      });

    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport global",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Génération du rapport global...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Erreur de génération</h3>
          <p className="text-gray-500">Impossible de générer le rapport global</p>
          <Button onClick={generateGlobalReport} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Matches C2C</p>
                <p className="text-2xl font-bold text-purple-900">{data.clientToClient.validMatches}</p>
                <p className="text-xs text-purple-600">sur {data.clientToClient.totalMatches} trouvés</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Matches C2M</p>
                <p className="text-2xl font-bold text-blue-900">{data.clientToMover.validMatches}</p>
                <p className="text-xs text-blue-600">sur {data.clientToMover.totalMatches} trouvés</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Efficacité</p>
                <p className="text-2xl font-bold text-green-900">{data.summary.overallEfficiency}%</p>
                <p className="text-xs text-green-600">taux de réussite</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Économies</p>
                <p className="text-2xl font-bold text-orange-900">{data.clientToClient.potentialSavings}%</p>
                <p className="text-xs text-orange-600">moy. réduction coût</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rapport détaillé par onglets */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">
            <PieChart className="h-4 w-4 mr-2" />
            Résumé
          </TabsTrigger>
          <TabsTrigger value="client-to-client">
            <Users className="h-4 w-4 mr-2" />
            Client-à-Client
          </TabsTrigger>
          <TabsTrigger value="client-to-mover">
            <Target className="h-4 w-4 mr-2" />
            Client-Déménageur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Résumé Exécutif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Performance Globale</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total correspondances trouvées:</span>
                      <Badge variant="outline">{data.clientToClient.totalMatches + data.clientToMover.totalMatches}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Correspondances valides:</span>
                      <Badge className="bg-green-100 text-green-800">{data.clientToClient.validMatches + data.clientToMover.validMatches}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de réussite global:</span>
                      <Badge className="bg-purple-100 text-purple-800">{data.summary.overallEfficiency}%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Répartition par Type</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Groupages client-à-client:</span>
                      <Badge className="bg-purple-100 text-purple-800">{data.clientToClient.validMatches}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Matches client-déménageur:</span>
                      <Badge className="bg-blue-100 text-blue-800">{data.clientToMover.validMatches}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Économies moyennes estimées:</span>
                      <Badge className="bg-green-100 text-green-800">{data.clientToClient.potentialSavings}%</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-800 mb-3">Recommandations</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>
                      {data.clientToClient.validMatches > 0 ? 
                        `${data.clientToClient.validMatches} groupages client-à-client identifiés avec économies potentielles` :
                        'Aucun groupage client-à-client possible actuellement'
                      }
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>
                      {data.clientToMover.validMatches > 0 ? 
                        `${data.clientToMover.validMatches} correspondances client-déménageur disponibles` :
                        'Élargir le réseau de déménageurs pour améliorer la couverture'
                      }
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>
                      Taux d'efficacité de {data.summary.overallEfficiency}% - 
                      {data.summary.overallEfficiency > 70 ? ' Excellent' : 
                       data.summary.overallEfficiency > 50 ? ' Bon' : ' À améliorer'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client-to-client">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Analyse Client-à-Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {data.clientToClient.totalMatches} correspondances analysées, 
                {data.clientToClient.validMatches} groupages possibles identifiés.
              </p>
              {data.clientToClient.matches.length > 0 ? (
                <div className="text-sm text-gray-600">
                  Utiliser l'onglet "Client-à-Client" pour voir les détails des correspondances.
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune correspondance client-à-client trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client-to-mover">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Analyse Client-Déménageur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {data.clientToMover.totalMatches} correspondances analysées, 
                {data.clientToMover.validMatches} matches valides identifiés 
                (taux de couverture: {data.clientToMover.coverageRate}%).
              </p>
              {data.clientToMover.matches.length > 0 ? (
                <div className="text-sm text-gray-600">
                  Utiliser l'onglet "Client-Déménageur" pour voir les détails des correspondances.
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune correspondance client-déménageur trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
