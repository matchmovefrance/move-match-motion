
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AcceptedQuotesTable } from './AcceptedQuotesTab/AcceptedQuotesTable';
import { useAcceptedQuotes } from './AcceptedQuotesTab/useAcceptedQuotes';

const AcceptedQuotesTab = () => {
  const {
    acceptedQuotes,
    isLoading,
    showCompleteDialog,
    setShowCompleteDialog,
    selectedQuote,
    handleMarkAsValidated,
    handleShowCompleteDialog,
    handleConfirmComplete,
    handleDownloadPDF
  } = useAcceptedQuotes();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Devis acceptés en cours de validation
          </CardTitle>
          <CardDescription>
            Gestion des devis acceptés et validation par les clients
          </CardDescription>
        </CardHeader>
      </Card>

      {acceptedQuotes && acceptedQuotes.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <AcceptedQuotesTable
              quotes={acceptedQuotes}
              onMarkAsValidated={handleMarkAsValidated}
              onComplete={handleShowCompleteDialog}
              onDownloadPDF={handleDownloadPDF}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucun devis accepté</h3>
              <p className="text-sm">
                Les devis acceptés apparaîtront ici en attente de validation client.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Confirmer la fin du trajet"
        description={`Êtes-vous sûr de vouloir marquer le trajet avec ${selectedQuote?.supplier?.company_name} comme terminé ? Cette action est définitive et déplacera le trajet vers l'historique.`}
        confirmText="Trajet terminé"
        cancelText="Annuler"
        onConfirm={handleConfirmComplete}
        variant="default"
      />
    </div>
  );
};

export default AcceptedQuotesTab;
