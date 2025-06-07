
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building, Mail, Phone, MapPin, Settings, Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanySettings {
  id?: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
}

const CompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'MatchMove',
    company_email: 'contact@matchmove.fr',
    company_phone: '+33 1 23 45 67 89',
    company_address: 'France',
    smtp_enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de l'entreprise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(settings)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de l'entreprise ont été mis à jour avec succès",
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des paramètres...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Informations de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Building className="h-5 w-5 mr-2" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <Label htmlFor="company_email">Email de l'entreprise</Label>
              <Input
                id="company_email"
                type="email"
                value={settings.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="contact@entreprise.com"
              />
            </div>
            <div>
              <Label htmlFor="company_phone">Téléphone</Label>
              <Input
                id="company_phone"
                value={settings.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div>
              <Label htmlFor="company_address">Adresse</Label>
              <Input
                id="company_address"
                value={settings.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Adresse de l'entreprise"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <Server className="h-5 w-5 mr-2" />
            Configuration SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="smtp_enabled"
              checked={settings.smtp_enabled}
              onCheckedChange={(checked) => handleInputChange('smtp_enabled', checked)}
            />
            <Label htmlFor="smtp_enabled">Activer l'envoi SMTP personnalisé</Label>
          </div>

          {settings.smtp_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="smtp_host">Serveur SMTP</Label>
                <Input
                  id="smtp_host"
                  value={settings.smtp_host}
                  onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp_port">Port SMTP</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                  placeholder="587"
                />
              </div>
              <div>
                <Label htmlFor="smtp_username">Nom d'utilisateur SMTP</Label>
                <Input
                  id="smtp_username"
                  value={settings.smtp_username}
                  onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                  placeholder="votre-email@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp_password">Mot de passe SMTP</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                  placeholder="Mot de passe ou mot de passe d'application"
                />
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Si le SMTP n'est pas activé, les emails seront envoyés via Resend. 
              Si le SMTP est activé, les emails utiliseront votre configuration SMTP personnalisée.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );
};

export default CompanySettings;
