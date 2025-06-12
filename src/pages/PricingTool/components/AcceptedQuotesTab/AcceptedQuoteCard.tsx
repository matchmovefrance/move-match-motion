
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Euro, Calendar, Download, Check, Archive, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AcceptedQuoteWithDetails {
  id: string;
  bid_amount: number;
  status: string;
  notes: string | null;
  submitted_at: string;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  supplier: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
  opportunity: {
    title: string;
    departure_city: string;
    arrival_city: string;
  };
}

interface AcceptedQuoteCardProps {
  quote: AcceptedQuoteWithDetails;
  onMarkAsValidated: (quoteId: string) => void;
  onComplete: (quote: AcceptedQuoteWithDetails) => void;
  onReject: (quote: AcceptedQuoteWithDetails) => void;
  onDownloadPDF: (quote: AcceptedQuoteWithDetails) => void;
}

export const AcceptedQuoteCard = ({
  quote,
  onMarkAsValidated,
  onComplete,
  onReject,
  onDownloadPDF
}: AcceptedQuoteCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="secondary">En attente validation client</Badge>;
      case 'validated_by_client':
        return <Badge className="bg-green-100 text-green-800">Validé par le client</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDateToDisplay = () => {
    if (quote.status === 'rejected' && quote.rejected_at) {
      return {
        date: quote.rejected_at,
        label: 'Date de rejet'
      };
    }
    return {
      date: quote.submitted_at,
      label: "Date d'acceptation"
    };
  };

  const dateInfo = getDateToDisplay();

  return (
    <tr>
      <td className="p-4">
        <div className="space-y-1">
          <div className="font-medium">{quote.opportunity?.title || 'Opportunité supprimée'}</div>
          {quote.opportunity && (
            <div className="text-sm text-muted-foreground">
              {quote.opportunity.departure_city} → {quote.opportunity.arrival_city}
            </div>
          )}
          {quote.status === 'rejected' && quote.rejection_reason && (
            <div className="text-xs text-red-600 mt-1">
              Raison: {quote.rejection_reason}
            </div>
          )}
        </div>
      </td>
      
      <td className="p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{quote.supplier?.company_name || 'Fournisseur supprimé'}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {quote.supplier?.contact_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {quote.supplier?.email}
          </div>
        </div>
      </td>
      
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <Euro className="h-4 w-4 text-green-600" />
          <span className="font-bold text-lg">{quote.bid_amount.toLocaleString()}€</span>
        </div>
      </td>
      
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <div>{format(new Date(dateInfo.date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</div>
            <div className="text-xs text-muted-foreground">{dateInfo.label}</div>
          </div>
        </div>
      </td>
      
      <td className="p-4 text-center">
        {getStatusBadge(quote.status)}
      </td>
      
      <td className="p-4">
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadPDF(quote)}
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          
          {quote.status === 'accepted' && (
            <>
              <Button
                size="sm"
                onClick={() => onMarkAsValidated(quote.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Validé
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onReject(quote)}
              >
                <X className="h-4 w-4 mr-1" />
                Rejeter
              </Button>
            </>
          )}
          
          {quote.status === 'validated_by_client' && (
            <Button
              size="sm"
              onClick={() => onComplete(quote)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Archive className="h-4 w-4 mr-1" />
              Trajet terminé
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
