
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, MapPin, Calendar, Volume2, Edit, Trash2 } from 'lucide-react';

interface Move {
  id: number;
  moverName: string;
  truckIdentifier: string;
  departureDate: string;
  departureCity: string;
  departurePostal: string;
  arrivalCity: string;
  arrivalPostal: string;
  maxVolume: number;
  usedVolume: number;
  status: 'confirmed' | 'pending' | 'completed';
}

const MoveManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [moves, setMoves] = useState<Move[]>([
    {
      id: 1,
      moverName: "Transport Solutions Pro",
      truckIdentifier: "TSP-001",
      departureDate: "2024-06-15",
      departureCity: "Paris",
      departurePostal: "75001",
      arrivalCity: "Lyon",
      arrivalPostal: "69001",
      maxVolume: 25.0,
      usedVolume: 12.5,
      status: 'confirmed'
    },
    {
      id: 2,
      moverName: "Express Déménagement",
      truckIdentifier: "EXP-042",
      departureDate: "2024-06-18",
      departureCity: "Marseille",
      departurePostal: "13001",
      arrivalCity: "Nice",
      arrivalPostal: "06000",
      maxVolume: 18.0,
      usedVolume: 18.0,
      status: 'confirmed'
    },
    {
      id: 3,
      moverName: "Move Master",
      truckIdentifier: "MM-123",
      departureDate: "2024-06-20",
      departureCity: "Toulouse",
      departurePostal: "31000",
      arrivalCity: "Bordeaux",
      arrivalPostal: "33000",
      maxVolume: 30.0,
      usedVolume: 8.2,
      status: 'pending'
    }
  ]);

  const [formData, setFormData] = useState({
    moverName: '',
    truckIdentifier: '',
    departureDate: '',
    departureCity: '',
    departurePostal: '',
    arrivalCity: '',
    arrivalPostal: '',
    maxVolume: '',
    usedVolume: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMove: Move = {
      id: moves.length + 1,
      ...formData,
      maxVolume: parseFloat(formData.maxVolume),
      usedVolume: parseFloat(formData.usedVolume),
      status: 'confirmed'
    };
    setMoves([...moves, newMove]);
    setFormData({
      moverName: '',
      truckIdentifier: '',
      departureDate: '',
      departureCity: '',
      departurePostal: '',
      arrivalCity: '',
      arrivalPostal: '',
      maxVolume: '',
      usedVolume: ''
    });
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'yellow';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            Gestion des Déménagements
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-2"
          >
            Gérez les trajets confirmés et planifiez de nouveaux déménagements
          </motion.p>
        </div>
        
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau trajet</span>
        </motion.button>
      </div>

      {/* Add Move Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter un nouveau trajet</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du déménageur
              </label>
              <input
                type="text"
                value={formData.moverName}
                onChange={(e) => setFormData({...formData, moverName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identifiant camion
              </label>
              <input
                type="text"
                value={formData.truckIdentifier}
                onChange={(e) => setFormData({...formData, truckIdentifier: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de départ
              </label>
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume maximum (m³)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.maxVolume}
                onChange={(e) => setFormData({...formData, maxVolume: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville de départ
              </label>
              <input
                type="text"
                value={formData.departureCity}
                onChange={(e) => setFormData({...formData, departureCity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal départ
              </label>
              <input
                type="text"
                value={formData.departurePostal}
                onChange={(e) => setFormData({...formData, departurePostal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville d'arrivée
              </label>
              <input
                type="text"
                value={formData.arrivalCity}
                onChange={(e) => setFormData({...formData, arrivalCity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal arrivée
              </label>
              <input
                type="text"
                value={formData.arrivalPostal}
                onChange={(e) => setFormData({...formData, arrivalPostal: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="md:col-span-2 flex space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Ajouter le trajet
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Moves Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {moves.map((move, index) => (
          <motion.div
            key={move.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Status Badge */}
            <div className="relative p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="absolute top-4 right-4">
                <span className={`bg-${getStatusColor(move.status)}-100 text-${getStatusColor(move.status)}-800 px-2 py-1 rounded-full text-xs font-medium`}>
                  {getStatusLabel(move.status)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{move.moverName}</h3>
                  <p className="text-sm text-gray-500">{move.truckIdentifier}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Date */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{new Date(move.departureDate).toLocaleDateString('fr-FR')}</span>
              </div>

              {/* Route */}
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{move.departureCity} → {move.arrivalCity}</span>
              </div>

              {/* Volume Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Volume utilisé</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {move.usedVolume}m³ / {move.maxVolume}m³
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(move.usedVolume / move.maxVolume) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    className={`h-full rounded-full ${
                      (move.usedVolume / move.maxVolume) > 0.9 
                        ? 'bg-red-500' 
                        : (move.usedVolume / move.maxVolume) > 0.7 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button className="flex-1 flex items-center justify-center space-x-1 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <Edit className="h-4 w-4" />
                  <span className="text-sm">Modifier</span>
                </button>
                <button className="flex items-center justify-center p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MoveManagement;
