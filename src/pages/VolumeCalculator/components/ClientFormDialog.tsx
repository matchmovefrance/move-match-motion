import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Maximize2, Save } from 'lucide-react';
import { ExtendedClientForm } from './ExtendedClientForm';
import { useState } from 'react';

interface ClientFormDialogProps {
  // Informations de base
  clientName: string;
  setClientName: (value: string) => void;
  clientReference: string;
  setClientReference: (value: string) => void;
  clientPhone: string;
  setClientPhone: (value: string) => void;
  clientEmail: string;
  setClientEmail: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  
  // Adresses et codes postaux
  departureAddress: string;
  setDepartureAddress: (value: string) => void;
  departurePostalCode: string;
  setDeparturePostalCode: (value: string) => void;
  arrivalAddress: string;
  setArrivalAddress: (value: string) => void;
  arrivalPostalCode: string;
  setArrivalPostalCode: (value: string) => void;
  
  // Configuration des lieux de départ
  departureLocationType: string;
  setDepartureLocationType: (value: string) => void;
  departureFloor: string;
  setDepartureFloor: (value: string) => void;
  departureHasElevator: boolean;
  setDepartureHasElevator: (value: boolean) => void;
  departureElevatorSize: string;
  setDepartureElevatorSize: (value: string) => void;
  departureHasFreightElevator: boolean;
  setDepartureHasFreightElevator: (value: boolean) => void;
  departureCarryingDistance: string;
  setDepartureCarryingDistance: (value: string) => void;
  departureParkingNeeded: boolean;
  setDepartureParkingNeeded: (value: boolean) => void;
  
  // Configuration des lieux d'arrivée
  arrivalLocationType: string;
  setArrivalLocationType: (value: string) => void;
  arrivalFloor: string;
  setArrivalFloor: (value: string) => void;
  arrivalHasElevator: boolean;
  setArrivalHasElevator: (value: boolean) => void;
  arrivalElevatorSize: string;
  setArrivalElevatorSize: (value: string) => void;
  arrivalHasFreightElevator: boolean;
  setArrivalHasFreightElevator: (value: boolean) => void;
  arrivalCarryingDistance: string;
  setArrivalCarryingDistance: (value: string) => void;
  arrivalParkingNeeded: boolean;
  setArrivalParkingNeeded: (value: boolean) => void;
  
  // Formule
  formule: string;
  setFormule: (value: string) => void;
  
  // Actions
  onSaveInventory?: () => void;
  selectedItemsCount?: number;
}

export function ClientFormDialog(props: ClientFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  console.log('ClientFormDialog - selectedItemsCount:', props.selectedItemsCount);

  const handleSaveInventory = async () => {
    if (props.onSaveInventory) {
      await props.onSaveInventory();
      setIsOpen(false); // Fermer automatiquement le popup après sauvegarde
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <User className="h-4 w-4" />
          Informations client détaillées
          <Maximize2 className="h-3 w-3 ml-auto" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informations Client Complètes</DialogTitle>
        </DialogHeader>
        <ExtendedClientForm {...props} />
        <DialogFooter className="flex gap-2">
          <Button 
            onClick={handleSaveInventory}
            disabled={!props.selectedItemsCount || props.selectedItemsCount === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder l'inventaire avec ces détails
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}