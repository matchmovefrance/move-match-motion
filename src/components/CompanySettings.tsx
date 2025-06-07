
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Mail, Phone, MapPin, Settings, Server, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompanySettings {
  id?: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure: boolean;
  smtp_auth_method: string;
  smtp_timeout: number;
  smtp_from_name: string;
  smtp_reply_to: string;
}

const CompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'MatchMove',
    company_email: 'contact@matchmove.fr',
    company_phone: '+33 1 23 45 67 89',
    company_address: 'France',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_secure: true,
    smtp_auth_method: 'LOGIN',
    smtp_timeout: 30000,
    smtp_from_name: 'MatchMove',
    smtp_reply_to: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
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
        .limit(1)
        .single();

      if (error) {
        console.log('Erreur lors du chargement des paramètres:', error);
        if (error.code !== 'PGRST116') {
          throw error;
        }
      } else if (data) {
        setSettings({
          id: data.id,
          company_name: data.company_name,
          company_email: data.company_email,
          company_phone: data.company_phone,
          company_address: data.company_address,
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_username: data.smtp_username || '',
          smtp_password: data.smtp_password || '',
          smtp_secure: data.smtp_secure !== undefined ? data.smtp_secure : true,
          smtp_auth_method: data.smtp_auth_method || 'LOGIN',
          smtp_timeout: data.smtp_timeout || 30000,
          smtp_from_name: data.smtp_from_name || 'MatchMove',
          smtp_reply_to: data.smtp_reply_to || ''
        });
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

  const handleTestSMTP = async () => {
    try {
      setTesting(true);
      
      // Validation des champs SMTP requis
      if (!settings.smtp_username || !settings.smtp_password || !settings.smtp_host) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs SMTP obligatoires avant de tester",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('test-smtp', {
        body: {
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_username: settings.smtp_username,
          smtp_password: settings.smtp_password,
          smtp_secure: settings.smtp_secure,
          smtp_auth_method: settings.smtp_auth_method
        }
      });

      if (error) throw error;

      setTestResult({
        success: data.success,
        message: data.success ? 'Connexion SMTP réussie !' : data.error
      });
      setShowTestDialog(true);

    } catch (error: any) {
      console.error('Erreur lors du test SMTP:', error);
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du test de connexion SMTP'
      });
      setShowTestDialog(true);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!settings.smtp_username || !settings.smtp_password) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs SMTP obligatoires",
          variant: "destructive",
        });
        return;
      }
      
      const settingsToSave = {
        ...settings,
        smtp_enabled: true
      };
      
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(settingsToSave, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          company_name: data.company_name,
          company_email: data.company_email,
          company_phone: data.company_phone,
          company_address: data.company_address,
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_username: data.smtp_username || '',
          smtp_password: data.smtp_password || '',
          smtp_secure: data.smtp_secure !== undefined ? data.smtp_secure : true,
          smtp_auth_method: data.smtp_auth_method || 'LOGIN',
          smtp_timeout: data.smtp_timeout || 30000,
          smtp_from_name: data.smtp_from_name || 'MatchMove',
          smtp_reply_to: data.smtp_reply_to || ''
        });
      }
      
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
            Configuration SMTP (obligatoire)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Information :</strong> Configuration universelle SMTP compatible avec tous les fournisseurs 
              (Gmail, Outlook, OVH, Ionos, etc.). Veuillez configurer vos paramètres ci-dessous.
            </p>
          </div>

          {/* Paramètres SMTP de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp_host">Serveur SMTP *</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com, smtp.office365.com, ssl0.ovh.net..."
                required
              />
            </div>
            <div>
              <Label htmlFor="smtp_port">Port SMTP *</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                placeholder="587 (TLS), 465 (SSL), 25"
                required
              />
            </div>
            <div>
              <Label htmlFor="smtp_username">Nom d'utilisateur SMTP *</Label>
              <Input
                id="smtp_username"
                value={settings.smtp_username}
                onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                placeholder="votre-email@domaine.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="smtp_password">Mot de passe SMTP *</Label>
              <Input
                id="smtp_password"
                type="password"
                value={settings.smtp_password}
                onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                placeholder="Mot de passe ou mot de passe d'application"
                required
              />
            </div>
          </div>

          {/* Paramètres SMTP avancés */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Paramètres avancés</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp_from_name">Nom d'expéditeur</Label>
                <Input
                  id="smtp_from_name"
                  value={settings.smtp_from_name}
                  onChange={(e) => handleInputChange('smtp_from_name', e.target.value)}
                  placeholder="Nom affiché dans les emails"
                />
              </div>
              <div>
                <Label htmlFor="smtp_reply_to">Email de réponse</Label>
                <Input
                  id="smtp_reply_to"
                  type="email"
                  value={settings.smtp_reply_to}
                  onChange={(e) => handleInputChange('smtp_reply_to', e.target.value)}
                  placeholder="Email pour les réponses (optionnel)"
                />
              </div>
              <div>
                <Label htmlFor="smtp_auth_method">Méthode d'authentification</Label>
                <select
                  id="smtp_auth_method"
                  value={settings.smtp_auth_method}
                  onChange={(e) => handleInputChange('smtp_auth_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="LOGIN">LOGIN (recommandé)</option>
                  <option value="PLAIN">PLAIN</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smtp_secure"
                  checked={settings.smtp_secure}
                  onChange={(e) => handleInputChange('smtp_secure', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="smtp_secure">Connexion sécurisée (TLS/SSL)</Label>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Conseils de configuration :</strong><br/>
              • <strong>Gmail :</strong> smtp.gmail.com:587, activez l'authentification 2FA et utilisez un mot de passe d'application<br/>
              • <strong>Outlook/Hotmail :</strong> smtp.office365.com:587<br/>
              • <strong>OVH :</strong> ssl0.ovh.net:465 (SSL) ou ssl0.ovh.net:587 (TLS)<br/>
              • <strong>Ionos :</strong> smtp.ionos.fr:587
            </p>
          </div>

          {/* Bouton Test SMTP */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleTestSMTP}
              disabled={testing || !settings.smtp_username || !settings.smtp_password || !settings.smtp_host}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 border-blue-300"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Test en cours...' : 'Tester la connexion SMTP'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !settings.smtp_username || !settings.smtp_password}
          className="bg-green-600 hover:bg-green-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>

      {/* Dialog de résultat du test SMTP */}
      <AlertDialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {testResult?.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 text-red-600" />
              )}
              {testResult?.success ? 'Test SMTP Réussi' : 'Test SMTP Échoué'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {testResult?.message}
              {testResult?.success && (
                <div className="mt-2 text-green-700 bg-green-50 p-3 rounded-md">
                  ✅ Votre configuration SMTP fonctionne correctement. Vous pouvez maintenant sauvegarder vos paramètres.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTestDialog(false)}>
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanySettings;
