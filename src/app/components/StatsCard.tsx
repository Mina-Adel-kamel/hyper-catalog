import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div 
      className="rounded-lg p-4 shadow-md print:hidden"
      dir="rtl"
      style={{
        backgroundColor: '#ffffff',
        border: `2px solid ${color}`,
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: '#6b7280' }}
          >
            {title}
          </p>
          <p 
            className="text-3xl font-bold mt-1"
            style={{ color }}
          >
            {value}
          </p>
        </div>
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="size-8" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
