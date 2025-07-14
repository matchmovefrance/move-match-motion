import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export const ChartContainer = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className = "",
  gradient = "from-blue-500 to-purple-600"
}: ChartContainerProps) => {
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-sm`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative">
          {/* Arrière-plan gradient subtil */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.02] rounded-lg`} />
          
          {/* Contenu du graphique */}
          <div className="relative">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};