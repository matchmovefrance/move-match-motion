
-- Ajouter les colonnes manquantes à la table clients
ALTER TABLE public.clients 
ADD COLUMN departure_postal_code TEXT,
ADD COLUMN arrival_postal_code TEXT,
ADD COLUMN desired_date DATE,
ADD COLUMN estimated_volume NUMERIC,
ADD COLUMN flexible_dates BOOLEAN DEFAULT false,
ADD COLUMN flexibility_days INTEGER DEFAULT 0,
ADD COLUMN status TEXT DEFAULT 'pending',
ADD COLUMN departure_city TEXT,
ADD COLUMN arrival_city TEXT,
ADD COLUMN departure_country TEXT DEFAULT 'France',
ADD COLUMN arrival_country TEXT DEFAULT 'France';

-- Migrer les données de client_requests vers clients (si il y en a)
INSERT INTO public.clients (
  name, email, phone, client_reference, created_by,
  departure_postal_code, arrival_postal_code, desired_date,
  estimated_volume, flexible_dates, flexibility_days, status,
  departure_city, arrival_city, departure_country, arrival_country
)
SELECT 
  name, email, phone, client_reference, created_by,
  departure_postal_code, arrival_postal_code, desired_date,
  estimated_volume, flexible_dates, flexibility_days, status,
  departure_city, arrival_city, departure_country, arrival_country
FROM public.client_requests
WHERE client_id IS NULL;

-- Supprimer la table client_requests
DROP TABLE IF EXISTS public.client_requests CASCADE;
