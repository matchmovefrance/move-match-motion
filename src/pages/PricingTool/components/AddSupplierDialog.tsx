
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { Users2 } from 'lucide-react';

type Supplier = Tables<'suppliers'>;

const supplierFormSchema = z.object({
  company_name: z.string().min(2, { message: "Le nom de l'entreprise est requis" }),
  contact_name: z.string().min(2, { message: "Le nom du contact est requis" }),
  email: z.string().email({ message: "Format d'email invalide" }),
  phone: z.string().min(5, { message: "Le numéro de téléphone est requis" }),
  address: z.string().optional(),
  city: z.string().min(2, { message: "La ville est requise" }),
  postal_code: z.string().min(2, { message: "Le code postal est requis" }),
  is_active: z.boolean().default(true),
  priority_level: z.number().min(1).max(10).optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
}

const AddSupplierDialog = ({ open, onOpenChange, supplier, onSuccess }: AddSupplierDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      is_active: true,
      priority_level: 5,
    },
  });

  // Remplir le formulaire si un fournisseur est passé en prop (mode édition)
  useEffect(() => {
    if (supplier) {
      form.reset({
        company_name: supplier.company_name || '',
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        postal_code: supplier.postal_code || '',
        is_active: supplier.is_active || true,
        priority_level: supplier.priority_level || 5,
      });
    } else {
      form.reset({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        is_active: true,
        priority_level: 5,
      });
    }
  }, [supplier, open]);

  const onSubmit = async (data: SupplierFormValues) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Vérifier s'il s'agit d'une création ou d'une mise à jour
      if (supplier) {
        // Mise à jour
        const { error } = await supabase
          .from('suppliers')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supplier.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le fournisseur a été mis à jour avec succès",
        });
      } else {
        // Création
        const { error } = await supabase
          .from('suppliers')
          .insert({
            ...data,
            created_by: user.id,
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le fournisseur a été ajouté avec succès",
        });

        // Ajouter aussi à la table service_providers pour la synchronisation
        await supabase.from('service_providers').insert({
          name: data.contact_name,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          address: data.address || '',
          city: data.city,
          postal_code: data.postal_code,
          created_by: user.id,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            {supplier ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
          </DialogTitle>
          <DialogDescription>
            {supplier 
              ? "Modifiez les informations du fournisseur ci-dessous"
              : "Ajoutez un nouveau fournisseur en remplissant le formulaire"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'entreprise" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom complet du contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="0123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Rue de la Paix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input placeholder="75000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau de priorité (1-10)</FormLabel>
                    <Select 
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un niveau de priorité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i === 9 ? '(Priorité maximale)' : i === 0 ? '(Priorité minimale)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 mt-6">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Fournisseur actif</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : (supplier ? 'Mettre à jour' : 'Ajouter le fournisseur')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierDialog;
