-- Add international moving support to inventories table
ALTER TABLE public.inventories 
ADD COLUMN is_international boolean DEFAULT false,
ADD COLUMN international_data jsonb DEFAULT '{}'::jsonb;