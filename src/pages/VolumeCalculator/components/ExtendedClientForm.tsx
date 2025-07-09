import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { MapPin, Building, ArrowUp, Car, User, Home } from 'lucide-react';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';

interface ExtendedClientFormProps {
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
}

export function ExtendedClientForm(props: ExtendedClientFormProps) {
  const {
    distance,
    duration,
    isLoading: distanceLoading,
    error: distanceError
  } = useGoogleMapsDistance({
    departurePostalCode: props.departurePostalCode,
    arrivalPostalCode: props.arrivalPostalCode,
    enabled: !!(props.departurePostalCode && props.arrivalPostalCode)
  });

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Nom du client *</Label>
              <Input
                id="clientName"
                value={props.clientName}
                onChange={(e) => props.setClientName(e.target.value)}
                placeholder="Nom complet du client"
              />
            </div>
            <div>
              <Label htmlFor="clientRef">Référence dossier</Label>
              <Input
                id="clientRef"
                value={props.clientReference}
                onChange={(e) => props.setClientReference(e.target.value)}
                placeholder="Ex: DEV-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Téléphone</Label>
              <Input
                id="clientPhone"
                value={props.clientPhone}
                onChange={(e) => props.setClientPhone(e.target.value)}
                placeholder="06 XX XX XX XX"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={props.clientEmail}
                onChange={(e) => props.setClientEmail(e.target.value)}
                placeholder="client@email.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes particulières</Label>
            <Textarea
              id="notes"
              value={props.notes}
              onChange={(e) => props.setNotes(e.target.value)}
              placeholder="Accès difficile, objets fragiles, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration des adresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Adresses de déménagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departureAddress">Adresse de départ</Label>
              <Input
                id="departureAddress"
                value={props.departureAddress}
                onChange={(e) => props.setDepartureAddress(e.target.value)}
                placeholder="Adresse complète de départ"
              />
            </div>
            <div>
              <Label htmlFor="departurePostalCode">Code postal de départ *</Label>
              <Input
                id="departurePostalCode"
                value={props.departurePostalCode}
                onChange={(e) => props.setDeparturePostalCode(e.target.value)}
                placeholder="Ex: 75001"
                required
              />
            </div>
            <div>
              <Label htmlFor="arrivalAddress">Adresse d'arrivée</Label>
              <Input
                id="arrivalAddress"
                value={props.arrivalAddress}
                onChange={(e) => props.setArrivalAddress(e.target.value)}
                placeholder="Adresse complète d'arrivée"
              />
            </div>
            <div>
              <Label htmlFor="arrivalPostalCode">Code postal d'arrivée *</Label>
              <Input
                id="arrivalPostalCode"
                value={props.arrivalPostalCode}
                onChange={(e) => props.setArrivalPostalCode(e.target.value)}
                placeholder="Ex: 69001"
                required
              />
            </div>
          </div>
          
          {/* Affichage de la distance calculée */}
          {(props.departurePostalCode && props.arrivalPostalCode) && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Distance calculée</span>
              </div>
              {distanceLoading ? (
                <p className="text-sm text-blue-600 mt-1">Calcul en cours...</p>
              ) : distanceError ? (
                <p className="text-sm text-red-600 mt-1">Erreur de calcul: {distanceError}</p>
              ) : distance ? (
                <div className="text-sm text-blue-600 mt-1">
                  <p>{distance} km</p>
                  {duration && <p>Durée estimée: {Math.round(duration / 60)} min</p>}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration du lieu de départ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-orange-600" />
            Configuration du lieu de départ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departureLocationType">Type de logement</Label>
              <Select value={props.departureLocationType} onValueChange={props.setDepartureLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="garde_meuble">Garde meuble</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departureFloor">Étage</Label>
              <Input
                id="departureFloor"
                value={props.departureFloor}
                onChange={(e) => props.setDepartureFloor(e.target.value)}
                placeholder="Ex: RDC, 1, 2..."
              />
            </div>
            <div>
              <Label htmlFor="departureCarryingDistance">Distance de portage (en mètres)</Label>
              <Input
                id="departureCarryingDistance"
                type="number"
                value={props.departureCarryingDistance}
                onChange={(e) => props.setDepartureCarryingDistance(e.target.value)}
                placeholder="Distance entre le camion et la porte"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="departureHasElevator"
                checked={props.departureHasElevator}
                onCheckedChange={props.setDepartureHasElevator}
              />
              <Label htmlFor="departureHasElevator" className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                Ascenseur disponible
              </Label>
            </div>

            {props.departureHasElevator && (
              <div>
                <Label htmlFor="departureElevatorSize">Taille de l'ascenseur</Label>
                <Select value={props.departureElevatorSize} onValueChange={props.setDepartureElevatorSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la taille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petit">Petit (&lt; 1m²)</SelectItem>
                    <SelectItem value="moyen">Moyen (1-2m²)</SelectItem>
                    <SelectItem value="grand">Grand (&gt; 2m²)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="departureHasFreightElevator"
                checked={props.departureHasFreightElevator}
                onCheckedChange={props.setDepartureHasFreightElevator}
              />
              <Label htmlFor="departureHasFreightElevator">Monte charge disponible</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="departureParkingNeeded"
                checked={props.departureParkingNeeded}
                onCheckedChange={props.setDepartureParkingNeeded}
              />
              <Label htmlFor="departureParkingNeeded" className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                Demande de stationnement
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration du lieu d'arrivée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            Configuration du lieu d'arrivée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="arrivalLocationType">Type de logement</Label>
              <Select value={props.arrivalLocationType} onValueChange={props.setArrivalLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="garde_meuble">Garde meuble</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="arrivalFloor">Étage</Label>
              <Input
                id="arrivalFloor"
                value={props.arrivalFloor}
                onChange={(e) => props.setArrivalFloor(e.target.value)}
                placeholder="Ex: RDC, 1, 2..."
              />
            </div>
            <div>
              <Label htmlFor="arrivalCarryingDistance">Distance de portage (en mètres)</Label>
              <Input
                id="arrivalCarryingDistance"
                type="number"
                value={props.arrivalCarryingDistance}
                onChange={(e) => props.setArrivalCarryingDistance(e.target.value)}
                placeholder="Distance entre le camion et la porte"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="arrivalHasElevator"
                checked={props.arrivalHasElevator}
                onCheckedChange={props.setArrivalHasElevator}
              />
              <Label htmlFor="arrivalHasElevator" className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                Ascenseur disponible
              </Label>
            </div>

            {props.arrivalHasElevator && (
              <div>
                <Label htmlFor="arrivalElevatorSize">Taille de l'ascenseur</Label>
                <Select value={props.arrivalElevatorSize} onValueChange={props.setArrivalElevatorSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la taille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petit">Petit (&lt; 1m²)</SelectItem>
                    <SelectItem value="moyen">Moyen (1-2m²)</SelectItem>
                    <SelectItem value="grand">Grand (&gt; 2m²)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="arrivalHasFreightElevator"
                checked={props.arrivalHasFreightElevator}
                onCheckedChange={props.setArrivalHasFreightElevator}
              />
              <Label htmlFor="arrivalHasFreightElevator">Monte charge disponible</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="arrivalParkingNeeded"
                checked={props.arrivalParkingNeeded}
                onCheckedChange={props.setArrivalParkingNeeded}
              />
              <Label htmlFor="arrivalParkingNeeded" className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                Demande de stationnement
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}