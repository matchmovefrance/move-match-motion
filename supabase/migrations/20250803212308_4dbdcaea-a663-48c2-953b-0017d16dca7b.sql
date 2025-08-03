-- Créer une fonction pour identifier le super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_email = 'elmourabitazeddine@gmail.com';
$$;

-- Mettre à jour les policies des profiles pour cacher le super admin
DROP POLICY IF EXISTS "Everyone can view all profiles" ON public.profiles;

CREATE POLICY "Users can view non-super-admin profiles" 
ON public.profiles 
FOR SELECT 
USING (NOT is_super_admin(email));

CREATE POLICY "Super admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.email() = 'elmourabitazeddine@gmail.com');

-- Empêcher la modification du super admin
CREATE POLICY "Prevent super admin modification" 
ON public.profiles 
FOR UPDATE 
USING (NOT is_super_admin(email));

-- Empêcher la suppression du super admin
CREATE POLICY "Prevent super admin deletion" 
ON public.profiles 
FOR DELETE 
USING (NOT is_super_admin(email));

-- Mettre à jour la fonction get_all_profiles pour exclure le super admin
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE(id uuid, email text, role text, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.email,
    p.role,
    p.company_name,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE NOT is_super_admin(p.email)
  ORDER BY p.created_at DESC;
$$;

-- Créer une fonction spéciale pour le super admin
CREATE OR REPLACE FUNCTION public.get_all_profiles_super_admin()
RETURNS TABLE(id uuid, email text, role text, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.email,
    p.role,
    p.company_name,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
$$;