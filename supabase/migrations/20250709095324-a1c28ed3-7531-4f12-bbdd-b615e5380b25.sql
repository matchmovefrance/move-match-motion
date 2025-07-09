-- Table pour stocker les volumes personnalisés des meubles
CREATE TABLE IF NOT EXISTS public.furniture_volumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  furniture_id TEXT NOT NULL,
  furniture_name TEXT NOT NULL,
  custom_volume DECIMAL(10,3) NOT NULL,
  default_volume DECIMAL(10,3) NOT NULL,
  category TEXT NOT NULL,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker l'historique des inventaires
CREATE TABLE IF NOT EXISTS public.inventories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informations client de base
  client_name TEXT,
  client_reference TEXT,
  client_phone TEXT,
  client_email TEXT,
  notes TEXT,
  
  -- Adresses et codes postaux
  departure_address TEXT,
  departure_postal_code TEXT NOT NULL,
  arrival_address TEXT,
  arrival_postal_code TEXT NOT NULL,
  
  -- Configuration des lieux de départ
  departure_location_type TEXT CHECK (departure_location_type IN ('appartement', 'maison', 'garde_meuble')),
  departure_floor INTEGER,
  departure_has_elevator BOOLEAN DEFAULT false,
  departure_elevator_size TEXT,
  departure_has_freight_elevator BOOLEAN DEFAULT false,
  departure_carrying_distance INTEGER, -- en mètres
  departure_parking_needed BOOLEAN DEFAULT false,
  
  -- Configuration des lieux d'arrivée
  arrival_location_type TEXT CHECK (arrival_location_type IN ('appartement', 'maison', 'garde_meuble')),
  arrival_floor INTEGER,
  arrival_has_elevator BOOLEAN DEFAULT false,
  arrival_elevator_size TEXT,
  arrival_has_freight_elevator BOOLEAN DEFAULT false,
  arrival_carrying_distance INTEGER, -- en mètres
  arrival_parking_needed BOOLEAN DEFAULT false,
  
  -- Calculs et mesures
  total_volume DECIMAL(10,3) NOT NULL,
  total_weight DECIMAL(10,3),
  distance_km DECIMAL(10,2),
  truck_recommendation JSONB,
  
  -- Items de l'inventaire
  selected_items JSONB NOT NULL,
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.furniture_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour furniture_volumes
CREATE POLICY "Users can view all furniture volumes" 
ON public.furniture_volumes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create furniture volumes" 
ON public.furniture_volumes FOR INSERT 
WITH CHECK (auth.uid() = modified_by);

CREATE POLICY "Users can update furniture volumes they created or admins can update all" 
ON public.furniture_volumes FOR UPDATE 
USING (auth.uid() = modified_by OR get_current_user_role() = 'admin');

CREATE POLICY "Users can delete furniture volumes they created or admins can delete all" 
ON public.furniture_volumes FOR DELETE 
USING (auth.uid() = modified_by OR get_current_user_role() = 'admin');

-- Politiques RLS pour inventories
CREATE POLICY "Users can view their own inventories or admins can view all" 
ON public.inventories FOR SELECT 
USING (auth.uid() = created_by OR get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can create inventories" 
ON public.inventories FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own inventories or admins can update all" 
ON public.inventories FOR UPDATE 
USING (auth.uid() = created_by OR get_current_user_role() = 'admin');

CREATE POLICY "Users can delete their own inventories or admins can delete all" 
ON public.inventories FOR DELETE 
USING (auth.uid() = created_by OR get_current_user_role() = 'admin');

-- Trigger pour updated_at
CREATE TRIGGER update_furniture_volumes_updated_at
  BEFORE UPDATE ON public.furniture_volumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventories_updated_at
  BEFORE UPDATE ON public.inventories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_furniture_volumes_furniture_id ON public.furniture_volumes(furniture_id);
CREATE INDEX idx_inventories_created_by ON public.inventories(created_by);
CREATE INDEX idx_inventories_created_at ON public.inventories(created_at);