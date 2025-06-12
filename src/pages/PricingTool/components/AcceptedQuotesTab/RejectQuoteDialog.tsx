
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  supplierName: string;
  rejectionReason: string;
  onReasonChange: (reason: string) => void;
}

export const RejectQuoteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  supplierName,
  rejectionReason,
  onReasonChange
}: RejectQuoteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeter le devis</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir rejeter le devis de {supplierName} ? 
            Cette action est définitive et le devis sera supprimé automatiquement après 30 jours.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="rejection-reason">Raison du rejet (optionnel)</Label>
          <Textarea
            id="rejection-reason"
            placeholder="Ex: Prix trop élevé, délais non respectés, service inadéquat..."
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Rejeter le devis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
