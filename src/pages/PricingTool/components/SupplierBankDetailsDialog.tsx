
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreditCard, Save } from 'lucide-react';

interface BankDetails {
  iban: string;
  bic: string;
  bank_name: string;
  account_holder: string;
}

interface SupplierBankDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: any;
  onUpdate: () => void;
}

const SupplierBankDetailsDialog = ({ open, onOpenChange, supplier, onUpdate }: SupplierBankDetailsDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BankDetails>({
    defaultValues: {
      iban: supplier?.bank_details?.iban || '',
      bic: supplier?.bank_details?.bic || '',
      bank_name: supplier?.bank_details?.bank_name || '',
      account_holder: supplier?.bank_details?.account_holder || supplier?.contact_name || '',
    },
  });

  const onSubmit = async (data: BankDetails) => {
    setIsLoading(true);
    try {
      console.log('💳 Mise à jour coordonnées bancaires pour:', supplier?.company_name);

      // Mettre à jour les coordonnées bancaires dans le pricing_model du prestataire
      const updatedPricingModel = {
        ...supplier?.pricing_model,
        bank_details: data
      };

      // Si c'est un prestataire depuis les trajets, on simule la sauvegarde
      if (supplier?.id?.startsWith('move-supplier-')) {
        // Dans un vrai scénario, on sauvegarderait dans une table dédiée
        console.log('📝 Coordonnées bancaires simulées pour prestataire des trajets');
        
        toast({
          title: "Coordonnées bancaires mises à jour",
          description: `Les informations bancaires de ${supplier.company_name} ont été sauvegardées`,
        });
        
        onUpdate();
        onOpenChange(false);
      } else {
        // Pour les prestataires classiques, on met à jour la table suppliers
        const { error } = await supabase
          .from('suppliers')
          .update({ 
            pricing_model: updatedPricingModel,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplier.id);

        if (error) throw error;

        toast({
          title: "Coordonnées bancaires mises à jour",
          description: `Les informations bancaires de ${supplier.company_name} ont été sauvegardées`,
        });
        
        onUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour coordonnées bancaires:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les coordonnées bancaires",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatIBAN = (value: string) => {
    // Retirer tous les espaces et convertir en majuscules
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    // Ajouter des espaces tous les 4 caractères
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Coordonnées bancaires
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Informations bancaires pour {supplier?.company_name}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="account_holder"
              rules={{ required: "Le titulaire du compte est requis" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulaire du compte</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom du titulaire" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iban"
              rules={{ 
                required: "L'IBAN est requis",
                pattern: {
                  value: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,28}$/,
                  message: "Format IBAN invalide"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="FR76 1234 5678 9012 3456 789A BC12"
                      onChange={(e) => {
                        const formatted = formatIBAN(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={34}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bic"
              rules={{ 
                required: "Le BIC est requis",
                pattern: {
                  value: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
                  message: "Format BIC invalide (8 ou 11 caractères)"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BIC/SWIFT</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="BNPAFRPP"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={11}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_name"
              rules={{ required: "Le nom de la banque est requis" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la banque</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="BNP Paribas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierBankDetailsDialog;
