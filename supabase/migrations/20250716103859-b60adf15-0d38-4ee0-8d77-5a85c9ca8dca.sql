-- Ajouter une colonne de référence automatique pour les inventaires
ALTER TABLE inventories 
ADD COLUMN reference TEXT;

-- Créer une fonction pour générer une référence automatique
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
    
    -- Générer la référence au format INV-XXXX
    ref := 'INV-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les inventaires existants avec des références
UPDATE inventories 
SET reference = 'INV-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
WHERE reference IS NULL;

-- Créer un trigger pour assigner automatiquement une référence aux nouveaux inventaires
CREATE OR REPLACE FUNCTION auto_assign_inventory_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL THEN
        NEW.reference := generate_inventory_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_inventory_reference
    BEFORE INSERT ON inventories
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_inventory_reference();