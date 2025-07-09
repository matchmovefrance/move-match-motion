
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CompanySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: '',
    siret: '',
    pricing_margin: 15
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, address, phone, email, siret, pricing_margin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          company_name: data.company_name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          siret: data.siret || '',
          pricing_margin: data.pricing_margin || 15
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          company_name: settings.company_name,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          siret: settings.siret,
          pricing_margin: settings.pricing_margin,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de l'entreprise ont été mis à jour",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Paramètres de l'entreprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Nom de l'entreprise</Label>
            <Input
              id="company_name"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              placeholder="MatchMove"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="contact@matchmove.fr"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="01 23 45 67 89"
            />
          </div>
          
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              value={settings.siret}
              onChange={(e) => setSettings({ ...settings, siret: e.target.value })}
              placeholder="12345678901234"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            placeholder="123 Rue de la Paix, 75001 Paris"
          />
        </div>
        
        
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
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
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
