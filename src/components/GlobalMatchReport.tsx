
import { motion } from 'framer-motion';
import { FileText, Users, Target, TrendingUp, CheckCircle, AlertCircle, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GlobalMatchReportProps {
  clientToClientMatches: any[];
  clientToMoverMatches: any[];
}

export const GlobalMatchReport = ({ clientToClientMatches, clientToMoverMatches }: GlobalMatchReportProps) => {
  const validC2CMatches = clientToClientMatches.filter(m => m.is_valid);
  const validC2MMatches = clientToMoverMatches.filter(m => m.is_valid);
  
  const totalPotentialSavings = clientToClientMatches.reduce((sum, match) => 
    sum + match.savings_estimate.cost_reduction_percent, 0
  );

  const reportData = {
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
      totalClients: 0,
      matchedClients: 0,
      unmatchedClients: 0,
      overallEfficiency: Math.round(((validC2CMatches.length + validC2MMatches.length) / 
        Math.max(clientToClientMatches.length + clientToMoverMatches.length, 1)) * 100)
    }
  };

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
                <p className="text-2xl font-bold text-purple-900">{reportData.clientToClient.validMatches}</p>
                <p className="text-xs text-purple-600">sur {reportData.clientToClient.totalMatches} trouvés</p>
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
                <p className="text-2xl font-bold text-blue-900">{reportData.clientToMover.validMatches}</p>
                <p className="text-xs text-blue-600">sur {reportData.clientToMover.totalMatches} trouvés</p>
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
                <p className="text-2xl font-bold text-green-900">{reportData.summary.overallEfficiency}%</p>
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
                <p className="text-2xl font-bold text-orange-900">{reportData.clientToClient.potentialSavings}%</p>
                <p className="text-xs text-orange-600">moy. réduction coût</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé détaillé */}
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
                  <Badge variant="outline">{reportData.clientToClient.totalMatches + reportData.clientToMover.totalMatches}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Correspondances valides:</span>
                  <Badge className="bg-green-100 text-green-800">{reportData.clientToClient.validMatches + reportData.clientToMover.validMatches}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Taux de réussite global:</span>
                  <Badge className="bg-purple-100 text-purple-800">{reportData.summary.overallEfficiency}%</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Répartition par Type</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Groupages client-à-client:</span>
                  <Badge className="bg-purple-100 text-purple-800">{reportData.clientToClient.validMatches}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Matches client-déménageur:</span>
                  <Badge className="bg-blue-100 text-blue-800">{reportData.clientToMover.validMatches}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Économies moyennes estimées:</span>
                  <Badge className="bg-green-100 text-green-800">{reportData.clientToClient.potentialSavings}%</Badge>
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
                  {reportData.clientToClient.validMatches > 0 ? 
                    `${reportData.clientToClient.validMatches} groupages client-à-client identifiés avec économies potentielles` :
                    'Aucun groupage client-à-client possible actuellement'
                  }
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  {reportData.clientToMover.validMatches > 0 ? 
                    `${reportData.clientToMover.validMatches} correspondances client-déménageur disponibles` :
                    'Élargir le réseau de déménageurs pour améliorer la couverture'
                  }
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>
                  Taux d'efficacité de {reportData.summary.overallEfficiency}% - 
                  {reportData.summary.overallEfficiency > 70 ? ' Excellent' : 
                   reportData.summary.overallEfficiency > 50 ? ' Bon' : ' À améliorer'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
