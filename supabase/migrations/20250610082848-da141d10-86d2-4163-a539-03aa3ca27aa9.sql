
-- Supprimer TOUTES les politiques existantes sur toutes les tables
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Users can update own client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Users can delete own client requests" ON public.client_requests;
DROP POLICY IF EXISTS "Users can create movers" ON public.movers;
DROP POLICY IF EXISTS "Users can update own movers" ON public.movers;
DROP POLICY IF EXISTS "Users can delete own movers" ON public.movers;
DROP POLICY IF EXISTS "Users can create confirmed moves" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Users can update own confirmed moves" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Users can delete own confirmed moves" ON public.confirmed_moves;
DROP POLICY IF EXISTS "Users can create service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can update own service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can delete own service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can create trucks" ON public.trucks;
DROP POLICY IF EXISTS "Users can update trucks" ON public.trucks;
DROP POLICY IF EXISTS "Users can delete trucks" ON public.trucks;
DROP POLICY IF EXISTS "Users can create move matches" ON public.move_matches;
DROP POLICY IF EXISTS "Users can update move matches" ON public.move_matches;
DROP POLICY IF EXISTS "Users can delete move matches" ON public.move_matches;
DROP POLICY IF EXISTS "Users can create match actions" ON public.match_actions;
DROP POLICY IF EXISTS "Users can update own match actions" ON public.match_actions;
DROP POLICY IF EXISTS "Users can delete own match actions" ON public.match_actions;
DROP POLICY IF EXISTS "Admins can manage public links" ON public.public_links;
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;

-- Créer une fonction sécurisée pour obtenir le rôle de l'utilisateur
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Nouvelles politiques pour la table profiles
CREATE POLICY "All authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Nouvelles politiques pour la table clients
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own clients or admins can update all" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own clients or admins can delete all" ON public.clients
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Nouvelles politiques pour la table client_requests
CREATE POLICY "Authenticated users can view client requests" ON public.client_requests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create client requests" ON public.client_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own requests or admins can update all" ON public.client_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own requests or admins can delete all" ON public.client_requests
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Nouvelles politiques pour la table movers
CREATE POLICY "Authenticated users can view movers" ON public.movers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create movers" ON public.movers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own movers or admins can update all" ON public.movers
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own movers or admins can delete all" ON public.movers
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Nouvelles politiques pour la table confirmed_moves
CREATE POLICY "Authenticated users can view confirmed moves" ON public.confirmed_moves
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create confirmed moves" ON public.confirmed_moves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own moves or admins can update all" ON public.confirmed_moves
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own moves or admins can delete all" ON public.confirmed_moves
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Nouvelles politiques pour la table service_providers
CREATE POLICY "Authenticated users can view service providers" ON public.service_providers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create service providers" ON public.service_providers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own providers or admins can update all" ON public.service_providers
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own providers or admins can delete all" ON public.service_providers
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Nouvelles politiques pour la table trucks
CREATE POLICY "Authenticated users can view trucks" ON public.trucks
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create trucks" ON public.trucks
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trucks" ON public.trucks
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete trucks" ON public.trucks
  FOR DELETE TO authenticated
  USING (true);

-- Nouvelles politiques pour la table move_matches
CREATE POLICY "Authenticated users can view move matches" ON public.move_matches
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create move matches" ON public.move_matches
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update move matches" ON public.move_matches
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete move matches" ON public.move_matches
  FOR DELETE TO authenticated
  USING (true);

-- Nouvelles politiques pour la table match_actions
CREATE POLICY "Authenticated users can view match actions" ON public.match_actions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create match actions" ON public.match_actions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions or admins can update all" ON public.match_actions
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own actions or admins can delete all" ON public.match_actions
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.get_current_user_role() = 'admin'
  );

-- Politiques pour public_links (admin seulement)
CREATE POLICY "Admins can manage public links" ON public.public_links
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Politiques pour company_settings (admin seulement)
CREATE POLICY "Admins can manage company settings" ON public.company_settings
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Assurer que pierre@matchmove.fr a bien le rôle admin
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
