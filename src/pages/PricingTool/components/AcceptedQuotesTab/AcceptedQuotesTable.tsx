
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AcceptedQuoteCard } from "./AcceptedQuoteCard";

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

interface AcceptedQuotesTableProps {
  quotes: AcceptedQuoteWithDetails[];
  onMarkAsValidated: (quoteId: string) => void;
  onComplete: (quote: AcceptedQuoteWithDetails) => void;
  onReject: (quote: AcceptedQuoteWithDetails) => void;
  onDownloadPDF: (quote: AcceptedQuoteWithDetails) => void;
}

export const AcceptedQuotesTable = ({
  quotes,
  onMarkAsValidated,
  onComplete,
  onReject,
  onDownloadPDF
}: AcceptedQuotesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Opportunité</TableHead>
          <TableHead>Fournisseur</TableHead>
          <TableHead className="text-center">Prix</TableHead>
          <TableHead className="text-center">Date</TableHead>
          <TableHead className="text-center">Statut</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <AcceptedQuoteCard
            key={quote.id}
            quote={quote}
            onMarkAsValidated={onMarkAsValidated}
            onShowCompleteDialog={onComplete}
            onShowRejectDialog={onReject}
            onDownloadPDF={onDownloadPDF}
          />
        ))}
      </TableBody>
    </Table>
  );
};
