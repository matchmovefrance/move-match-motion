
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Download, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface Client {
  id: number;
  name: string;
  email: string;
  departure_address: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  estimated_volume: number;
  desired_date: string;
  quote_amount?: number;
}

interface Quote {
  clientId: number;
  clientName: string;
  price: number;
  breakdown: {
    basePrice: number;
    volumeCost: number;
    distanceCost: number;
    additionalFees: number;
  };
}

const QuoteGenerator = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientsData = data?.filter(client => 
        client.name && 
        client.departure_address && 
        client.departure_city && 
        client.departure_postal_code &&
        client.arrival_address &&
        client.arrival_city &&
        client.arrival_postal_code
      ) || [];

      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateQuote = (client: Client): Quote => {
    // Calcul basique du devis
    const basePrice = 150;
    const volumeCost = client.estimated_volume * 25;
    
    // Estimation de distance basée sur les codes postaux
    const departureCode = parseInt(client.departure_postal_code.substring(0, 2));
    const arrivalCode = parseInt(client.arrival_postal_code.substring(0, 2));
    const estimatedDistance = Math.abs(departureCode - arrivalCode) * 50;
    const distanceCost = estimatedDistance * 1.2;
    
    const additionalFees = client.estimated_volume > 20 ? 100 : 50;
    
    const totalPrice = basePrice + volumeCost + distanceCost + additionalFees;

    return {
      clientId: client.id,
      clientName: client.name,
      price: Math.round(totalPrice),
      breakdown: {
        basePrice,
        volumeCost,
        distanceCost,
        additionalFees
      }
    };
  };

  const generateAllQuotes = async () => {
    setGenerating(true);
    
    try {
      const newQuotes = clients.map(client => calculateQuote(client));
      setQuotes(newQuotes);
      
      toast({
        title: "Devis générés",
        description: `${newQuotes.length} devis ont été générés avec succès`,
      });
    } catch (error) {
      console.error('Error generating quotes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les devis",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQuotePDF = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    if (!client) return;

    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('DEVIS DÉMÉNAGEMENT', 20, 30);
    
    // Informations client
    doc.setFontSize(12);
    doc.text(`Client: ${client.name}`, 20, 50);
    doc.text(`Email: ${client.email}`, 20, 60);
    doc.text(`Départ: ${client.departure_address}, ${client.departure_city}`, 20, 70);
    doc.text(`Arrivée: ${client.arrival_address}, ${client.arrival_city}`, 20, 80);
    doc.text(`Volume estimé: ${client.estimated_volume} m³`, 20, 90);
    doc.text(`Date souhaitée: ${new Date(client.desired_date).toLocaleDateString('fr-FR')}`, 20, 100);
    
    // Détail du devis
    doc.text('DÉTAIL DU DEVIS:', 20, 120);
    doc.text(`Prix de base: ${quote.breakdown.basePrice}€`, 20, 140);
    doc.text(`Coût volume (${client.estimated_volume} m³): ${quote.breakdown.volumeCost}€`, 20, 150);
    doc.text(`Coût distance: ${quote.breakdown.distanceCost}€`, 20, 160);
    doc.text(`Frais additionnels: ${quote.breakdown.additionalFees}€`, 20, 170);
    
    // Total
    doc.setFontSize(14);
    doc.text(`TOTAL: ${quote.price}€`, 20, 190);
    
    // Téléchargement
    doc.save(`devis-${client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    
    toast({
      title: "PDF téléchargé",
      description: `Le devis pour ${client.name} a été téléchargé`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Générateur de Devis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">
                {clients.length} client{clients.length > 1 ? 's' : ''} éligible{clients.length > 1 ? 's' : ''} pour génération de devis
              </p>
            </div>
            <Button 
              onClick={generateAllQuotes}
              disabled={generating || clients.length === 0}
            >
              {generating ? 'Génération...' : 'Générer tous les devis'}
            </Button>
          </div>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des clients...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {quotes.length > 0 && (
        <div className="grid gap-4">
          {quotes.map((quote) => {
            const client = clients.find(c => c.id === quote.clientId);
            if (!client) return null;

            return (
              <Card key={quote.clientId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{quote.clientName}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">
                        {quote.price}€
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQuotePDF(quote)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Départ:</strong> {client.departure_city}</p>
                      <p><strong>Arrivée:</strong> {client.arrival_city}</p>
                      <p><strong>Volume:</strong> {client.estimated_volume} m³</p>
                    </div>
                    <div>
                      <p><strong>Prix de base:</strong> {quote.breakdown.basePrice}€</p>
                      <p><strong>Coût volume:</strong> {quote.breakdown.volumeCost}€</p>
                      <p><strong>Coût distance:</strong> {quote.breakdown.distanceCost}€</p>
                      <p><strong>Frais additionnels:</strong> {quote.breakdown.additionalFees}€</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuoteGenerator;
