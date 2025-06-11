
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, User, Building, Euro, Calendar, Download, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AcceptedQuote {
  id: string;
  supplier: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
  client_name: string;
  price: number;
  accepted_at: string;
  status: 'pending_client_validation' | 'validated_by_client';
  opportunity_title: string;
}

const AcceptedQuotesTab = () => {
  const { toast } = useToast();
  
  // Données de démonstration
  const [acceptedQuotes, setAcceptedQuotes] = useState<AcceptedQuote[]>([
    {
      id: '1',
      supplier: {
        company_name: 'Transport Express',
        contact_name: 'Jean Dupont',
        email: 'jean@transport-express.fr',
        phone: '+33 1 23 45 67 89'
      },
      client_name: 'Marie Martin',
      price: 1850,
      accepted_at: '2024-01-15T10:30:00',
      status: 'pending_client_validation',
      opportunity_title: 'Déménagement Paris → Lyon'
    },
    {
      id: '2',
      supplier: {
        company_name: 'Logistics Pro',
        contact_name: 'Pierre Durand',
        email: 'pierre@logistics-pro.fr',
        phone: '+33 1 98 76 54 32'
      },
      client_name: 'Sophie Leroy',
      price: 2200,
      accepted_at: '2024-01-14T14:20:00',
      status: 'validated_by_client',
      opportunity_title: 'Déménagement Marseille → Toulouse'
    }
  ]);

  const handleMarkAsValidated = (quoteId: string) => {
    setAcceptedQuotes(prevQuotes =>
      prevQuotes.map(quote =>
        quote.id === quoteId
          ? { ...quote, status: 'validated_by_client' }
          : quote
      )
    );
    
    toast({
      title: "Devis validé",
      description: "Le devis a été marqué comme validé par le client.",
    });
  };

  const handleDownloadPDF = (quote: AcceptedQuote) => {
    toast({
      title: "Téléchargement PDF",
      description: `Le PDF du devis de ${quote.supplier.company_name} va être téléchargé.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_client_validation':
        return <Badge variant="secondary">En attente validation client</Badge>;
      case 'validated_by_client':
        return <Badge className="bg-green-100 text-green-800">Validé par le client</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

      {acceptedQuotes.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunité</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-center">Prix</TableHead>
                  <TableHead className="text-center">Date d'acceptation</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acceptedQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="font-medium">{quote.opportunity_title}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{quote.client_name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{quote.supplier.company_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {quote.supplier.contact_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quote.supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-lg">{quote.price.toLocaleString()}€</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(quote.accepted_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {getStatusBadge(quote.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        
                        {quote.status === 'pending_client_validation' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsValidated(quote.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Validé
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
};

export default AcceptedQuotesTab;
