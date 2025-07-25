import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { MapPin, Building, ArrowUp, Car, User, Home, Globe, Calendar } from 'lucide-react';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { CountrySelect } from '@/components/CountrySelect';
import { useState } from 'react';

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
  departureCity: string;
  setDepartureCity: (value: string) => void;
  arrivalAddress: string;
  setArrivalAddress: (value: string) => void;
  arrivalPostalCode: string;
  setArrivalPostalCode: (value: string) => void;
  arrivalCity: string;
  setArrivalCity: (value: string) => void;
  
  // Dates de déménagement
  movingDate: string;
  setMovingDate: (value: string) => void;
  flexibleDates: boolean;
  setFlexibleDates: (value: boolean) => void;
  dateRangeStart: string;
  setDateRangeStart: (value: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (value: string) => void;
  
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
  
  // Déménagement international
  isInternational?: boolean;
  setIsInternational?: (value: boolean) => void;
  internationalData?: {
    departureAddress: string;
    arrivalAddress: string;
    departureCountry: string;
    arrivalCountry: string;
    departureCity: string;
    arrivalCity: string;
  };
  setInternationalData?: (data: any) => void;
}

export function ExtendedClientForm(props: ExtendedClientFormProps) {
  const [departurePostalCodeError, setDeparturePostalCodeError] = useState('');
  const [arrivalPostalCodeError, setArrivalPostalCodeError] = useState('');
  
  const {
    distance,
    duration,
    isLoading: distanceLoading,
    error: distanceError
  } = useGoogleMapsDistance({
    departurePostalCode: props.departurePostalCode,
    arrivalPostalCode: props.arrivalPostalCode,
    enabled: !!(props.departurePostalCode && props.arrivalPostalCode && !props.isInternational)
  });

  const handlePostalCodeChange = (field: 'departure' | 'arrival', value: string) => {
    // Limiter à 5 caractères numériques
    const numericValue = value.replace(/\D/g, '').slice(0, 5);
    
    if (field === 'departure') {
      props.setDeparturePostalCode(numericValue);
      
      // Valider que le code postal fasse exactement 5 chiffres
      if (numericValue.length > 0 && numericValue.length < 5) {
        setDeparturePostalCodeError('Le code postal doit contenir exactement 5 chiffres');
        props.setDepartureCity('');
      } else {
        setDeparturePostalCodeError('');
        if (numericValue.length !== 5) {
          props.setDepartureCity('');
        }
      }
    } else {
      props.setArrivalPostalCode(numericValue);
      
      // Valider que le code postal fasse exactement 5 chiffres
      if (numericValue.length > 0 && numericValue.length < 5) {
        setArrivalPostalCodeError('Le code postal doit contenir exactement 5 chiffres');
        props.setArrivalCity('');
      } else {
        setArrivalPostalCodeError('');
        if (numericValue.length !== 5) {
          props.setArrivalCity('');
        }
      }
    }
  };

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
          
          {/* Case à cocher déménagement international */}
          {props.setIsInternational && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isInternational"
                checked={props.isInternational || false}
                onCheckedChange={props.setIsInternational}
              />
              <Label htmlFor="isInternational" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Déménagement à l'international
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates de déménagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Dates de déménagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="movingDate">Date souhaitée *</Label>
              <Input
                id="movingDate"
                type="date"
                value={props.movingDate}
                onChange={(e) => props.setMovingDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="flexibleDates"
                checked={props.flexibleDates}
                onCheckedChange={(checked) => {
                  props.setFlexibleDates(checked as boolean);
                  if (!checked) {
                    props.setDateRangeStart('');
                    props.setDateRangeEnd('');
                  }
                }}
              />
              <Label htmlFor="flexibleDates">Dates flexibles</Label>
            </div>
          </div>
          
          {props.flexibleDates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="dateRangeStart">Date de début de période</Label>
                <Input
                  id="dateRangeStart"
                  type="date"
                  value={props.dateRangeStart}
                  onChange={(e) => props.setDateRangeStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateRangeEnd">Date de fin de période</Label>
                <Input
                  id="dateRangeEnd"
                  type="date"
                  value={props.dateRangeEnd}
                  onChange={(e) => props.setDateRangeEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration des adresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            {props.isInternational ? 'Adresses internationales' : 'Adresses de déménagement'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.isInternational ? (
            /* Formulaire international */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="intDepartureAddress">Adresse de départ complète *</Label>
                  <Input
                    id="intDepartureAddress"
                    value={props.internationalData?.departureAddress || ''}
                    onChange={(e) => props.setInternationalData?.({ 
                      ...props.internationalData, 
                      departureAddress: e.target.value 
                    })}
                    placeholder="Adresse complète de départ"
                    required
                  />
                </div>
                <div>
                  <CountrySelect
                    value={props.internationalData?.departureCountry || ''}
                    onValueChange={(value) => props.setInternationalData?.({ 
                      ...props.internationalData, 
                      departureCountry: value 
                    })}
                    label="Pays de départ"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="intArrivalAddress">Adresse d'arrivée complète *</Label>
                  <Input
                    id="intArrivalAddress"
                    value={props.internationalData?.arrivalAddress || ''}
                    onChange={(e) => props.setInternationalData?.({ 
                      ...props.internationalData, 
                      arrivalAddress: e.target.value 
                    })}
                    placeholder="Adresse complète d'arrivée"
                    required
                  />
                </div>
                <div>
                  <CountrySelect
                    value={props.internationalData?.arrivalCountry || ''}
                    onValueChange={(value) => props.setInternationalData?.({ 
                      ...props.internationalData, 
                      arrivalCountry: value 
                    })}
                    label="Pays d'arrivée"
                    required
                  />
                </div>
              </div>
              
              {/* Affichage pour international */}
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Déménagement international</span>
                </div>
                <p className="text-sm text-amber-600 mt-1">Distance non disponible pour les déménagements internationaux</p>
              </div>
            </div>
          ) : (
            /* Formulaire national */
            <div className="space-y-4">
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    value={props.departurePostalCode}
                    onChange={(e) => handlePostalCodeChange('departure', e.target.value)}
                    placeholder="Ex: 75001"
                    required
                    className={departurePostalCodeError ? 'border-red-500' : ''}
                  />
                  {departurePostalCodeError && (
                    <p className="text-sm text-red-600 mt-1">{departurePostalCodeError}</p>
                  )}
                </div>
                <div>
                  <CityAutocomplete
                    postalCode={props.departurePostalCode}
                    selectedCity={props.departureCity}
                    onCitySelect={props.setDepartureCity}
                    label="Ville de départ"
                    placeholder="Sélectionnez une ville"
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    value={props.arrivalPostalCode}
                    onChange={(e) => handlePostalCodeChange('arrival', e.target.value)}
                    placeholder="Ex: 69001"
                    required
                    className={arrivalPostalCodeError ? 'border-red-500' : ''}
                  />
                  {arrivalPostalCodeError && (
                    <p className="text-sm text-red-600 mt-1">{arrivalPostalCodeError}</p>
                  )}
                </div>
                <div>
                  <CityAutocomplete
                    postalCode={props.arrivalPostalCode}
                    selectedCity={props.arrivalCity}
                    onCitySelect={props.setArrivalCity}
                    label="Ville d'arrivée"
                    placeholder="Sélectionnez une ville"
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
                    </div>
                  ) : null}
                </div>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="formule">Formule</Label>
              <Select value={props.formule} onValueChange={props.setFormule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la formule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eco">Eco</SelectItem>
                  <SelectItem value="Eco +">Eco +</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="Luxe">Luxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departureCarryingDistance">Distance de portage (en mètres)</Label>
              <Input
                id="departureCarryingDistance"
                type="number"
                value={props.departureCarryingDistance || ''}
                onChange={(e) => props.setDepartureCarryingDistance(e.target.value)}
                placeholder="Distance entre le camion et la porte"
                min="0"
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
                value={props.arrivalCarryingDistance || ''}
                onChange={(e) => props.setArrivalCarryingDistance(e.target.value)}
                placeholder="Distance entre le camion et la porte"
                min="0"
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