
-- Ajouter la colonne trip_type à la table move_matches
ALTER TABLE move_matches 
ADD COLUMN trip_type VARCHAR(10) DEFAULT 'direct';

-- Ajouter un commentaire pour documenter les valeurs possibles
COMMENT ON COLUMN move_matches.trip_type IS 'Type de trajet: direct ou return';
