-- Ajouter les colonnes dimensions à la table custom_furniture
ALTER TABLE custom_furniture 
ADD COLUMN length_cm INTEGER,
ADD COLUMN width_cm INTEGER,
ADD COLUMN height_cm INTEGER;