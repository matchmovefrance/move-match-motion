-- Ajouter une contrainte unique sur user_id pour permettre l'upsert
ALTER TABLE public.company_settings 
ADD CONSTRAINT company_settings_user_id_unique UNIQUE (user_id);