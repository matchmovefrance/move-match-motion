-- Supprimer les anciennes politiques restrictives sur profiles
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile management for admin role" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- Créer une nouvelle politique simple pour permettre à tous les utilisateurs authentifiés de voir tous les profils
CREATE POLICY "Everyone can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Permettre aux utilisateurs de créer leur propre profil
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permettre au service role d'insérer des profils (pour le trigger de création)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);