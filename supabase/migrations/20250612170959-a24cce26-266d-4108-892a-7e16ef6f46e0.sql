
-- Ajouter une colonne pour spécifier le type de lien public
ALTER TABLE public.public_links 
ADD COLUMN link_type text NOT NULL DEFAULT 'mover';

-- Ajouter une contrainte pour valider les types de liens
ALTER TABLE public.public_links 
ADD CONSTRAINT valid_link_type CHECK (link_type IN ('client', 'mover'));

-- Créer une fonction pour auto-enregistrer les matchs dans analytics
CREATE OR REPLACE FUNCTION auto_save_match_analytics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer automatiquement le match dans move_matches pour analytics
  INSERT INTO public.move_matches (
    client_id,
    move_id,
    match_type,
    volume_ok,
    combined_volume,
    distance_km,
    date_diff_days,
    is_valid
  ) VALUES (
    NEW.client_id,
    NEW.move_id,
    COALESCE(NEW.match_type, 'auto'),
    COALESCE(NEW.volume_ok, false),
    COALESCE(NEW.combined_volume, 0),
    COALESCE(NEW.distance_km, 0),
    COALESCE(NEW.date_diff_days, 0),
    COALESCE(NEW.is_valid, false)
  )
  ON CONFLICT DO NOTHING; -- Éviter les doublons
  
  RETURN NEW;
END;
$$;

-- Créer un trigger pour auto-enregistrer les matchs quand ils sont acceptés
CREATE OR REPLACE TRIGGER trigger_auto_save_match_analytics
  AFTER INSERT ON public.match_actions
  FOR EACH ROW
  WHEN (NEW.action_type = 'accepted')
  EXECUTE FUNCTION auto_save_match_analytics();
