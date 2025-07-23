import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Users, Building, Sofa } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DataManagement = () => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const { toast } = useToast();

  // Export functions
  const exportClients = async () => {
    try {
      setIsExporting('clients');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csvContent = convertToCSV(data, [
        'id', 'name', 'email', 'phone', 'client_reference', 'departure_city', 
        'departure_postal_code', 'arrival_city', 'arrival_postal_code', 
        'desired_date', 'estimated_volume', 'budget_min', 'budget_max', 'status'
      ]);

      downloadCSV(csvContent, 'clients.csv');
      toast({ title: "Export réussi", description: "Liste des clients exportée" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const exportServiceProviders = async () => {
    try {
      setIsExporting('providers');
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csvContent = convertToCSV(data, [
        'id', 'name', 'company_name', 'email', 'phone', 'address', 
        'city', 'postal_code', 'coordinates'
      ]);

      downloadCSV(csvContent, 'prestataires.csv');
      toast({ title: "Export réussi", description: "Liste des prestataires exportée" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const exportFurniture = async () => {
    try {
      setIsExporting('furniture');
      
      // Export furniture volumes and custom furniture
      const [volumesResponse, customResponse] = await Promise.all([
        supabase.from('furniture_volumes').select('*'),
        supabase.from('custom_furniture').select('*')
      ]);

      if (volumesResponse.error) throw volumesResponse.error;
      if (customResponse.error) throw customResponse.error;

      // Combine and format data
      const combinedData = [
        ...(volumesResponse.data || []).map(item => ({
          furniture_id: item.furniture_id,
          furniture_name: item.furniture_name,
          category: item.category,
          volume: item.custom_volume || item.default_volume,
          type: 'standard',
          length_cm: null,
          width_cm: null,
          height_cm: null,
          description: null
        })),
        ...(customResponse.data || []).map(item => ({
          furniture_id: item.id,
          furniture_name: item.name,
          category: item.category,
          volume: item.volume,
          type: 'custom',
          length_cm: item.length_cm,
          width_cm: item.width_cm,
          height_cm: item.height_cm,
          description: item.description
        }))
      ];

      const csvContent = convertToCSV(combinedData, [
        'furniture_id', 'furniture_name', 'category', 'volume', 'type', 
        'length_cm', 'width_cm', 'height_cm', 'description'
      ]);

      downloadCSV(csvContent, 'meubles.csv');
      toast({ title: "Export réussi", description: "Liste des meubles exportée" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  // Import functions
  const importClients = async (file: File) => {
    try {
      setIsImporting('clients');
      const csvData = await parseCSV(file);
      let imported = 0;
      let duplicates = 0;

      for (const row of csvData) {
        try {
          // Check for duplicates by email
          const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('email', row.email)
            .single();

          if (existing) {
            duplicates++;
            continue;
          }

          // Insert new client
          const { error } = await supabase
            .from('clients')
            .insert({
              name: row.name,
              email: row.email,
              phone: row.phone,
              client_reference: row.client_reference,
              departure_city: row.departure_city,
              departure_postal_code: row.departure_postal_code,
              arrival_city: row.arrival_city,
              arrival_postal_code: row.arrival_postal_code,
              desired_date: row.desired_date || null,
              estimated_volume: row.estimated_volume ? parseFloat(row.estimated_volume) : null,
              budget_min: row.budget_min ? parseFloat(row.budget_min) : null,
              budget_max: row.budget_max ? parseFloat(row.budget_max) : null,
              status: row.status || 'pending',
              created_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (!error) imported++;
        } catch (rowError) {
          console.error('Erreur ligne:', rowError);
        }
      }

      toast({
        title: "Import terminé",
        description: `${imported} clients importés, ${duplicates} doublons ignorés`
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(null);
    }
  };

  const importServiceProviders = async (file: File) => {
    try {
      setIsImporting('providers');
      const csvData = await parseCSV(file);
      let imported = 0;
      let duplicates = 0;

      for (const row of csvData) {
        try {
          // Check for duplicates by email
          const { data: existing } = await supabase
            .from('service_providers')
            .select('id')
            .eq('email', row.email)
            .single();

          if (existing) {
            duplicates++;
            continue;
          }

          // Insert new service provider
          const { error } = await supabase
            .from('service_providers')
            .insert({
              name: row.name,
              company_name: row.company_name,
              email: row.email,
              phone: row.phone,
              address: row.address,
              city: row.city,
              postal_code: row.postal_code,
              coordinates: row.coordinates,
              created_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (!error) imported++;
        } catch (rowError) {
          console.error('Erreur ligne:', rowError);
        }
      }

      toast({
        title: "Import terminé",
        description: `${imported} prestataires importés, ${duplicates} doublons ignorés`
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(null);
    }
  };

  const importFurniture = async (file: File) => {
    try {
      setIsImporting('furniture');
      const csvData = await parseCSV(file);
      let imported = 0;
      let duplicates = 0;

      for (const row of csvData) {
        try {
          if (row.type === 'custom') {
            // Check for duplicates in custom furniture
            const { data: existing } = await supabase
              .from('custom_furniture')
              .select('id')
              .eq('name', row.furniture_name)
              .single();

            if (existing) {
              duplicates++;
              continue;
            }

            // Insert custom furniture
            const { error } = await supabase
              .from('custom_furniture')
              .insert({
                name: row.furniture_name,
                category: row.category,
                volume: parseFloat(row.volume),
                length_cm: row.length_cm ? parseInt(row.length_cm) : null,
                width_cm: row.width_cm ? parseInt(row.width_cm) : null,
                height_cm: row.height_cm ? parseInt(row.height_cm) : null,
                description: row.description,
                created_by: (await supabase.auth.getUser()).data.user?.id
              });

            if (!error) imported++;
          } else {
            // Check for duplicates in furniture volumes
            const { data: existing } = await supabase
              .from('furniture_volumes')
              .select('id')
              .eq('furniture_id', row.furniture_id)
              .single();

            if (existing) {
              duplicates++;
              continue;
            }

            // Insert furniture volume
            const { error } = await supabase
              .from('furniture_volumes')
              .insert({
                furniture_id: row.furniture_id,
                furniture_name: row.furniture_name,
                category: row.category,
                custom_volume: parseFloat(row.volume),
                default_volume: parseFloat(row.volume),
                modified_by: (await supabase.auth.getUser()).data.user?.id
              });

            if (!error) imported++;
          }
        } catch (rowError) {
          console.error('Erreur ligne:', rowError);
        }
      }

      toast({
        title: "Import terminé",
        description: `${imported} meubles importés, ${duplicates} doublons ignorés`
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(null);
    }
  };

  // Utility functions
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    // Add UTF-8 BOM for proper encoding
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + content;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.replace(/"/g, '').trim());
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] || '';
              });
              return obj;
            });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const downloadTemplate = (type: string) => {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'clients':
        csvContent = convertToCSV([
          {
            name: 'Jean Dupont',
            email: 'jean.dupont@email.com',
            phone: '0123456789',
            client_reference: 'CLI001',
            departure_city: 'Paris',
            departure_postal_code: '75001',
            arrival_city: 'Lyon',
            arrival_postal_code: '69001',
            desired_date: '2024-12-01',
            estimated_volume: '25.5',
            budget_min: '1000',
            budget_max: '1500',
            status: 'pending'
          }
        ], [
          'name', 'email', 'phone', 'client_reference', 'departure_city', 
          'departure_postal_code', 'arrival_city', 'arrival_postal_code', 
          'desired_date', 'estimated_volume', 'budget_min', 'budget_max', 'status'
        ]);
        filename = 'modele_clients.csv';
        break;
      
      case 'providers':
        csvContent = convertToCSV([
          {
            name: 'Pierre Martin',
            company_name: 'Transport Martin',
            email: 'contact@transport-martin.fr',
            phone: '0123456789',
            address: '123 Rue de la République',
            city: 'Paris',
            postal_code: '75001',
            coordinates: '48.8566,2.3522'
          }
        ], [
          'name', 'company_name', 'email', 'phone', 'address', 
          'city', 'postal_code', 'coordinates'
        ]);
        filename = 'modele_prestataires.csv';
        break;
      
      case 'furniture':
        csvContent = convertToCSV([
          {
            furniture_id: 'FUR001',
            furniture_name: 'Canapé 3 places',
            category: 'Salon',
            volume: '2.5',
            type: 'standard',
            length_cm: '',
            width_cm: '',
            height_cm: '',
            description: ''
          },
          {
            furniture_id: '',
            furniture_name: 'Meuble personnalisé',
            category: 'Cuisine',
            volume: '3.2',
            type: 'custom',
            length_cm: '120',
            width_cm: '60',
            height_cm: '180',
            description: 'Meuble sur mesure'
          }
        ], [
          'furniture_id', 'furniture_name', 'category', 'volume', 'type', 
          'length_cm', 'width_cm', 'height_cm', 'description'
        ]);
        filename = 'modele_meubles.csv';
        break;
    }

    downloadCSV(csvContent, filename);
    toast({ title: "Modèle téléchargé", description: `Modèle ${type} téléchargé avec succès` });
  };

  const handleFileUpload = (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier CSV",
        variant: "destructive"
      });
      return;
    }

    switch (type) {
      case 'clients':
        importClients(file);
        break;
      case 'providers':
        importServiceProviders(file);
        break;
      case 'furniture':
        importFurniture(file);
        break;
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exporter les données</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={exportClients}
              disabled={isExporting === 'clients'}
              className="h-20 flex flex-col space-y-2"
            >
              <Users className="h-6 w-6" />
              <span>{isExporting === 'clients' ? 'Export...' : 'Clients'}</span>
            </Button>
            
            <Button
              onClick={exportServiceProviders}
              disabled={isExporting === 'providers'}
              className="h-20 flex flex-col space-y-2"
            >
              <Building className="h-6 w-6" />
              <span>{isExporting === 'providers' ? 'Export...' : 'Prestataires'}</span>
            </Button>
            
            <Button
              onClick={exportFurniture}
              disabled={isExporting === 'furniture'}
              className="h-20 flex flex-col space-y-2"
            >
              <Sofa className="h-6 w-6" />
              <span>{isExporting === 'furniture' ? 'Export...' : 'Meubles'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

          {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Importer les données</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Templates Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-3">Télécharger les modèles CSV</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('clients')}
                className="h-10"
              >
                Modèle Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('providers')}
                className="h-10"
              >
                Modèle Prestataires
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('furniture')}
                className="h-10"
              >
                Modèle Meubles
              </Button>
            </div>
          </div>
          {/* Clients Import */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5" />
              <h4 className="font-medium">Importer clients</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Format CSV requis: name, email, phone, client_reference, departure_city, departure_postal_code, arrival_city, arrival_postal_code, desired_date, estimated_volume, budget_min, budget_max, status
            </p>
            <div className="flex items-center space-x-2">
              <Label htmlFor="clients-file" className="cursor-pointer">
                <Input
                  id="clients-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload('clients', e)}
                  disabled={isImporting === 'clients'}
                  className="hidden"
                />
                <Button variant="outline" disabled={isImporting === 'clients'}>
                  {isImporting === 'clients' ? 'Import...' : 'Choisir fichier CSV'}
                </Button>
              </Label>
            </div>
          </div>

          {/* Service Providers Import */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="h-5 w-5" />
              <h4 className="font-medium">Importer prestataires</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Format CSV requis: name, company_name, email, phone, address, city, postal_code, coordinates
            </p>
            <div className="flex items-center space-x-2">
              <Label htmlFor="providers-file" className="cursor-pointer">
                <Input
                  id="providers-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload('providers', e)}
                  disabled={isImporting === 'providers'}
                  className="hidden"
                />
                <Button variant="outline" disabled={isImporting === 'providers'}>
                  {isImporting === 'providers' ? 'Import...' : 'Choisir fichier CSV'}
                </Button>
              </Label>
            </div>
          </div>

          {/* Furniture Import */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sofa className="h-5 w-5" />
              <h4 className="font-medium">Importer meubles</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Format CSV requis: furniture_id, furniture_name, category, volume, type (standard/custom), length_cm, width_cm, height_cm, description
            </p>
            <div className="flex items-center space-x-2">
              <Label htmlFor="furniture-file" className="cursor-pointer">
                <Input
                  id="furniture-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload('furniture', e)}
                  disabled={isImporting === 'furniture'}
                  className="hidden"
                />
                <Button variant="outline" disabled={isImporting === 'furniture'}>
                  {isImporting === 'furniture' ? 'Import...' : 'Choisir fichier CSV'}
                </Button>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;