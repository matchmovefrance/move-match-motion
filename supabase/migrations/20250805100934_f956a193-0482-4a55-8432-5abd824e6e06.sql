-- Update super admin email from elmourabitazeddine@gmail.com to matchmove@proton.me

-- First, update the is_super_admin function to use the new email
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT user_email = 'matchmove@proton.me';
$function$;

-- Update the profiles table if the old admin profile exists
UPDATE public.profiles 
SET email = 'matchmove@proton.me' 
WHERE email = 'elmourabitazeddine@gmail.com';

-- Drop and recreate RLS policies that reference the old email
DROP POLICY IF EXISTS "Only super admin can modify system control" ON public.system_control;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;

-- Recreate the system_control policy with new email
CREATE POLICY "Only super admin can modify system control" 
ON public.system_control 
FOR ALL 
TO authenticated 
USING (auth.email() = 'matchmove@proton.me'::text)
WITH CHECK (auth.email() = 'matchmove@proton.me'::text);

-- Recreate the profiles policy with new email  
CREATE POLICY "Super admin can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.email() = 'matchmove@proton.me'::text);