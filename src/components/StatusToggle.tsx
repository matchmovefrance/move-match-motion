
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Undo } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface StatusToggleProps {
  status: string;
  onStatusChange: (newStatus: 'en_cours' | 'termine') => void;
  disabled?: boolean;
  variant?: 'button' | 'inline';
}

const StatusToggle = ({ status, onStatusChange, disabled = false, variant = 'inline' }: StatusToggleProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const isCompleted = status === 'termine';

  const handleStatusChange = (newStatus: 'en_cours' | 'termine') => {
    if (newStatus === 'termine') {
      setShowConfirmDialog(true);
    } else {
      onStatusChange(newStatus);
    }
  };

  const handleConfirmComplete = () => {
    onStatusChange('termine');
    setShowConfirmDialog(false);
  };

  if (variant === 'button') {
    return (
      <>
        <Button
          variant={isCompleted ? "outline" : "default"}
          size="sm"
          onClick={() => handleStatusChange(isCompleted ? 'en_cours' : 'termine')}
          disabled={disabled}
          className={isCompleted 
            ? "text-orange-600 hover:text-orange-700 border-orange-200" 
            : "bg-green-600 hover:bg-green-700 text-white"
          }
        >
          {isCompleted ? (
            <>
              <Undo className="h-4 w-4 mr-1" />
              Remettre en cours
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Marquer terminé
            </>
          )}
        </Button>

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Confirmer la fin du déménagement"
          description="Êtes-vous sûr de vouloir marquer ce déménagement comme terminé ? Cette action est définitive et ne peut pas être annulée."
          confirmText="Marquer terminé"
          cancelText="Annuler"
          onConfirm={handleConfirmComplete}
          variant="default"
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        {isCompleted ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('en_cours')}
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
            onClick={() => handleStatusChange('termine')}
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

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirmer la fin du déménagement"
        description="Êtes-vous sûr de vouloir marquer ce déménagement comme terminé ? Cette action est définitive et ne peut pas être annulée."
        confirmText="Marquer terminé"
        cancelText="Annuler"
        onConfirm={handleConfirmComplete}
        variant="default"
      />
    </>
  );
};

export default StatusToggle;
