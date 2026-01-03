import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FilterX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  period,
  setPeriod,
  dateRange,
  setDateRange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-card/50 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Time Period:</span>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-background/50">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal bg-background/50",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setPeriod('month');
            setDateRange({ from: undefined, to: undefined });
          }}
          className="text-muted-foreground hover:text-primary"
        >
          <FilterX className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
};
