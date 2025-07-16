-- Supprimer toutes les politiques existantes sur la table profiles pour éviter les conflits
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_manage_all" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_view_all" ON public.profiles;
DROP POLICY IF EXISTS "enable_insert_for_service_role" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;

-- Créer des politiques simples et non-récursives
CREATE POLICY "Allow authenticated users to view all profiles"
ON public.profiles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own profile"
ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Allow service role to insert profiles"
ON public.profiles
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Politique spéciale pour les admins (sans récursion)
CREATE POLICY "Allow profile management for admin role"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);