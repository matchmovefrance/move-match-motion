
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ClipboardList, Users, Settings, CircleDollarSign, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PricingTool = () => {
  const { user, profile } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Check system preference for dark mode
  useState(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) setTheme('dark');
  });

  return (
    <div className={`min-h-screen bg-background ${theme === 'dark' ? 'dark' : ''}`}>
      <header className="border-b border-border bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold">Pricing Tool</h1>
              <p className="text-sm text-muted-foreground">MatchMove quotation system</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user?.email}</span>
            <button 
              onClick={() => window.close()} 
              className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Return to Main App
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome to the Pricing Dashboard</h2>
          <p className="text-muted-foreground">
            Generate competitive quotes, manage suppliers, and streamline your pricing workflow.
          </p>
        </div>

        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Opportunities</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Supplier Hub</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Quote Engine</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Client Opportunities</CardTitle>
                <CardDescription>
                  View and manage client requests for moving services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                  <p>This feature is currently under development.</p>
                  <p className="mt-2">You'll be able to manage client requests, import data from CSV/Excel, and get AI-powered suggestions.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Management</CardTitle>
                <CardDescription>
                  Manage suppliers and their pricing models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                  <p>This feature is currently under development.</p>
                  <p className="mt-2">You'll be able to create pricing rule templates, generate secure public links, and track supplier performance.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle>Quote Comparison Engine</CardTitle>
                <CardDescription>
                  Compare and manage quotes from different suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                  <p>This feature is currently under development.</p>
                  <p className="mt-2">You'll be able to visually compare quotes, perform batch actions, and attach client notes to decisions.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
          </div>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">AI-powered price suggestions</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Dynamic pricing formula editor</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Visual quote comparison tools</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Supplier portal with secure access</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">PDF exports and Excel reports</span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-green-500" />
              <span className="text-sm">Multi-language support (FR/EN/DE)</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default PricingTool;
