
-- Étape 1: Ajouter les colonnes manquantes à la table clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inventory_list text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS access_conditions text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS special_requirements text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS departure_address text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS arrival_address text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS departure_time time without time zone;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estimated_arrival_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estimated_arrival_time time without time zone;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_range_start date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_range_end date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_min numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_max numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quote_amount numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_matched boolean DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS matched_at timestamp with time zone;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS match_status text;

-- Étape 2: Migrer toutes les données de client_requests vers clients
INSERT INTO clients (
    name, email, phone, client_reference, created_at, created_by,
    departure_city, departure_postal_code, departure_address, departure_country,
    arrival_city, arrival_postal_code, arrival_address, arrival_country,
    desired_date, estimated_volume, flexible_dates, flexibility_days,
    date_range_start, date_range_end, budget_min, budget_max, quote_amount,
    status, inventory_list, access_conditions, special_requirements, description,
    departure_time, estimated_arrival_date, estimated_arrival_time,
    is_matched, matched_at, match_status
)
SELECT 
    COALESCE(cr.name, 'Client sans nom'),
    COALESCE(cr.email, 'email@example.com'),
    COALESCE(cr.phone, 'Téléphone non renseigné'),
    COALESCE(cr.client_reference, 'CLI-' || LPAD(cr.id::text, 6, '0')),
    cr.created_at,
    cr.created_by,
    cr.departure_city,
    cr.departure_postal_code,
    cr.departure_address,
    cr.departure_country,
    cr.arrival_city,
    cr.arrival_postal_code,
    cr.arrival_address,
    cr.arrival_country,
    cr.desired_date,
    cr.estimated_volume,
    cr.flexible_dates,
    cr.flexibility_days,
    cr.date_range_start,
    cr.date_range_end,
    cr.budget_min,
    cr.budget_max,
    cr.quote_amount,
    cr.status,
    cr.inventory_list,
    cr.access_conditions,
    cr.special_requirements,
    cr.description,
    cr.departure_time,
    cr.estimated_arrival_date,
    cr.estimated_arrival_time,
    cr.is_matched,
    cr.matched_at,
    cr.match_status
FROM client_requests cr
WHERE NOT EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.client_reference = COALESCE(cr.client_reference, 'CLI-' || LPAD(cr.id::text, 6, '0'))
);

-- Étape 3: Mettre à jour les références dans move_matches pour pointer vers clients
UPDATE move_matches 
SET client_request_id = (
    SELECT c.id 
    FROM clients c 
    WHERE c.client_reference = 'CLI-' || LPAD(move_matches.client_request_id::text, 6, '0')
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM clients c 
    WHERE c.client_reference = 'CLI-' || LPAD(move_matches.client_request_id::text, 6, '0')
);

-- Étape 4: Renommer la colonne dans move_matches pour clarifier
ALTER TABLE move_matches RENAME COLUMN client_request_id TO client_id;

-- Étape 5: Supprimer la table client_requests devenue obsolète
DROP TABLE IF EXISTS client_requests CASCADE;

-- Étape 6: Mettre à jour les références clients pour être cohérentes
UPDATE clients 
SET client_reference = 'CLI-' || LPAD(id::text, 6, '0')
WHERE client_reference IS NULL OR client_reference = '';
