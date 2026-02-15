import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className={cn(
                "text-sm mt-1",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-gold" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
