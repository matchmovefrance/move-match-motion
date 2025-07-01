
-- Mettre à jour les politiques RLS pour confirmed_moves pour permettre les insertions publiques
DROP POLICY IF EXISTS "Allow authenticated users to create confirmed moves" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Users can insert their own confirmed_moves" ON public.confirmed_moves;

-- Créer une nouvelle politique qui permet les insertions publiques et authentifiées
CREATE POLICY "Allow public and authenticated users to create confirmed moves" 
ON public.confirmed_moves
FOR INSERT 
WITH CHECK (
  -- Permettre si l'utilisateur est authentifié
  auth.uid() IS NOT NULL OR
  -- Permettre si c'est une insertion publique avec l'UUID par défaut
  created_by = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Mettre à jour les politiques pour service_providers aussi
DROP POLICY IF EXISTS "Authenticated users can create service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can insert their own service_providers" ON public.service_providers;

-- Créer une nouvelle politique pour service_providers
CREATE POLICY "Allow public and authenticated users to create service providers" 
ON public.service_providers
FOR INSERT 
WITH CHECK (
  -- Permettre si l'utilisateur est authentifié
  (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
  -- Permettre si c'est une insertion publique (created_by peut être null)
  created_by IS NULL
);

-- Mettre à jour les politiques pour clients aussi
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;

-- Créer une nouvelle politique pour clients
CREATE POLICY "Allow public and authenticated users to create clients" 
ON public.clients
FOR INSERT 
WITH CHECK (
  -- Permettre si l'utilisateur est authentifié
  (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
  -- Permettre si c'est une insertion publique avec l'UUID par défaut
  created_by = '00000000-0000-0000-0000-000000000000'::uuid
);
