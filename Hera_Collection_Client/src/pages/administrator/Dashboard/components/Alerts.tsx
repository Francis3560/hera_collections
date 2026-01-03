import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface AlertsProps {
  data: any;
  isLoading: boolean;
}

export const DashboardAlerts: React.FC<AlertsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
    </div>;
  }

  const alerts = data?.activeAlerts || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-medium border-none bg-card/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Critical issues requiring immediate action</CardDescription>
          </div>
          <Badge variant={alerts.length > 0 ? "destructive" : "secondary"}>
            {alerts.length} Active
          </Badge>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-medium">All systems normal</h3>
              <p className="text-sm text-muted-foreground mt-1">No active alerts at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div 
                  key={alert.id} 
                  className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-smooth"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{alert.type || 'Low Stock Alert'}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.message || `Product ${alert.productName || 'Unknown'} is below threshold.`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Detected {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                      <Link to={`/admin/inventory/alerts`}>
                        View Details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">In Stock</span>
                <span className="text-xs font-medium text-success">92%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success w-[92%]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Low Stock Risk</span>
                <span className="text-xs font-medium text-warning">5%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning w-[5%]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Out of Stock</span>
                <span className="text-xs font-medium text-destructive">3%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive w-[3%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Security & Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Failed Login Attempts', value: '0', status: 'normal' },
                { label: 'New User Registrations', value: '12', status: 'normal' },
                { label: 'Role Changes', value: '2', status: 'warning' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <Badge variant={item.status === 'warning' ? 'outline' : 'secondary'} className="text-[10px]">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
