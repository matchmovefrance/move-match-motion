
-- Create pricing_opportunities table (extends client_requests for pricing workflow)
CREATE TABLE public.pricing_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_request_id INTEGER REFERENCES public.client_requests(id),
  title TEXT NOT NULL,
  description TEXT,
  estimated_volume NUMERIC NOT NULL,
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  departure_address TEXT NOT NULL,
  departure_city TEXT NOT NULL,
  departure_postal_code TEXT NOT NULL,
  departure_country TEXT DEFAULT 'France',
  arrival_address TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  arrival_postal_code TEXT NOT NULL,
  arrival_country TEXT DEFAULT 'France',
  desired_date DATE NOT NULL,
  flexible_dates BOOLEAN DEFAULT false,
  date_range_start DATE,
  date_range_end DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'pending', 'closed')),
  priority INTEGER DEFAULT 1,
  ai_price_suggestion JSONB,
  special_requirements TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create suppliers table (extends service_providers for pricing)
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_provider_id INTEGER REFERENCES public.service_providers(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'France',
  pricing_model JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{"avg_response_time": 0, "acceptance_rate": 0, "total_bids": 0}',
  is_active BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES public.pricing_opportunities(id) NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  bid_amount NUMERIC NOT NULL,
  cost_breakdown JSONB DEFAULT '{}',
  response_time_hours INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  notes TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pricing_rules table for dynamic pricing configuration
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  rule_name TEXT NOT NULL,
  rule_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create supplier_links table for secure public access
CREATE TABLE public.supplier_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  link_token TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit_logs table for tracking quote changes
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pricing_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Pricing opportunities policies
CREATE POLICY "Authenticated users can view opportunities" ON public.pricing_opportunities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create opportunities" ON public.pricing_opportunities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own opportunities or admins can update all" ON public.pricing_opportunities
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Suppliers policies  
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create suppliers" ON public.suppliers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own suppliers or admins can update all" ON public.suppliers
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by OR 
    public.get_current_user_role() = 'admin'
  );

-- Quotes policies
CREATE POLICY "Authenticated users can view quotes" ON public.quotes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create quotes" ON public.quotes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotes" ON public.quotes
  FOR UPDATE TO authenticated USING (true);

-- Pricing rules policies
CREATE POLICY "Authenticated users can view pricing rules" ON public.pricing_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage pricing rules" ON public.pricing_rules
  FOR ALL TO authenticated USING (true);

-- Supplier links policies
CREATE POLICY "Authenticated users can manage supplier links" ON public.supplier_links
  FOR ALL TO authenticated USING (true);

-- Audit logs policies (read-only for non-admins)
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_pricing_opportunities_status ON public.pricing_opportunities(status);
CREATE INDEX idx_pricing_opportunities_created_by ON public.pricing_opportunities(created_by);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX idx_quotes_opportunity_id ON public.quotes(opportunity_id);
CREATE INDEX idx_quotes_supplier_id ON public.quotes(supplier_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);

-- Create functions for automatic timestamping
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pricing_opportunities_updated_at BEFORE UPDATE ON public.pricing_opportunities 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.suppliers (company_name, contact_name, email, phone, address, city, postal_code, pricing_model, created_by)
SELECT 
  'Déménagements Express SARL',
  'Jean Dupont', 
  'jean@demenagements-express.fr',
  '+33 1 23 45 67 89',
  '123 Rue de la Paix',
  'Paris',
  '75001',
  '{"basePrice": 150, "distanceCost": {"formula": "distance * (volume > 20 ? 2.1 : 1)", "conditions": ["volume", "distance"]}}',
  u.id
FROM auth.users u 
WHERE u.email = 'pierre@matchmove.fr'
LIMIT 1;

INSERT INTO public.pricing_opportunities (title, description, estimated_volume, budget_range_min, budget_range_max, departure_address, departure_city, departure_postal_code, arrival_address, arrival_city, arrival_postal_code, desired_date, status, created_by)
SELECT 
  'Déménagement 3 pièces Paris → Lyon',
  'Déménagement standard d''un appartement 3 pièces, environ 25m³',
  25,
  800,
  1200,
  '15 Avenue des Champs-Élysées',
  'Paris',
  '75008',
  '45 Rue de la République',
  'Lyon',
  '69002',
  CURRENT_DATE + INTERVAL '15 days',
  'active',
  u.id
FROM auth.users u 
WHERE u.email = 'pierre@matchmove.fr'
LIMIT 1;
