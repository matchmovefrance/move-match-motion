
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, Building, Phone, Mail, Edit, Trash2, Calendar } from 'lucide-react';

interface Mover {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  trucks: Truck[];
  totalMoves: number;
  rating: number;
}

interface Truck {
  id: number;
  identifier: string;
  maxVolume: number;
  status: 'available' | 'busy' | 'maintenance';
}

const MoverList = () => {
  const [showForm, setShowForm] = useState(false);
  const [movers, setMovers] = useState<Mover[]>([
    {
      id: 1,
      name: "Pierre Durand",
      email: "p.durand@transportsolutions.fr",
      phone: "06 12 34 56 78",
      companyName: "Transport Solutions Pro",
      trucks: [
        { id: 1, identifier: "TSP-001", maxVolume: 25.0, status: 'busy' },
        { id: 2, identifier: "TSP-002", maxVolume: 18.5, status: 'available' }
      ],
      totalMoves: 145,
      rating: 4.8
    },
    {
      id: 2,
      name: "Marc Leroy",
      email: "m.leroy@expressdemenagement.fr",
      phone: "06 98 76 54 32",
      companyName: "Express Déménagement",
      trucks: [
        { id: 3, identifier: "EXP-042", maxVolume: 18.0, status: 'busy' },
        { id: 4, identifier: "EXP-043", maxVolume: 30.0, status: 'available' },
        { id: 5, identifier: "EXP-044", maxVolume: 22.0, status: 'maintenance' }
      ],
      totalMoves: 289,
      rating: 4.6
    },
    {
      id: 3,
      name: "Sophie Moreau",
      email: "s.moreau@movemaster.fr",
      phone: "06 11 22 33 44",
      companyName: "Move Master",
      trucks: [
        { id: 6, identifier: "MM-123", maxVolume: 30.0, status: 'available' },
        { id: 7, identifier: "MM-124", maxVolume: 25.0, status: 'available' }
      ],
      totalMoves: 97,
      rating: 4.9
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    truckIdentifier: '',
    maxVolume: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMover: Mover = {
      id: movers.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName,
      trucks: [
        {
          id: Date.now(),
          identifier: formData.truckIdentifier,
          maxVolume: parseFloat(formData.maxVolume),
          status: 'available'
        }
      ],
      totalMoves: 0,
      rating: 5.0
    };
    setMovers([...movers, newMover]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      truckIdentifier: '',
      maxVolume: ''
    });
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'busy': return 'red';
      case 'maintenance': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Occupé';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
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
            Gestion des Déménageurs
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-2"
          >
            Gérez votre réseau de déménageurs et leurs véhicules
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
          <span>Nouveau déménageur</span>
        </motion.button>
      </div>

      {/* Add Mover Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter un nouveau déménageur</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identifiant du camion
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
                Ajouter le déménageur
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Movers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {movers.map((mover, index) => (
          <motion.div
            key={mover.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Mover Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{mover.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{mover.companyName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    {renderStars(mover.rating)}
                    <span className="text-sm text-gray-600 ml-2">{mover.rating}</span>
                  </div>
                  <p className="text-sm text-gray-500">{mover.totalMoves} déménagements</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{mover.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{mover.phone}</span>
                </div>
              </div>

              {/* Trucks */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Véhicules ({mover.trucks.length})</h4>
                <div className="space-y-2">
                  {mover.trucks.map((truck) => (
                    <div key={truck.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Truck className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{truck.identifier}</p>
                          <p className="text-xs text-gray-500">{truck.maxVolume}m³</p>
                        </div>
                      </div>
                      <span className={`bg-${getStatusColor(truck.status)}-100 text-${getStatusColor(truck.status)}-800 px-2 py-1 rounded-full text-xs font-medium`}>
                        {getStatusLabel(truck.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center space-x-1 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Planning</span>
                </button>
                <button className="flex items-center justify-center space-x-1 px-3 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
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

export default MoverList;
