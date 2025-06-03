
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Volume2, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { ListView } from '@/components/ui/list-view';

interface Match {
  id: number;
  moveId: number;
  requestId: number;
  clientName: string;
  moveName: string;
  distanceKm: number;
  dateDiffDays: number;
  combinedVolume: number;
  type: 'grouped' | 'return' | 'loop';
  departureCity: string;
  arrivalCity: string;
  matchScore: number;
}

const MatchFinder = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [acceptedMatches, setAcceptedMatches] = useState<number[]>([]);
  const [rejectedMatches, setRejectedMatches] = useState<number[]>([]);
  const [showListView, setShowListView] = useState(false);

  // Mock data for demonstration
  const mockMatches: Match[] = [
    {
      id: 1,
      moveId: 1,
      requestId: 1,
      clientName: "Marie Dubois",
      moveName: "Transport Solutions Pro",
      distanceKm: 45,
      dateDiffDays: 3,
      combinedVolume: 18.5,
      type: 'grouped',
      departureCity: "Paris",
      arrivalCity: "Lyon",
      matchScore: 92
    },
    {
      id: 2,
      moveId: 2,
      requestId: 2,
      clientName: "Jean Martin",
      moveName: "Express Déménagement",
      distanceKm: 25,
      dateDiffDays: 1,
      combinedVolume: 12.0,
      type: 'return',
      departureCity: "Marseille",
      arrivalCity: "Nice",
      matchScore: 88
    },
    {
      id: 3,
      moveId: 3,
      requestId: 3,
      clientName: "Sophie Laurent",
      moveName: "Move Master",
      distanceKm: 78,
      dateDiffDays: 7,
      combinedVolume: 22.3,
      type: 'loop',
      departureCity: "Toulouse",
      arrivalCity: "Bordeaux",
      matchScore: 76
    }
  ];

  const findMatches = async () => {
    setIsSearching(true);
    setCurrentMatchIndex(0);
    setAcceptedMatches([]);
    setRejectedMatches([]);
    
    // Simulate API call with loading animation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setMatches(mockMatches);
    setIsSearching(false);
    setShowListView(true);
  };

  const handleAccept = (matchId: number) => {
    setAcceptedMatches(prev => [...prev, matchId]);
    setCurrentMatchIndex(prev => prev + 1);
  };

  const handleReject = (matchId: number) => {
    setRejectedMatches(prev => [...prev, matchId]);
    setCurrentMatchIndex(prev => prev + 1);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'grouped': return 'Trajet groupé';
      case 'return': return 'Trajet retour';
      case 'loop': return 'Boucle optimisée';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grouped': return 'blue';
      case 'return': return 'green';
      case 'loop': return 'purple';
      default: return 'gray';
    }
  };

  const renderMatchCard = (match: Match) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`bg-${getTypeColor(match.type)}-100 text-${getTypeColor(match.type)}-800 px-3 py-1 rounded-full text-sm font-medium`}>
          {getTypeLabel(match.type)}
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">{match.matchScore}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-semibold text-gray-800">{match.clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Déménageur</p>
            <p className="font-semibold text-gray-800">{match.moveName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{match.departureCity} → {match.arrivalCity}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500">Distance</p>
            <p className="font-semibold text-gray-800">{match.distanceKm} km</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Décalage</p>
            <p className="font-semibold text-gray-800">{match.dateDiffDays}j</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Volume</p>
            <p className="font-semibold text-gray-800">{match.combinedVolume}m³</p>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <button
            onClick={() => handleReject(match.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Rejeter</span>
          </button>
          
          <button
            onClick={() => handleAccept(match.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
          >
            <Check className="h-4 w-4" />
            <span>Accepter</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderMatchListItem = (match: Match) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">{match.matchScore}%</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{match.clientName}</h4>
            <p className="text-sm text-gray-600">{match.moveName}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{match.departureCity} → {match.arrivalCity}</span>
          </div>
          <div className={`bg-${getTypeColor(match.type)}-100 text-${getTypeColor(match.type)}-800 px-2 py-1 rounded-full text-xs font-medium`}>
            {getTypeLabel(match.type)}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => handleReject(match.id)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
        >
          Rejeter
        </button>
        <button
          onClick={() => handleAccept(match.id)}
          className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded hover:from-green-600 hover:to-blue-600 transition-all text-sm"
        >
          Accepter
        </button>
      </div>
    </div>
  );

  const currentMatch = matches[currentMatchIndex];
  const hasMoreMatches = currentMatchIndex < matches.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-800 mb-4"
        >
          Recherche de Matchs Intelligente
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 mb-8"
        >
          Notre algorithme analyse les trajets et trouve les meilleures optimisations
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={findMatches}
          disabled={isSearching}
          className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>{isSearching ? 'Recherche en cours...' : 'Lancer la recherche'}</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </div>

      {/* Loading Animation */}
      {isSearching && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6"
          >
            <Search className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
          />
          
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-gray-600 text-center"
          >
            Analyse des trajets en cours...<br />
            Calcul des optimisations possibles...
          </motion.p>
        </motion.div>
      )}

      {/* Results with ListView */}
      {!isSearching && matches.length > 0 && showListView && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Résultats de matching</h3>
            <div className="text-sm text-gray-500">
              {acceptedMatches.length} accepté(s) • {rejectedMatches.length} rejeté(s)
            </div>
          </div>
          
          <ListView
            items={matches}
            searchFields={['clientName', 'moveName', 'departureCity', 'arrivalCity', 'type']}
            renderCard={renderMatchCard}
            renderListItem={renderMatchListItem}
            searchPlaceholder="Rechercher par client, déménageur, ville..."
            emptyStateMessage="Aucun match trouvé"
            emptyStateIcon={<Search className="h-12 w-12 text-gray-400 mx-auto" />}
            itemsPerPage={6}
          />
        </div>
      )}
    </div>
  );
};

export default MatchFinder;
