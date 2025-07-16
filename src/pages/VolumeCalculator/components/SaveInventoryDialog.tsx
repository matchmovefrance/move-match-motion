import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SaveInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: () => void;
  onUpdateExisting: () => void;
  inventoryReference?: string;
}

export const SaveInventoryDialog = ({
  open,
  onOpenChange,
  onCreateNew,
  onUpdateExisting,
  inventoryReference
}: SaveInventoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sauvegarde de l'inventaire</DialogTitle>
          <DialogDescription>
            {inventoryReference 
              ? `Vous modifiez l'inventaire "${inventoryReference}". Voulez-vous mettre à jour cet inventaire ou en créer un nouveau ?`
              : "Comment souhaitez-vous sauvegarder cet inventaire ?"
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCreateNew}>
            Créer un nouvel inventaire
          </Button>
          {inventoryReference && (
            <Button onClick={onUpdateExisting}>
              Mettre à jour l'inventaire existant
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};