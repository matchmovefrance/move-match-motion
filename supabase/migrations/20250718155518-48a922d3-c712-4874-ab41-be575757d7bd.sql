-- Add departure_city and arrival_city columns to inventories table
ALTER TABLE public.inventories 
ADD COLUMN departure_city text,
ADD COLUMN arrival_city text;