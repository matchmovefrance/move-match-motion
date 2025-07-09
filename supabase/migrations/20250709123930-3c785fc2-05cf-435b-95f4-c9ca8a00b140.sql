-- Créer une table pour les meubles personnalisés ajoutés manuellement
CREATE TABLE public.custom_furniture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  volume NUMERIC NOT NULL CHECK (volume > 0),
  description TEXT,
  icon TEXT DEFAULT '📦',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.custom_furniture ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view all custom furniture" 
ON public.custom_furniture 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own custom furniture" 
ON public.custom_furniture 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own custom furniture" 
ON public.custom_furniture 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own custom furniture" 
ON public.custom_furniture 
FOR DELETE 
USING (auth.uid() = created_by);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_custom_furniture_updated_at
BEFORE UPDATE ON public.custom_furniture
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();