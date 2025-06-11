
-- Vérifier les politiques existantes pour confirmed_moves
DROP POLICY IF EXISTS "Authenticated users can view confirmed moves" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Authenticated users can create confirmed moves" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Users can update own moves or admins can update all" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Users can delete own moves or admins can delete all" ON public.confirmed_moves;

-- Créer de nouvelles politiques plus permissives pour les agents et admins
CREATE POLICY "Allow agents and admins to view all confirmed moves" 
ON public.confirmed_moves
FOR SELECT 
TO authenticated
USING (
  -- Les admins peuvent tout voir
  public.get_current_user_role() = 'admin' OR
  -- Les agents peuvent tout voir aussi
  public.get_current_user_role() = 'agent' OR
  -- Les déménageurs ne voient que leurs trajets assignés
  (public.get_current_user_role() = 'demenageur' AND contact_email = auth.email()) OR
  -- Fallback: si pas de rôle défini, on permet l'accès (pour les anciens comptes)
  public.get_current_user_role() IS NULL
);

CREATE POLICY "Allow authenticated users to create confirmed moves" 
ON public.confirmed_moves
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Tout utilisateur authentifié peut créer
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow users to update moves based on role" 
ON public.confirmed_moves
FOR UPDATE 
TO authenticated
USING (
  -- Les admins peuvent tout modifier
  public.get_current_user_role() = 'admin' OR
  -- Les agents peuvent tout modifier
  public.get_current_user_role() = 'agent' OR
  -- Les créateurs peuvent modifier leurs propres entrées
  auth.uid() = created_by OR
  -- Fallback pour les anciens comptes
  public.get_current_user_role() IS NULL
);

CREATE POLICY "Allow users to delete moves based on role" 
ON public.confirmed_moves
FOR DELETE 
TO authenticated
USING (
  -- Les admins peuvent tout supprimer
  public.get_current_user_role() = 'admin' OR
  -- Les agents peuvent tout supprimer
  public.get_current_user_role() = 'agent' OR
  -- Les créateurs peuvent supprimer leurs propres entrées
  auth.uid() = created_by
);

-- Vérifier que la fonction get_current_user_role existe et fonctionne
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- S'assurer que pierre@matchmove.fr a bien le rôle admin
INSERT INTO public.profiles (id, email, role, company_name)
SELECT 
  u.id,
  u.email,
  'admin',
  'MatchMove'
FROM auth.users u
WHERE u.email = 'pierre@matchmove.fr'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  company_name = 'MatchMove';
