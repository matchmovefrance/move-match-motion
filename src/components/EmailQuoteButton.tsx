
import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientRequest {
  id: number;
  name: string | null;
  email: string | null;
  quote_amount: number | null;
  desired_date: string;
  phone: string | null;
  departure_address: string | null;
  departure_postal_code: string | null;
  departure_city: string | null;
  arrival_address: string | null;
  arrival_postal_code: string | null;
  arrival_city: string | null;
  estimated_volume: number | null;
}

interface EmailQuoteButtonProps {
  client: ClientRequest;
}

const EmailQuoteButton = ({ client }: EmailQuoteButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!client.email) {
      toast({
        title: "Erreur",
        description: "Aucune adresse email renseignée",
        variant: "destructive",
      });
      return;
    }

    if (!client.quote_amount) {
      toast({
        title: "Erreur", 
        description: "Aucun montant de devis renseigné",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📧 Envoi devis à:', client.email);
      
      const emailPayload = {
        clientName: client.name || 'Client',
        clientEmail: client.email,
        quoteAmount: client.quote_amount,
        desiredDate: client.desired_date,
        clientPhone: client.phone,
        departureAddress: client.departure_address,
        departurePostalCode: client.departure_postal_code,
        departureCity: client.departure_city,
        arrivalAddress: client.arrival_address,
        arrivalPostalCode: client.arrival_postal_code,
        arrivalCity: client.arrival_city,
        estimatedVolume: client.estimated_volume
      };

      console.log('📦 Payload:', emailPayload);

      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: emailPayload
      });

      console.log('📨 Réponse:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(error.message || 'Erreur lors de l\'appel de la fonction');
      }

      if (data?.success === false) {
        throw new Error(data.error || 'L\'envoi a échoué');
      }

      toast({
        title: "✅ Email envoyé",
        description: `Le devis a été envoyé à ${client.email}`,
      });
      setIsOpen(false);
      
    } catch (error: any) {
      console.error('💥 Erreur complète:', error);
      
      toast({
        title: "❌ Erreur d'envoi",
        description: error.message || "Impossible d'envoyer l'email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !client.email || !client.quote_amount;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="text-blue-600 hover:text-blue-700"
        disabled={isDisabled}
        title={isDisabled ? "Email ou montant manquant" : "Envoyer le devis par email"}
      >
        <Mail className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>Envoyer le devis par email</span>
            </DialogTitle>
            <DialogDescription>
              Le devis sera envoyé directement en HTML dans l'email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">À :</span>
                  <p className="text-gray-800">{client.name || 'Client'}</p>
                  <p className="text-blue-600">{client.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Montant :</span>
                  <p className="text-green-600 font-bold text-lg">
                    {client.quote_amount?.toLocaleString('fr-FR')} € TTC
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>Envoi en cours...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le devis
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmailQuoteButton;
