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
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

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

  const generatePDFBase64 = async (): Promise<string> => {
    const doc = new jsPDF();
    
    // Couleurs vertes
    const primaryColor = '#22c55e';
    const secondaryColor = '#64748b';
    
    // En-tête avec fond vert
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo en base64
    try {
      const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABNYSURBVHhe7Z0JmBTVtccPCCKyiEvUIAoqKipqFEVFxSVGTVzixhITl5jEJZpnTNSYmLjEJ5pnTNSYuD1jjEtc4hKXuMclLnGJW1ziEpe4xCVuUVFRUVFRQRBE4P3PrXM79dXtnu6Z7p6Z6f6/7/u+6eqqW3XrnFu3zq1bt6rEYDBYjYgYDIYoRMRgMEQhIgaDIQoRMYPBYIhCRMxgMEQhIgaDIQoRMYPBEIWImMFgiEJEzGAwRCEiZjAYohARMxgMUYiIGQyGKETEDAZDFCJiBkMUImIGgyEKETGDwRCFiJjBYIhCRMxgMEQhImYwGKIQETMYDFGIiBkMhihExAwGQxQiYgaDIQoRMYPBEIWImMFgiEJEzGAwRCEiZjAYohARMxgMUYiIGQyGKETEDAZDFCJiBsM/yRkRERERERFJOyJiIiIikhGJiEhEREKJiBhERERERERERERE0tKv2r5+XQNBAAAABJRU5ErkJggg==";
      doc.addImage(logoBase64, 'PNG', 20, 8, 50, 25);
    } catch (error) {
      console.error("Erreur de chargement du logo:", error);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('MatchMove', 20, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Solutions de déménagement', 20, 32);
    }
    
    // Titre du document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 60);
    
    // Informations de la société
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('MatchMove SAS', 140, 60);
    doc.text('Email: contact@matchmove.fr', 140, 67);
    doc.text('Téléphone: +33 1 23 45 67 89', 140, 74);
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 85, 190, 85);
    
    // Informations client
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS CLIENT', 20, 100);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 110;
    
    if (client.name) {
      doc.text(`Nom: ${client.name}`, 20, yPos);
      yPos += 7;
    }
    
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, yPos);
      yPos += 7;
    }
    
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, 20, yPos);
      yPos += 7;
    }
    
    // Détails du déménagement
    yPos += 10;
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Adresses
    doc.text('Adresse de départ:', 20, yPos);
    yPos += 7;
    const departureAddr = `${client.departure_address || ''} ${client.departure_postal_code} ${client.departure_city}`.trim();
    doc.text(departureAddr, 25, yPos);
    
    yPos += 10;
    doc.text('Adresse d\'arrivée:', 20, yPos);
    yPos += 7;
    const arrivalAddr = `${client.arrival_address || ''} ${client.arrival_postal_code} ${client.arrival_city}`.trim();
    doc.text(arrivalAddr, 25, yPos);
    
    yPos += 10;
    doc.text(`Date souhaitée: ${new Date(client.desired_date).toLocaleDateString('fr-FR')}`, 20, yPos);
    
    if (client.estimated_volume) {
      yPos += 7;
      doc.text(`Volume estimé: ${client.estimated_volume} m³`, 20, yPos);
    }
    
    // Prix
    if (client.quote_amount) {
      yPos += 20;
      
      // Encadré pour le prix avec fond vert clair
      doc.setFillColor(240, 253, 244);
      doc.rect(20, yPos - 5, 170, 25, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.rect(20, yPos - 5, 170, 25);
      
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTANT DU DEVIS', 25, yPos + 5);
      
      doc.setFontSize(20);
      doc.text(`${client.quote_amount.toFixed(2).replace('.', ',')} €`, 25, yPos + 15);
    }
    
    // Conditions
    yPos += 40;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Conditions générales:', 20, yPos);
    yPos += 5;
    doc.text('• Ce devis est valable 30 jours à compter de sa date d\'émission', 20, yPos);
    yPos += 4;
    doc.text('• Les prix sont exprimés en euros TTC', 20, yPos);
    yPos += 4;
    doc.text('• Une confirmation écrite est requise pour valider la prestation', 20, yPos);
    
    // Pied de page
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 280);
    doc.text('MatchMove - Solutions de déménagement professionnelles', 20, 285);
    
    // Retourner le PDF en base64
    return doc.output('datauristring').split(',')[1];
  };

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
      // Générer le PDF en base64
      const pdfBase64 = await generatePDFBase64();
      
      // Appeler la fonction Edge pour envoyer l'email
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          clientName: client.name,
          clientEmail: client.email,
          quoteAmount: client.quote_amount,
          desiredDate: client.desired_date,
          pdfBase64: pdfBase64
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email envoyé",
        description: `Le devis a été envoyé avec succès à ${client.email}`,
      });
      
      setIsOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'envoyer l'email: ${error.message}`,
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
                  <p className="text-gray-800">MatchMove déménagements solutions</p>
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

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                📎 Le devis PDF sera automatiquement joint à cet email avec un message professionnel personnalisé
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
