-- Add dimensions column to inventories table to store item dimensions
ALTER TABLE inventories ADD COLUMN item_dimensions jsonb DEFAULT NULL;

-- Add dimensions column to custom_furniture table for custom items
ALTER TABLE custom_furniture ADD COLUMN dimensions text DEFAULT NULL;

-- Add comment to explain the dimensions format
COMMENT ON COLUMN custom_furniture.dimensions IS 'Format: Longueur × Profondeur × Hauteur (cm). Exemple: 120 × 60 × 75';
COMMENT ON COLUMN inventories.item_dimensions IS 'JSON storing dimensions for each selected item with format: {"item_id": "120 × 60 × 75"}';