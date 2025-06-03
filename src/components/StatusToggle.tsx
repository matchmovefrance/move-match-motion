
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Undo } from 'lucide-react';

interface StatusToggleProps {
  status: string;
  onStatusChange: (newStatus: 'en_cours' | 'termine') => void;
  disabled?: boolean;
}

const StatusToggle = ({ status, onStatusChange, disabled = false }: StatusToggleProps) => {
  const isCompleted = status === 'termine';

  return (
    <div className="flex items-center space-x-2">
      {isCompleted ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange('en_cours')}
          disabled={disabled}
          className="text-orange-600 hover:text-orange-700"
        >
          <Undo className="h-4 w-4 mr-1" />
          Remettre en cours
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange('termine')}
          disabled={disabled}
          className="text-green-600 hover:text-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Marquer terminé
        </Button>
      )}
      
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isCompleted 
          ? 'bg-green-100 text-green-800' 
          : 'bg-orange-100 text-orange-800'
      }`}>
        {isCompleted ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminé
          </>
        ) : (
          <>
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </>
        )}
      </span>
    </div>
  );
};

export default StatusToggle;
