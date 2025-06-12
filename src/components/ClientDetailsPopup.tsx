
import React, { useState } from 'react';
import { X, FileDown, Mail, MapPin, Calendar, Volume2, Euro, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmailQuoteButton from './EmailQuoteButton';
import MapPopup from './MapPopup';

interface Client {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  departure_address: string | null;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string | null;
  departure_time: string | null;
  arrival_address: string | null;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string | null;
  desired_date: string;
  estimated_arrival_date: string | null;
  estimated_arrival_time: string | null;
  estimated_volume: number | null;
  description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  quote_amount: number | null;
  special_requirements: string | null;
  access_conditions: string | null;
  inventory_list: string | null;
  status: string;
  is_matched: boolean | null;
  match_status: string | null;
  created_at: string;
  client_reference: string | null;
}

interface ClientDetailsPopupProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const ClientDetailsPopup = ({ client, isOpen, onClose }: ClientDetailsPopupProps) => {
  const [showMapPopup, setShowMapPopup] = useState(false);

  if (!client) return null;

  const prepareMapItems = () => {
    if (!client.departure_postal_code || !client.arrival_postal_code) return [];
    
    return [{
      id: client.id,
      type: 'client' as const,
      reference: client.client_reference || `CLI-${String(client.id).padStart(6, '0')}`,
      name: client.name || 'Client',
      date: client.desired_date ? new Date(client.desired_date).toLocaleDateString('fr-FR') : '',
      details: `${client.departure_postal_code} → ${client.arrival_postal_code}`,
      departure_postal_code: client.departure_postal_code,
      arrival_postal_code: client.arrival_postal_code,
      departure_city: client.departure_city,
      arrival_city: client.arrival_city,
      color: '#16a34a'
    }];
  };

  // Convert client to the format expected by EmailQuoteButton
  const clientForEmailButton = {
    id: client.id,
    name: client.name,
    email: client.email,
    quote_amount: client.quote_amount,
    desired_date: client.desired_date,
    phone: client.phone,
    departure_address: client.departure_address,
    departure_postal_code: client.departure_postal_code,
    departure_city: client.departure_city,
    arrival_address: client.arrival_address,
    arrival_postal_code: client.arrival_postal_code,
    arrival_city: client.arrival_city,
    estimated_volume: client.estimated_volume
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Détails de la demande - {client.name || 'Client non renseigné'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapPopup(true)}
                className="flex items-center space-x-1"
              >
                <MapPin className="h-4 w-4" />
                <span>Voir sur la carte</span>
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations personnelles */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom</label>
                  <p className="text-gray-800">{client.name || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-blue-600">
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="hover:underline">
                        {client.email}
                      </a>
                    ) : 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-blue-600">
                    {client.phone ? (
                      <a href={`tel:${client.phone}`} className="hover:underline">
                        {client.phone}
                      </a>
                    ) : 'Non renseigné'}
                  </p>
                </div>
              </div>
            </div>

            {/* Adresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  Adresse de départ
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-800">{client.departure_address || 'Adresse non renseignée'}</p>
                  <p className="text-gray-800">{client.departure_postal_code} {client.departure_city}</p>
                  <p className="text-gray-600">{client.departure_country || 'France'}</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-red-600" />
                  Adresse d'arrivée
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-800">{client.arrival_address || 'Adresse non renseignée'}</p>
                  <p className="text-gray-800">{client.arrival_postal_code} {client.arrival_city}</p>
                  <p className="text-gray-600">{client.arrival_country || 'France'}</p>
                </div>
              </div>
            </div>

            {/* Détails du déménagement */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                Détails du déménagement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date souhaitée</label>
                  <p className="text-gray-800">{new Date(client.desired_date).toLocaleDateString('fr-FR')}</p>
                </div>
                {client.departure_time && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Heure de départ</label>
                    <p className="text-gray-800">{client.departure_time}</p>
                  </div>
                )}
                {client.estimated_volume && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Volume estimé</label>
                    <p className="text-gray-800 flex items-center">
                      <Volume2 className="h-4 w-4 mr-1 text-orange-600" />
                      {client.estimated_volume} m³
                    </p>
                  </div>
                )}
                {(client.budget_min || client.budget_max) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Budget</label>
                    <p className="text-gray-800 flex items-center">
                      <Euro className="h-4 w-4 mr-1 text-green-600" />
                      {client.budget_min || 0}€ - {client.budget_max || 0}€
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Prix et devis */}
            {client.quote_amount && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Euro className="h-4 w-4 mr-2 text-green-600" />
                  Devis
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{client.quote_amount.toFixed(2).replace('.', ',')} €</p>
                    <p className="text-sm text-gray-600">Montant du devis</p>
                  </div>
                  <div className="flex space-x-2">
                    <EmailQuoteButton client={clientForEmailButton} />
                  </div>
                </div>
              </div>
            )}

            {/* Informations supplémentaires */}
            {(client.description || client.special_requirements || client.access_conditions || client.inventory_list) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Informations supplémentaires</h3>
                <div className="space-y-3">
                  {client.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-800">{client.description}</p>
                    </div>
                  )}
                  {client.special_requirements && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Exigences particulières</label>
                      <p className="text-gray-800">{client.special_requirements}</p>
                    </div>
                  )}
                  {client.access_conditions && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Conditions d'accès</label>
                      <p className="text-gray-800">{client.access_conditions}</p>
                    </div>
                  )}
                  {client.inventory_list && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Inventaire</label>
                      <p className="text-gray-800">{client.inventory_list}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statut */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  client.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  client.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'pending' ? 'En attente' : 
                   client.status === 'confirmed' ? 'Confirmé' :
                   client.status === 'rejected' ? 'Rejeté' : client.status}
                </span>
                {client.is_matched && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    client.match_status === 'accepted' ? 'bg-green-100 text-green-800' :
                    client.match_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    Match: {client.match_status === 'accepted' ? 'Accepté' :
                           client.match_status === 'rejected' ? 'Rejeté' : 'En attente'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup de carte */}
      <MapPopup
        open={showMapPopup}
        onOpenChange={setShowMapPopup}
        items={prepareMapItems()}
        title={`Carte du client ${client.name ? client.name : client.client_reference || `CLI-${String(client.id).padStart(6, '0')}`}`}
      />
    </>
  );
};

export default ClientDetailsPopup;
