-- Ajouter le champ formule à la table inventories
ALTER TABLE public.inventories 
ADD COLUMN IF NOT EXISTS formule TEXT DEFAULT 'standard';

-- Ajouter une contrainte pour valider les valeurs de formule
ALTER TABLE public.inventories 
ADD CONSTRAINT check_formule_valid 
CHECK (formule IN ('Eco', 'Eco +', 'standard', 'Luxe'));