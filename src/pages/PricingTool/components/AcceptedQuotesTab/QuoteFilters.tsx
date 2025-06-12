
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import { QuoteFilter } from './useAcceptedQuotes';

interface QuoteFiltersProps {
  filter: QuoteFilter;
  onFilterChange: (filter: QuoteFilter) => void;
  quoteCounts: {
    all: number;
    accepted: number;
    validated_by_client: number;
    rejected: number;
  };
}

export const QuoteFilters = ({ filter, onFilterChange, quoteCounts }: QuoteFiltersProps) => {
  const filterOptions = [
    {
      key: 'all' as QuoteFilter,
      label: 'Tous les devis',
      icon: Filter,
      count: quoteCounts.all,
      variant: 'outline' as const
    },
    {
      key: 'accepted' as QuoteFilter,
      label: 'En attente validation',
      icon: Clock,
      count: quoteCounts.accepted,
      variant: 'secondary' as const
    },
    {
      key: 'validated_by_client' as QuoteFilter,
      label: 'Validés par le client',
      icon: CheckCircle,
      count: quoteCounts.validated_by_client,
      variant: 'default' as const
    },
    {
      key: 'rejected' as QuoteFilter,
      label: 'Rejetés',
      icon: XCircle,
      count: quoteCounts.rejected,
      variant: 'destructive' as const
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filterOptions.map(({ key, label, icon: Icon, count, variant }) => (
        <Button
          key={key}
          variant={filter === key ? variant : 'outline'}
          size="sm"
          onClick={() => onFilterChange(key)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          {label}
          <Badge variant="secondary" className="ml-1">
            {count}
          </Badge>
        </Button>
      ))}
    </div>
  );
};
