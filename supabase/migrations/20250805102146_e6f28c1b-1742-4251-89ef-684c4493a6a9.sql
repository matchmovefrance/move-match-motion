-- Create a hidden admin mapping system

-- Create a secure table to map system accounts to real admin identities
CREATE TABLE IF NOT EXISTS public.admin_identity_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_email text UNIQUE NOT NULL, -- The obfuscated email used in auth.users
  real_email text UNIQUE NOT NULL,   -- The real admin email
  real_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the mapping table - only super admins can access
ALTER TABLE public.admin_identity_mapping ENABLE ROW LEVEL SECURITY;

-- Only super admins can access this table
CREATE POLICY "Only super admins can access admin mapping" 
ON public.admin_identity_mapping 
FOR ALL 
TO authenticated 
USING (is_super_admin(auth.email()))
WITH CHECK (is_super_admin(auth.email()));

-- Insert the mappings for our current admins
INSERT INTO public.admin_identity_mapping (system_email, real_email, real_name) VALUES
('sys-admin-001@matchmove.internal', 'elmourabitazeddine@gmail.com', 'Admin Principal'),
('sys-admin-002@matchmove.internal', 'matchmove@proton.me', 'Admin Secondaire')
ON CONFLICT (system_email) DO NOTHING;

-- Update the is_super_admin function to work with system emails
CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT user_email IN ('sys-admin-001@matchmove.internal', 'sys-admin-002@matchmove.internal', 'elmourabitazeddine@gmail.com', 'matchmove@proton.me');
$function$;

-- Create function to get real email from system email
CREATE OR REPLACE FUNCTION public.get_real_admin_email(system_email text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT real_email FROM admin_identity_mapping WHERE admin_identity_mapping.system_email = get_real_admin_email.system_email),
    get_real_admin_email.system_email
  );
$function$;

-- Create function to get system email from real email
CREATE OR REPLACE FUNCTION public.get_system_admin_email(real_email text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT system_email FROM admin_identity_mapping WHERE admin_identity_mapping.real_email = get_system_admin_email.real_email),
    get_system_admin_email.real_email
  );
$function$;

-- Update is_super_admin_email function to include system emails
CREATE OR REPLACE FUNCTION public.is_super_admin_email(email_address text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT email_address IN ('elmourabitazeddine@gmail.com', 'matchmove@proton.me', 'sys-admin-001@matchmove.internal', 'sys-admin-002@matchmove.internal');
$function$;