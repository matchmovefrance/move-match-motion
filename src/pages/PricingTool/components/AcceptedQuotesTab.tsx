
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AcceptedQuotesTable } from './AcceptedQuotesTab/AcceptedQuotesTable';
import { QuoteFilters } from './AcceptedQuotesTab/QuoteFilters';
import { RejectQuoteDialog } from './AcceptedQuotesTab/RejectQuoteDialog';
import { useAcceptedQuotes } from './AcceptedQuotesTab/useAcceptedQuotes';

const AcceptedQuotesTab = () => {
  const {
    acceptedQuotes,
    isLoading,
    showCompleteDialog,
    setShowCompleteDialog,
    showRejectDialog,
    setShowRejectDialog,
    selectedQuote,
    rejectionReason,
    setRejectionReason,
    filter,
    setFilter,
    handleMarkAsValidated,
    handleShowCompleteDialog,
    handleShowRejectDialog,
    handleConfirmComplete,
    handleConfirmReject,
    handleDownloadPDF,
    handleDeleteAcceptedQuote
  } = useAcceptedQuotes();

  // Calculer les compteurs pour les filtres
  const quoteCounts = {
    all: acceptedQuotes?.length || 0,
    accepted: acceptedQuotes?.filter(q => q.status === 'accepted').length || 0,
    validated_by_client: acceptedQuotes?.filter(q => q.status === 'validated_by_client').length || 0,
    rejected: acceptedQuotes?.filter(q => q.status === 'rejected').length || 0
  };

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
            Gestion des devis acceptés
          </CardTitle>
          <CardDescription>
            Suivi et validation des devis acceptés par les clients et via le moteur de matching
          </CardDescription>
        </CardHeader>
      </Card>

      <QuoteFilters
        filter={filter}
        onFilterChange={setFilter}
        quoteCounts={quoteCounts}
      />

      {acceptedQuotes && acceptedQuotes.length > 0 ? (
        <div className="space-y-4">
          {acceptedQuotes.map((quote) => (
            <div key={quote.id} className="border rounded-lg p-1">
              <AcceptedQuotesTable
                quotes={[quote]}
                onMarkAsValidated={handleMarkAsValidated}
                onComplete={handleShowCompleteDialog}
                onReject={handleShowRejectDialog}
                onDownloadPDF={handleDownloadPDF}
                onDeleteAcceptedQuote={handleDeleteAcceptedQuote}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {filter === 'all' ? 'Aucun devis' : 
                 filter === 'accepted' ? 'Aucun devis en attente' :
                 filter === 'validated_by_client' ? 'Aucun devis validé' :
                 'Aucun devis rejeté'}
              </h3>
              <p className="text-sm">
                {filter === 'all' ? 'Les devis acceptés (manuels et automatiques) apparaîtront ici.' :
                 filter === 'accepted' ? 'Aucun devis en attente de validation client.' :
                 filter === 'validated_by_client' ? 'Aucun devis validé par le client.' :
                 'Aucun devis rejeté.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Confirmer la fin du trajet"
        description={`Êtes-vous sûr de vouloir marquer le trajet avec ${selectedQuote?.supplier?.company_name || 'le transporteur'} comme terminé ? Cette action est définitive et déplacera le trajet vers l'historique.`}
        confirmText="Trajet terminé"
        cancelText="Annuler"
        onConfirm={handleConfirmComplete}
        variant="default"
      />

      <RejectQuoteDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={handleConfirmReject}
        supplierName={selectedQuote?.supplier?.company_name || 'le transporteur'}
        rejectionReason={rejectionReason}
        onReasonChange={setRejectionReason}
      />
    </div>
  );
};

export default AcceptedQuotesTab;
