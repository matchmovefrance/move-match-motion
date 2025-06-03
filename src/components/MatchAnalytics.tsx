
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, Clock, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MatchActionData {
  id: string;
  match_id: number;
  action_type: string;
  action_date: string;
  user_id: string;
  notes: string;
}

interface AnalyticsData {
  totalMatches: number;
  acceptedMatches: number;
  rejectedMatches: number;
  acceptanceRate: number;
  averageScore: number;
  actionsToday: number;
  topPerformers: Array<{ name: string; actions: number }>;
  matchTypeDistribution: Array<{ type: string; count: number; color: string }>;
  dailyActivity: Array<{ date: string; accepted: number; rejected: number }>;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

const MatchAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalMatches: 0,
    acceptedMatches: 0,
    rejectedMatches: 0,
    acceptanceRate: 0,
    averageScore: 0,
    actionsToday: 0,
    topPerformers: [],
    matchTypeDistribution: [],
    dailyActivity: []
  });
  const [matchActions, setMatchActions] = useState<MatchActionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les actions de matching
      const { data: actions, error: actionsError } = await supabase
        .from('match_actions')
        .select('*')
        .order('action_date', { ascending: false });

      if (actionsError) {
        console.error('Erreur lors de la récupération des actions:', actionsError);
        return;
      }

      setMatchActions(actions || []);

      // Récupérer les données de matching existantes
      const { data: matches, error: matchesError } = await supabase
        .from('move_matches')
        .select('*');

      if (matchesError) {
        console.error('Erreur lors de la récupération des matches:', matchesError);
        return;
      }

      // Calculer les statistiques
      const acceptedActions = actions?.filter(action => action.action_type === 'accepted') || [];
      const rejectedActions = actions?.filter(action => action.action_type === 'rejected') || [];
      
      const today = new Date().toISOString().split('T')[0];
      const actionsToday = actions?.filter(action => 
        action.action_date.startsWith(today)
      ).length || 0;

      // Distribution par type de match (simulation basée sur les données réelles)
      const matchTypeDistribution = [
        { type: 'Trajet groupé', count: Math.floor((matches?.length || 0) * 0.4), color: '#10B981' },
        { type: 'Trajet retour', count: Math.floor((matches?.length || 0) * 0.35), color: '#3B82F6' },
        { type: 'Boucle optimisée', count: Math.floor((matches?.length || 0) * 0.25), color: '#8B5CF6' }
      ];

      // Activité quotidienne des 7 derniers jours
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyActivity = last7Days.map(date => {
        const dayActions = actions?.filter(action => action.action_date.startsWith(date)) || [];
        return {
          date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
          accepted: dayActions.filter(a => a.action_type === 'accepted').length,
          rejected: dayActions.filter(a => a.action_type === 'rejected').length
        };
      });

      // Top performers (simulation)
      const topPerformers = [
        { name: 'Marie Dubois', actions: acceptedActions.length > 0 ? Math.floor(acceptedActions.length * 0.3) : 5 },
        { name: 'Jean Martin', actions: acceptedActions.length > 0 ? Math.floor(acceptedActions.length * 0.25) : 4 },
        { name: 'Sophie Laurent', actions: acceptedActions.length > 0 ? Math.floor(acceptedActions.length * 0.2) : 3 }
      ];

      const totalActions = acceptedActions.length + rejectedActions.length;
      const acceptanceRate = totalActions > 0 ? (acceptedActions.length / totalActions) * 100 : 0;

      setAnalyticsData({
        totalMatches: matches?.length || 0,
        acceptedMatches: acceptedActions.length,
        rejectedMatches: rejectedActions.length,
        acceptanceRate,
        averageScore: 85, // Score moyen simulé
        actionsToday,
        topPerformers,
        matchTypeDistribution,
        dailyActivity
      });

    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics des Matchs</h2>
        <button 
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalMatches}</div>
            <p className="text-xs text-muted-foreground">Matchs disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Acceptation</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.acceptedMatches} acceptés / {analyticsData.acceptedMatches + analyticsData.rejectedMatches} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analyticsData.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Qualité des matchs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Aujourd'hui</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analyticsData.actionsToday}</div>
            <p className="text-xs text-muted-foreground">Décisions prises</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution par type de match */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par Type de Match</CardTitle>
            <CardDescription>Répartition des différents types de trajets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.matchTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.matchTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activité quotidienne */}
        <Card>
          <CardHeader>
            <CardTitle>Activité des 7 Derniers Jours</CardTitle>
            <CardDescription>Évolution des acceptations et rejets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accepted" fill="#10B981" name="Acceptés" />
                <Bar dataKey="rejected" fill="#EF4444" name="Rejetés" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Récentes</CardTitle>
          <CardDescription>Dernières décisions prises sur les matchs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matchActions.slice(0, 10).map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {action.action_type === 'accepted' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      Match #{action.match_id} {action.action_type === 'accepted' ? 'accepté' : 'rejeté'}
                    </p>
                    <p className="text-sm text-gray-600">{action.notes}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(action.action_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
            
            {matchActions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune action enregistrée pour le moment</p>
                <p className="text-sm">Les actions d'acceptation/rejet apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Utilisateurs les plus actifs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{performer.name}</span>
                </div>
                <Badge variant="secondary">{performer.actions} actions</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchAnalytics;
