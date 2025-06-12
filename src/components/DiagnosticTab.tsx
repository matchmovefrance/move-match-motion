
import { motion } from 'framer-motion';
import { AlertTriangle, Database } from 'lucide-react';
import DatabaseDiagnostic from './DatabaseDiagnostic';
import SimpleClientForm from './SimpleClientForm';
import NewMoveForm from './NewMoveForm';

const DiagnosticTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-800">Diagnostic & Nouveaux Formulaires</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Diagnostic Database */}
        <div>
          <DatabaseDiagnostic />
        </div>

        {/* Test des nouveaux formulaires */}
        <div className="space-y-6">
          <SimpleClientForm onSuccess={() => console.log('Client créé!')} />
          <NewMoveForm onSuccess={() => console.log('Trajet créé!')} />
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosticTab;
