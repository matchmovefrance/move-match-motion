-- Ajouter les colonnes de date manquantes à la table inventories
ALTER TABLE public.inventories 
ADD COLUMN moving_date date,
ADD COLUMN flexible_dates boolean DEFAULT false,
ADD COLUMN date_range_start date,
ADD COLUMN date_range_end date;