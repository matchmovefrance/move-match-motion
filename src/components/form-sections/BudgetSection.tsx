
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Euro } from 'lucide-react';

interface BudgetSectionProps {
  formData: {
    budget_min: string;
    budget_max: string;
    quote_amount: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const BudgetSection = ({ formData, onInputChange }: BudgetSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Euro className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Budget et devis</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="budget_min">Budget minimum (€)</Label>
          <Input
            id="budget_min"
            type="number"
            value={formData.budget_min}
            onChange={(e) => onInputChange('budget_min', e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <Label htmlFor="budget_max">Budget maximum (€)</Label>
          <Input
            id="budget_max"
            type="number"
            value={formData.budget_max}
            onChange={(e) => onInputChange('budget_max', e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <Label htmlFor="quote_amount">Montant du devis (€)</Label>
          <Input
            id="quote_amount"
            type="number"
            value={formData.quote_amount}
            onChange={(e) => onInputChange('quote_amount', e.target.value)}
            placeholder=""
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;
