import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Package, DollarSign, User, Phone, Mail, FileText, CheckCircle, X, Eye, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { MarkCompleteDialog } from '@/components/MarkCompleteDialog';

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
    client_request_id?: number;
  };
}

interface AcceptedQuoteCardProps {
  quote: AcceptedQuoteWithDetails;
  onMarkAsValidated: (quoteId: string) => void;
  onShowCompleteDialog: (quote: AcceptedQuoteWithDetails) => void;
  onShowRejectDialog: (quote: AcceptedQuoteWithDetails) => void;
  onDownloadPDF: (quote: AcceptedQuoteWithDetails) => void;
  onMarkAsCompleted?: (quote: AcceptedQuoteWithDetails) => void;
}

export const AcceptedQuoteCard = ({ 
  quote, 
  onMarkAsValidated, 
  onShowCompleteDialog, 
  onShowRejectDialog, 
  onDownloadPDF,
  onMarkAsCompleted 
}: AcceptedQuoteCardProps) => {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepté</Badge>;
      case 'validated_by_client':
        return <Badge className="bg-blue-100 text-blue-800">Validé par le client</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkAsCompleted = () => {
    if (onMarkAsCompleted) {
      onMarkAsCompleted(quote);
    }
    setShowCompleteDialog(false);
  };

  const getActionButtons = () => {
    switch (quote.status) {
      case 'accepted':
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkAsValidated(quote.id)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Marquer validé
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Flag className="h-4 w-4 mr-1" />
              Marquer terminé
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowRejectDialog(quote)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadPDF(quote)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        );
        
      case 'validated_by_client':
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Flag className="h-4 w-4 mr-1" />
              Trajet terminé
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowRejectDialog(quote)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadPDF(quote)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        );
        
      case 'rejected':
      case 'completed':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadPDF(quote)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                {quote.bid_amount.toLocaleString()}€
                {getStatusBadge(quote.status)}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {quote.opportunity.departure_city} → {quote.opportunity.arrival_city}
              </CardDescription>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(quote.submitted_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Opportunité
              </h4>
              <div className="text-sm bg-gray-50 p-3 rounded-md">
                <p className="font-medium">{quote.opportunity.title}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Prestataire
              </h4>
              <div className="text-sm bg-gray-50 p-3 rounded-md">
                <p className="font-medium">{quote.supplier.company_name}</p>
                <p className="text-muted-foreground">{quote.supplier.contact_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3" />
                  <span className="text-xs">{quote.supplier.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span className="text-xs">{quote.supplier.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Notes
              </h4>
              <div className="text-sm bg-gray-50 p-3 rounded-md">
                {quote.notes}
              </div>
            </div>
          )}

          {quote.status === 'rejected' && quote.rejection_reason && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2 text-red-600">
                <X className="h-4 w-4" />
                Raison du rejet
              </h4>
              <div className="text-sm bg-red-50 p-3 rounded-md text-red-700">
                {quote.rejection_reason}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            {getActionButtons()}
          </div>
        </CardContent>
      </Card>

      <MarkCompleteDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Marquer le devis comme terminé"
        description="Êtes-vous sûr de vouloir marquer ce devis comme terminé ? Cette action indique que le service a été complètement réalisé."
        itemName={`Devis ${quote.bid_amount.toLocaleString()}€ - ${quote.supplier.company_name}`}
        onConfirm={handleMarkAsCompleted}
      />
    </>
  );
};
