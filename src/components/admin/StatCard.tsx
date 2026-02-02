import { LucideIcon, TrendingUp, TrendingDown, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    trend: number;
    trendLabel?: string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
}

const StatCard = ({ title, value, trend, trendLabel, icon: Icon, iconColor, iconBgColor }: StatCardProps) => {
    const isPositive = trend >= 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={cn("p-4 rounded-2xl", iconBgColor)}>
                    <Icon className={cn("w-6 h-6", iconColor)} />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    isPositive ? "text-green-500" : "text-red-500"
                )}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(trend)}%
                </span>
                <span className="text-sm text-gray-400">
                    {trendLabel || "Up from yesterday"}
                </span>
            </div>
        </div>
    );
};

export default StatCard;
