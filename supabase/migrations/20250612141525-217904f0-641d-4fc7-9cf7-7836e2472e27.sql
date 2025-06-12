
-- Ajouter la colonne client_reference à la table client_requests
ALTER TABLE public.client_requests 
ADD COLUMN client_reference TEXT;

-- Ajouter la colonne flexibility_days si elle n'existe pas déjà
ALTER TABLE public.client_requests 
ADD COLUMN flexibility_days INTEGER DEFAULT 0;

-- Mettre à jour les enregistrements existants avec des références générées
UPDATE public.client_requests 
SET client_reference = 'CLI-' || LPAD(id::text, 6, '0') 
WHERE client_reference IS NULL;
