import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from './Dashboard/components/Overview';
import { DashboardAnalytics } from './Dashboard/components/Analytics';
import { DashboardReports } from './Dashboard/components/Reports';
import { DashboardAlerts } from './Dashboard/components/Alerts';
import { DashboardFilters } from './Dashboard/components/GlobalFilters';
import { useDashboardData } from './Dashboard/hooks/useDashboardData';
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, LayoutDashboard, BarChart3, FileText, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { stats, salesAnalytics, trends, expenseAnalytics, activeAlerts, isLoading, refetch } = useDashboardData(period, dateRange);

  const dashboardData = {
    stats,
    salesAnalytics,
    trends,
    expenseAnalytics,
    activeAlerts
  };

  return (
    <div className="min-h-screen space-y-8 p-1 md:p-2 animate-fade-in custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border border-primary/10 shadow-soft">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            Comprehensive business overview and real-time analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-xl border-primary/20 hover:bg-primary/5 transition-bounce"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-xl gradient-primary shadow-glow hover:shadow-strong transition-bounce border-none"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <DashboardFilters 
        period={period} 
        setPeriod={setPeriod} 
        dateRange={dateRange} 
        setDateRange={setDateRange} 
      />

      {/* Main Tabs Container */}
      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur-lg py-2 rounded-xl px-2">
          <TabsList className="bg-muted/50 p-1 h-auto rounded-2xl border border-border/50">
            <TabsTrigger 
              value="overview" 
              className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-300"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-300 relative"
            >
              <Bell className="h-4 w-4 mr-2" />
              Alerts
              {activeAlerts?.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] notification-pulse bg-destructive border-2 border-background">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live System Pulse
          </div>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <TabsContent value="overview">
              <DashboardOverview data={dashboardData} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="analytics">
              <DashboardAnalytics data={dashboardData} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="reports">
              <DashboardReports />
            </TabsContent>
            <TabsContent value="alerts">
              <DashboardAlerts data={dashboardData} isLoading={isLoading} />
            </TabsContent>
          </AnimatePresence>
        </div>
      </Tabs>
      
      {/* Visual Footer/Guide */}
      <div className="mt-12 p-8 glass-card border-primary/5 bg-gradient-to-tr from-primary/5 to-transparent text-center">
        <h3 className="text-xl font-bold text-primary italic font-serif">"Empowering Luxury with Intelligence"</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
          This dashboard provides high-fidelity insights into your store's operations. Use the period filters to analyze trends and the individual tabs to deep dive into specific business segments.
        </p>
      </div>
    </div>
  );
}