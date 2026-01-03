import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  description?: string;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  description,
  prefix = "",
  suffix = "",
  color = "primary"
}) => {
  const isPositive = change && change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-none shadow-medium bg-card/50 backdrop-blur-md group relative">
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full",
          isPositive ? "bg-success" : change ? "bg-destructive" : "bg-primary"
        )} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl transition-colors duration-300",
              `bg-${color}/10 text-${color}`,
              "group-hover:bg-primary group-hover:text-white"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full",
                isPositive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
              )}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(change)}%
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold tracking-tight">
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
              </span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {description}
              </p>
            )}
          </div>
        </CardContent>
        {/* Decorative glass highlight */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      </Card>
    </motion.div>
  );
};
