
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Copy, Link, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupplierLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string | null;
  password: string | null;
  supplierName: string;
}

const SupplierLinkDialog = ({ open, onOpenChange, link, password, supplierName }: SupplierLinkDialogProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopyLink = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({
        title: "Lien copié !",
        description: "Le lien a été copié dans le presse-papier.",
      });
    }
  };

  const handleCopyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast({
        title: "Mot de passe copié !",
        description: "Le mot de passe a été copié dans le presse-papier.",
      });
    }
  };

  const handleCopyBoth = async () => {
    if (link && password) {
      const fullText = `Lien d'accès pour ${supplierName}:\n${link}\n\nMot de passe: ${password}`;
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Informations copiées !",
        description: "Le lien et le mot de passe ont été copiés.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-500" />
            Lien d'accès fournisseur - {supplierName}
          </DialogTitle>
          <DialogDescription>
            Partagez ces informations avec le fournisseur pour qu'il puisse soumettre ses tarifs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lien d'accès */}
          <div className="space-y-2">
            <Label htmlFor="supplier-link">Lien d'accès</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="supplier-link"
                value={link || ''} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={copiedLink ? 'bg-green-50 text-green-700' : ''}
              >
                {copiedLink ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="supplier-password">Mot de passe</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input 
                  id="supplier-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password || ''} 
                  readOnly 
                  className="font-mono text-lg tracking-widest pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPassword}
                className={copiedPassword ? 'bg-green-50 text-green-700' : ''}
              >
                {copiedPassword ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Instructions pour le fournisseur :</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Cliquez sur le lien d'accès</li>
              <li>Entrez le mot de passe fourni</li>
              <li>Configurez vos tarifs et conditions</li>
              <li>Soumettez vos prix pour les opportunités</li>
            </ol>
          </div>

          {/* Sécurité */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ Sécurité :</h4>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Ce lien expire dans 7 jours</li>
              <li>Le mot de passe est unique pour ce fournisseur</li>
              <li>Ne partagez ces informations qu'avec la personne autorisée</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handleCopyBoth}>
            <Copy className="h-4 w-4 mr-2" />
            Copier tout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierLinkDialog;
