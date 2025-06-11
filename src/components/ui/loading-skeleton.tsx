
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type: 'card' | 'list' | 'table' | 'stats';
  count?: number;
}

export function LoadingSkeleton({ type, count = 3 }: LoadingSkeletonProps) {
  const renderCardSkeleton = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  );

  const renderStatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <div>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 bg-white rounded border">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );

  switch (type) {
    case 'card':
      return (
        <div className="space-y-4">
          {[...Array(count)].map((_, i) => (
            <div key={i}>{renderCardSkeleton()}</div>
          ))}
        </div>
      );
    case 'list':
      return (
        <div className="space-y-2">
          {[...Array(count)].map((_, i) => (
            <div key={i}>{renderListSkeleton()}</div>
          ))}
        </div>
      );
    case 'stats':
      return renderStatsSkeleton();
    case 'table':
      return renderTableSkeleton();
    default:
      return null;
  }
}
