
import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ClientRequest {
  id: number;
  name: string | null;
  email: string | null;
  quote_amount: number | null;
  desired_date: string;
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
        description: "Aucune adresse email renseignée pour ce client",
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
      // Ici vous pourrez implémenter l'envoi d'email
      // Pour l'instant, on simule juste l'action
      console.log('Envoi d\'email préparé pour:', {
        to: client.email,
        from: 'noreply@matchmove.fr',
        fromName: 'MatchMove - Solutions de déménagement',
        subject: `Votre devis de déménagement du ${new Date(client.desired_date).toLocaleDateString('fr-FR')}`,
        clientName: client.name,
        quoteAmount: client.quote_amount,
        desiredDate: client.desired_date
      });

      toast({
        title: "Préparé",
        description: "L'envoi d'email est prêt à être implémenté. Consultez la console pour les détails.",
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la préparation de l'email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const emailContent = `Bonjour ${client.name || 'Madame, Monsieur'},

Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre projet de déménagement.

📋 DÉTAILS DE VOTRE DEMANDE :
• Date souhaitée : ${new Date(client.desired_date).toLocaleDateString('fr-FR')}
• Montant du devis : ${client.quote_amount?.toFixed(2).replace('.', ',')} € TTC

📎 Vous trouverez en pièce jointe votre devis détaillé au format PDF.

✅ POURQUOI CHOISIR MATCHMOVE ?
• Solutions de déménagement professionnelles et personnalisées
• Équipe expérimentée et matériel de qualité
• Assurance tous risques incluse
• Devis transparent sans surprise
• Service client disponible 6j/7

Ce devis est valable 30 jours à compter de sa date d'émission. Pour toute question ou pour confirmer votre réservation, n'hésitez pas à nous contacter.

Nous restons à votre disposition pour vous accompagner dans votre projet de déménagement.

Cordialement,
L'équipe MatchMove

📞 Téléphone : +33 1 23 45 67 89
📧 Email : contact@matchmove.fr
🌐 Site web : www.matchmove.fr

---
MatchMove SAS - Solutions de déménagement professionnelles
Votre satisfaction, notre priorité.`;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="text-blue-600 hover:text-blue-700"
        disabled={!client.email || !client.quote_amount}
        title={!client.email ? "Aucune adresse email renseignée" : 
               !client.quote_amount ? "Aucun montant de devis renseigné" : 
               "Envoyer le devis par email"}
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
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">De :</span>
                  <p className="text-gray-800">MatchMove - Solutions de déménagement</p>
                  <p className="text-gray-600">noreply@matchmove.fr</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">À :</span>
                  <p className="text-gray-800">{client.name || 'Client'}</p>
                  <p className="text-blue-600">{client.email}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium text-gray-600">Objet :</span>
                <p className="text-gray-800">
                  Votre devis de déménagement du {new Date(client.desired_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-600 mb-2 block">Message :</label>
              <div className="bg-white border rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {emailContent}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                📎 Le devis PDF sera automatiquement joint à cet email
              </p>
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
