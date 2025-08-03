-- Corriger les policies RLS pour system_control
DROP POLICY IF EXISTS "Only admin can manage system control" ON public.system_control;

-- Permettre l'accès en lecture à tous les utilisateurs authentifiés pour system_control
CREATE POLICY "Authenticated users can view system control" 
ON public.system_control 
FOR SELECT 
USING (true);

-- Seul le super admin peut modifier system_control
CREATE POLICY "Only super admin can modify system control" 
ON public.system_control 
FOR ALL 
USING (auth.email() = 'elmourabitazeddine@gmail.com')
WITH CHECK (auth.email() = 'elmourabitazeddine@gmail.com');

-- Corriger les policies pour system_logs - permettre lecture aux authentifiés
DROP POLICY IF EXISTS "Only admin can view system logs" ON public.system_logs;
DROP POLICY IF EXISTS "System can create logs" ON public.system_logs;

CREATE POLICY "Authenticated users can view system logs" 
ON public.system_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can create logs" 
ON public.system_logs 
FOR INSERT 
WITH CHECK (true);