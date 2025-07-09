-- Update inventories table to include all new client location configuration fields
ALTER TABLE public.inventories ADD COLUMN IF NOT EXISTS distance_km_calculated NUMERIC;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to inventories table
DROP TRIGGER IF EXISTS update_inventories_updated_at ON public.inventories;
CREATE TRIGGER update_inventories_updated_at
    BEFORE UPDATE ON public.inventories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();