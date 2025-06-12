
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation } from 'lucide-react';

interface MoveMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  move: {
    company_name: string;
    departure_city: string;
    arrival_city: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_date: string;
  } | null;
}

export const MoveMapDialog = ({ open, onOpenChange, move }: MoveMapDialogProps) => {
  if (!move) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Trajet : {move.company_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-600 mb-2 flex items-center">
                <Navigation className="h-4 w-4 mr-1" />
                Départ
              </h3>
              <p className="text-sm">
                <strong>Ville:</strong> {move.departure_city}
              </p>
              <p className="text-sm">
                <strong>Code postal:</strong> {move.departure_postal_code}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-red-600 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Arrivée
              </h3>
              <p className="text-sm">
                <strong>Ville:</strong> {move.arrival_city}
              </p>
              <p className="text-sm">
                <strong>Code postal:</strong> {move.arrival_postal_code}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Date de départ:</strong> {new Date(move.departure_date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Placeholder pour la carte - à remplacer par une vraie carte plus tard */}
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Carte du trajet</p>
              <p className="text-sm text-gray-400 mt-1">
                {move.departure_city} → {move.arrival_city}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
