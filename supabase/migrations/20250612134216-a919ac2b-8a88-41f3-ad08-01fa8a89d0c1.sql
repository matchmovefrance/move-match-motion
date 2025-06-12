
-- Ajouter la colonne client_reference à la table clients
ALTER TABLE public.clients 
ADD COLUMN client_reference TEXT;

-- Générer des références pour les clients existants
UPDATE public.clients 
SET client_reference = 'CLI-' || LPAD(id::text, 6, '0') 
WHERE client_reference IS NULL;

-- Rendre la colonne unique (optionnel mais recommandé)
ALTER TABLE public.clients 
ADD CONSTRAINT clients_client_reference_unique UNIQUE (client_reference);
