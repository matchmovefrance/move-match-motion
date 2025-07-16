-- Mettre à jour la politique pour permettre aux agents de voir tous les inventaires
DROP POLICY IF EXISTS "Users can view their own inventories or admins can view all" ON public.inventories;

CREATE POLICY "Users can view inventories based on role" 
ON public.inventories
FOR SELECT 
USING (
  -- Admins et agents peuvent voir tous les inventaires
  (get_current_user_role() = 'admin'::text) OR 
  (get_current_user_role() = 'agent'::text) OR
  -- Les autres utilisateurs ne voient que les leurs
  (auth.uid() = created_by)
);