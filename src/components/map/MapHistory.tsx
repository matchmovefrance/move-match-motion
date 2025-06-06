
import React from 'react';
import { Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusToggle from '../StatusToggle';

interface Move {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  status: string;
  company_name?: string;
  match_status?: string;
  total_price?: number;
  real_distance_km?: number;
}

interface MapHistoryProps {
  moves: Move[];
  getStatusBadge: (status: string) => React.ReactNode;
  getMatchStatusBadge: (status: string | undefined) => React.ReactNode;
  handleStatusChange: (moveId: number, newStatus: 'en_cours' | 'termine') => void;
}

export const MapHistory: React.FC<MapHistoryProps> = ({
  moves,
  getStatusBadge,
  getMatchStatusBadge,
  handleStatusChange
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Historique des trajets
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Compagnie</TableHead>
              <TableHead>Départ</TableHead>
              <TableHead>Arrivée</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moves.map((move) => (
              <TableRow key={move.id}>
                <TableCell className="font-medium">#{move.id}</TableCell>
                <TableCell>{move.company_name || 'N/A'}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{move.departure_city}</div>
                    <div className="text-sm text-gray-500">{move.departure_postal_code}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{move.arrival_city}</div>
                    <div className="text-sm text-gray-500">{move.arrival_postal_code}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(move.departure_date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>{getStatusBadge(move.status)}</TableCell>
                <TableCell>{getMatchStatusBadge(move.match_status)}</TableCell>
                <TableCell>
                  {move.total_price ? `${move.total_price.toLocaleString()}€` : 'N/A'}
                </TableCell>
                <TableCell>
                  {move.real_distance_km ? `${move.real_distance_km}km` : 'N/A'}
                </TableCell>
                <TableCell>
                  <StatusToggle
                    status={move.status}
                    onStatusChange={(newStatus) => handleStatusChange(move.id, newStatus)}
                    disabled={move.status === 'termine'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
