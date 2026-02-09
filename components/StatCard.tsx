import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
}

const colorClasses = {
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
};

export function StatCard({ title, value, change, icon: Icon, color = 'purple' }: StatCardProps) {
  const hasChange = change !== undefined;
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          
          {hasChange && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-gray-500 font-normal">vs período anterior</span>
            </div>
          )}
        </div>

        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
