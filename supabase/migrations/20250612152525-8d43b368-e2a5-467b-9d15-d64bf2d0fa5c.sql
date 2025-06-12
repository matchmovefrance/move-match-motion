
-- Ajouter les colonnes manquantes à la table company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS siret TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pricing_margin NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Mettre à jour les colonnes existantes pour correspondre aux noms attendus
UPDATE public.company_settings 
SET 
  address = company_address,
  phone = company_phone,
  email = company_email
WHERE address = '' AND phone = '' AND email = '';
