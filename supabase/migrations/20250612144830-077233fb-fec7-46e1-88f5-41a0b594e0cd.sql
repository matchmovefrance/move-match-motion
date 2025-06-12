
-- First, let's clean up orphaned references in move_matches table
-- Remove any move_matches records that reference non-existent client_request_ids
DELETE FROM move_matches 
WHERE client_request_id NOT IN (
    SELECT id FROM clients 
    WHERE id IS NOT NULL
);

-- Also clean up any orphaned move_matches that reference non-existent move_ids
DELETE FROM move_matches 
WHERE move_id NOT IN (
    SELECT id FROM confirmed_moves 
    WHERE id IS NOT NULL
);

-- Now create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS client_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create the client_requests table
CREATE TABLE IF NOT EXISTS public.client_requests (
  id integer NOT NULL DEFAULT nextval('client_requests_id_seq'::regclass),
  name text,
  email text,
  phone text,
  client_id integer,
  client_reference text,
  departure_address text,
  departure_city text,
  departure_postal_code text,
  departure_country text DEFAULT 'France',
  departure_time time without time zone,
  arrival_address text,
  arrival_city text,
  arrival_postal_code text,
  arrival_country text DEFAULT 'France',
  desired_date date,
  estimated_arrival_date date,
  estimated_arrival_time time without time zone,
  estimated_volume numeric,
  description text,
  flexible_dates boolean DEFAULT false,
  flexibility_days integer DEFAULT 0,
  date_range_start date,
  date_range_end date,
  budget_min numeric,
  budget_max numeric,
  quote_amount numeric,
  special_requirements text,
  access_conditions text,
  inventory_list text,
  status text DEFAULT 'pending',
  is_matched boolean DEFAULT false,
  matched_at timestamp with time zone,
  match_status text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT client_requests_pkey PRIMARY KEY (id)
);

-- Set sequence ownership
ALTER SEQUENCE client_requests_id_seq OWNED BY client_requests.id;

-- Migrate existing client data to client_requests table
INSERT INTO client_requests (
  id, name, email, phone, client_id, departure_city, departure_postal_code, 
  arrival_city, arrival_postal_code, desired_date, estimated_volume, 
  flexible_dates, flexibility_days, status, created_at, created_by
)
SELECT 
  id, name, email, phone, id as client_id, departure_city, departure_postal_code,
  arrival_city, arrival_postal_code, desired_date, estimated_volume,
  flexible_dates, flexibility_days, status, created_at, created_by
FROM clients
ON CONFLICT (id) DO NOTHING;

-- Update the sequence to start after the highest existing ID
SELECT setval('client_requests_id_seq', COALESCE((SELECT MAX(id) FROM client_requests), 0) + 1, false);

-- Add foreign key constraint to clients table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'client_requests_client_id_fkey'
    ) THEN
        ALTER TABLE client_requests 
        ADD CONSTRAINT client_requests_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own client requests" ON client_requests;
CREATE POLICY "Users can view their own client requests" 
  ON client_requests FOR SELECT 
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create their own client requests" ON client_requests;
CREATE POLICY "Users can create their own client requests" 
  ON client_requests FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own client requests" ON client_requests;
CREATE POLICY "Users can update their own client requests" 
  ON client_requests FOR UPDATE 
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own client requests" ON client_requests;
CREATE POLICY "Users can delete their own client requests" 
  ON client_requests FOR DELETE 
  USING (auth.uid() = created_by);

-- Now add the foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'move_matches_client_request_id_fkey'
    ) THEN
        ALTER TABLE move_matches 
        ADD CONSTRAINT move_matches_client_request_id_fkey 
        FOREIGN KEY (client_request_id) REFERENCES client_requests(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'move_matches_move_id_fkey'
    ) THEN
        ALTER TABLE move_matches 
        ADD CONSTRAINT move_matches_move_id_fkey 
        FOREIGN KEY (move_id) REFERENCES confirmed_moves(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_actions_match_id_fkey'
    ) THEN
        ALTER TABLE match_actions 
        ADD CONSTRAINT match_actions_match_id_fkey 
        FOREIGN KEY (match_id) REFERENCES move_matches(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trucks_mover_id_fkey'
    ) THEN
        ALTER TABLE trucks 
        ADD CONSTRAINT trucks_mover_id_fkey 
        FOREIGN KEY (mover_id) REFERENCES movers(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'confirmed_moves_mover_id_fkey'
    ) THEN
        ALTER TABLE confirmed_moves 
        ADD CONSTRAINT confirmed_moves_mover_id_fkey 
        FOREIGN KEY (mover_id) REFERENCES movers(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'confirmed_moves_truck_id_fkey'
    ) THEN
        ALTER TABLE confirmed_moves 
        ADD CONSTRAINT confirmed_moves_truck_id_fkey 
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;
    END IF;
END $$;
