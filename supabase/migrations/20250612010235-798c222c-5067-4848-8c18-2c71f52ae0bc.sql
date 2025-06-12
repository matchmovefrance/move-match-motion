
-- Programmer la suppression automatique des devis rejetés (tous les jours à 2h du matin)
SELECT cron.schedule(
  'delete-old-rejected-quotes',
  '0 2 * * *',
  $$
  SELECT delete_old_rejected_quotes();
  $$
);
