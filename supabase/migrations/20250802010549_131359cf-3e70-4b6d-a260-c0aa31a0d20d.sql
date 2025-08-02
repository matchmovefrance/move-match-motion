-- Créer une table pour contrôler l'état du système
CREATE TABLE public.system_control (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    kill_switch_active BOOLEAN NOT NULL DEFAULT false,
    encryption_enabled BOOLEAN NOT NULL DEFAULT false,
    encryption_key_hash TEXT,
    last_modified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer une ligne par défaut
INSERT INTO public.system_control (maintenance_mode, kill_switch_active, encryption_enabled) 
VALUES (false, false, false);

-- Activer RLS
ALTER TABLE public.system_control ENABLE ROW LEVEL SECURITY;

-- Policy pour que seuls les admins puissent tout voir/modifier
CREATE POLICY "Only admin can manage system control" 
ON public.system_control 
FOR ALL 
USING (auth.email() = 'elmourabitazeddine@gmail.com');

-- Créer une table pour les logs système
CREATE TABLE public.system_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details JSONB,
    user_email TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS pour les logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour que seuls les admins puissent voir les logs
CREATE POLICY "Only admin can view system logs" 
ON public.system_logs 
FOR SELECT 
USING (auth.email() = 'elmourabitazeddine@gmail.com');

-- Policy pour créer des logs (peut être fait par le système)
CREATE POLICY "System can create logs" 
ON public.system_logs 
FOR INSERT 
WITH CHECK (true);

-- Trigger pour update automatique
CREATE TRIGGER update_system_control_updated_at
BEFORE UPDATE ON public.system_control
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();