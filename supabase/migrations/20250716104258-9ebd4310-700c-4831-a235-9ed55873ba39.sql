-- Mettre à jour la fonction pour générer des références sans limite de chiffres
CREATE OR REPLACE FUNCTION generate_inventory_reference()
RETURNS TEXT AS $$
DECLARE
    counter INTEGER;
    ref TEXT;
BEGIN
    -- Obtenir le prochain numéro séquentiel
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM inventories 
    WHERE reference IS NOT NULL AND reference ~ '^INV-\d+$';
    
    -- Générer la référence au format INV-X (sans limite de chiffres)
    ref := 'INV-' || counter::TEXT;
    
    RETURN ref;
END;
$$ LANGUAGE plpgsql;