
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, List, Grid } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ListViewProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  renderCard: (item: T) => React.ReactNode;
  renderListItem: (item: T) => React.ReactNode;
  itemsPerPage?: number;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
}

export function ListView<T extends Record<string, any>>({
  items,
  searchFields,
  renderCard,
  renderListItem,
  itemsPerPage = 10,
  searchPlaceholder = "Rechercher...",
  emptyStateMessage = "Aucun élément trouvé",
  emptyStateIcon
}: ListViewProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  useState(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-8">
          {emptyStateIcon && <div className="mb-4">{emptyStateIcon}</div>}
          <p className="text-gray-500">{emptyStateMessage}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4' : 'space-y-2'}>
          {currentItems.map((item, index) => (
            <div key={index}>
              {viewMode === 'grid' ? renderCard(item) : renderListItem(item)}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 text-center">
        {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} 
        {searchTerm && ` pour "${searchTerm}"`}
      </div>
    </div>
  );
}
