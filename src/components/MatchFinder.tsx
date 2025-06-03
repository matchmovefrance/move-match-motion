
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Volume2, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';

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

      {/* Match Cards */}
      {!isSearching && matches.length > 0 && (
        <div className="relative">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentMatchIndex + 1} / {matches.length}
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentMatchIndex + 1) / matches.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Match Card Stack */}
          <div className="relative h-96 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {hasMoreMatches && currentMatch && (
                <motion.div
                  key={currentMatch.id}
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -50 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md"
                >
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Match Score Badge */}
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="absolute top-4 right-4">
                        <div className={`bg-${getTypeColor(currentMatch.type)}-100 text-${getTypeColor(currentMatch.type)}-800 px-3 py-1 rounded-full text-sm font-medium`}>
                          {getTypeLabel(currentMatch.type)}
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{currentMatch.matchScore}%</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Match trouvé !</h3>
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="font-semibold text-gray-800">{currentMatch.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Déménageur</p>
                          <p className="font-semibold text-gray-800">{currentMatch.moveName}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{currentMatch.departureCity} → {currentMatch.arrivalCity}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Distance</p>
                          <p className="font-semibold text-gray-800">{currentMatch.distanceKm} km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Décalage</p>
                          <p className="font-semibold text-gray-800">{currentMatch.dateDiffDays}j</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Volume</p>
                          <p className="font-semibold text-gray-800">{currentMatch.combinedVolume}m³</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 bg-gray-50 flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(currentMatch.id)}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        <X className="h-5 w-5" />
                        <span>Rejeter</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAccept(currentMatch.id)}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all"
                      >
                        <Check className="h-5 w-5" />
                        <span>Accepter</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No More Matches */}
            {!hasMoreMatches && matches.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Recherche terminée !</h3>
                <p className="text-gray-600 mb-6">
                  {acceptedMatches.length} match(s) accepté(s) sur {matches.length}
                </p>
                <button
                  onClick={findMatches}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
                >
                  Nouvelle recherche
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchFinder;
