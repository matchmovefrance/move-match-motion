
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, MapPin, Calendar, Volume2, Phone, Mail, Edit, Trash2 } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  requests: ClientRequest[];
}

interface ClientRequest {
  id: number;
  desiredDate: string;
  departureCity: string;
  departurePostal: string;
  arrivalCity: string;
  arrivalPostal: string;
  requiredVolume: number;
  status: 'pending' | 'matched' | 'completed';
}

const ClientList = () => {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "Marie Dubois",
      email: "marie.dubois@email.com",
      phone: "06 12 34 56 78",
      requests: [
        {
          id: 1,
          desiredDate: "2024-06-16",
          departureCity: "Paris",
          departurePostal: "75008",
          arrivalCity: "Lyon",
          arrivalPostal: "69002",
          requiredVolume: 6.0,
          status: 'pending'
        }
      ]
    },
    {
      id: 2,
      name: "Jean Martin",
      email: "jean.martin@email.com",
      phone: "06 98 76 54 32",
      requests: [
        {
          id: 2,
          desiredDate: "2024-06-19",
          departureCity: "Marseille",
          departurePostal: "13008",
          arrivalCity: "Nice",
          arrivalPostal: "06300",
          requiredVolume: 4.5,
          status: 'matched'
        }
      ]
    },
    {
      id: 3,
      name: "Sophie Laurent",
      email: "sophie.laurent@email.com",
      phone: "06 11 22 33 44",
      requests: [
        {
          id: 3,
          desiredDate: "2024-06-22",
          departureCity: "Toulouse",
          departurePostal: "31000",
          arrivalCity: "Bordeaux",
          arrivalPostal: "33000",
          requiredVolume: 8.2,
          status: 'pending'
        }
      ]
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    desiredDate: '',
    departureCity: '',
    departurePostal: '',
    arrivalCity: '',
    arrivalPostal: '',
    requiredVolume: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: clients.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      requests: [
        {
          id: clients.length + 1,
          desiredDate: formData.desiredDate,
          departureCity: formData.departureCity,
          departurePostal: formData.departurePostal,
          arrivalCity: formData.arrivalCity,
          arrivalPostal: formData.arrivalPostal,
          requiredVolume: parseFloat(formData.requiredVolume),
          status: 'pending'
        }
      ]
    };
    setClients([...clients, newClient]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      desiredDate: '',
      departureCity: '',
      departurePostal: '',
      arrivalCity: '',
      arrivalPostal: '',
      requiredVolume: ''
    });
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'matched': return 'green';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'matched': return 'Matché';
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
            Gestion des Clients
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-2"
          >
            Gérez vos clients et leurs demandes de déménagement
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
          <span>Nouveau client</span>
        </motion.button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter un nouveau client</h3>
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
                Date souhaitée
              </label>
              <input
                type="date"
                value={formData.desiredDate}
                onChange={(e) => setFormData({...formData, desiredDate: e.target.value})}
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
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume requis (m³)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.requiredVolume}
                onChange={(e) => setFormData({...formData, requiredVolume: e.target.value})}
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
                Ajouter le client
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Client Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.requests.length} demande(s)</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{client.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              </div>

              {/* Requests */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Demandes de déménagement</h4>
                {client.requests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-800 px-2 py-1 rounded-full text-xs font-medium`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(request.desiredDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{request.departureCity} → {request.arrivalCity}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Volume2 className="h-3 w-3" />
                      <span className="text-xs">{request.requiredVolume}m³</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t border-gray-100">
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

export default ClientList;
