-- Fix super admin authentication and hide super admin accounts

-- First, create a function to check if an email is a super admin email
CREATE OR REPLACE FUNCTION public.is_super_admin_email(email_address text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT email_address IN ('elmourabitazeddine@gmail.com', 'matchmove@proton.me');
$function$;

-- Update is_super_admin function to accept both emails during transition
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT user_email IN ('elmourabitazeddine@gmail.com', 'matchmove@proton.me');
$function$;

-- Fix system_control policies to allow both admin emails
DROP POLICY IF EXISTS "Only super admin can modify system control" ON public.system_control;
CREATE POLICY "Only super admin can modify system control" 
ON public.system_control 
FOR ALL 
TO authenticated 
USING (is_super_admin(auth.email()))
WITH CHECK (is_super_admin(auth.email()));

-- Fix profiles policies to allow super admin operations
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
CREATE POLICY "Super admin can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (is_super_admin(auth.email()));

-- Allow super admin to insert/update profiles without restrictions
CREATE POLICY "Super admin can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (is_super_admin(auth.email()))
WITH CHECK (is_super_admin(auth.email()));

-- Create a function to get non-super-admin profiles only
CREATE OR REPLACE FUNCTION public.get_visible_profiles()
 RETURNS TABLE(id uuid, email text, role text, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.email,
    p.role,
    p.company_name,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE NOT is_super_admin_email(p.email)
  ORDER BY p.created_at DESC;
$function$;

-- Update existing profile functions to hide super admin accounts
CREATE OR REPLACE FUNCTION public.get_all_profiles()
 RETURNS TABLE(id uuid, email text, role text, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM get_visible_profiles();
$function$;

CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
 RETURNS TABLE(id uuid, email text, role text, company_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM get_visible_profiles();
$function$;