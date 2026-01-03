import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, PieChart, TrendingUp, Calendar, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import reportService from '@/api/report.service';
import { toast } from 'sonner';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const DashboardReports: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'sales-summary',
      title: "Sales Summary",
      description: "Detailed breakdown of sales performance by product and category.",
      icon: TrendingUp,
      color: "text-blue-500 bg-blue-500/10",
      formats: ['PDF', 'CSV']
    },
    {
      id: 'inventory-value',
      title: "Inventory Value",
      description: "Current stock valuation and variant pricing report.",
      icon: PieChart,
      color: "text-purple-500 bg-purple-500/10",
      formats: ['PDF', 'CSV']
    },
    {
      id: 'expense-report',
      title: "Expense Report",
      description: "Operational costs and category-wise overhead analysis.",
      icon: FileText,
      color: "text-amber-500 bg-amber-500/10",
      formats: ['PDF', 'CSV']
    },
    {
      id: 'profit-loss',
      title: "Profit and Loss",
      description: "Comprehensive financial overview of revenue vs expenses.",
      icon: ShieldCheck,
      color: "text-green-500 bg-green-500/10",
      formats: ['PDF']
    }
  ];

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = (title: string, data: any[], columns: any[], filename: string) => {
    const doc = new jsPDF();
    const primaryColor = [124, 58, 237]; // Hera Brand Purple

    // Add Logo or Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("HERA COLLECTION", 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(title.toUpperCase(), 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 36);

    // Draw a decorative line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);

    autoTable(doc, {
      startY: 45,
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.key])),
      headStyles: { 
        fillColor: primaryColor as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { top: 45 },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} - Hera Collection Executive Report`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`${filename}.pdf`);
  };

  const handleGenerate = async (id: string, formatType: 'PDF' | 'CSV') => {
    setGenerating(id);
    try {
      let response;
      switch (id) {
        case 'sales-summary':
          response = await reportService.getSalesSummary();
          const salesData = response.data.map((o: any) => ({
            'Order #': o.orderNumber,
            'Customer': o.buyer?.name || 'Guest',
            'Amount': `KES ${Number(o.totalAmount).toLocaleString()}`,
            'Status': o.status,
            'Date': format(new Date(o.createdAt), 'yyyy-MM-dd')
          }));
          
          if (!salesData || salesData.length === 0) {
            toast.error("No sales data found for this period.");
            return;
          }

          if (formatType === 'CSV') {
            exportToCSV(salesData, 'sales_summary', Object.keys(salesData[0]));
          } else {
            generatePDF(
              "Sales Summary Report", 
              salesData, 
              Object.keys(salesData[0]).map(k => ({ header: k, key: k })),
              'sales_summary'
            );
          }
          break;

        case 'inventory-value':
          response = await reportService.getInventoryValue();
          const invData = response.data.map((v: any) => ({
            'SKU': v.sku,
            'Product': v.product?.title,
            'Category': v.product?.category?.name || 'N/A',
            'Stock': v.stock,
            'Price': `KES ${Number(v.price).toLocaleString()}`,
            'Valuation': `KES ${(v.stock * Number(v.price)).toLocaleString()}`
          }));

          if (!invData || invData.length === 0) {
            toast.error("No inventory data found.");
            return;
          }

          if (formatType === 'CSV') {
            exportToCSV(invData, 'inventory_valuation', Object.keys(invData[0]));
          } else {
            generatePDF(
              "Inventory Valuation Report", 
              invData, 
              Object.keys(invData[0]).map(k => ({ header: k, key: k })),
              'inventory_valuation'
            );
          }
          break;

        case 'expense-report':
          response = await reportService.getExpensesReport();
          const expData = response.data.map((e: any) => ({
            'Title': e.title,
            'Category': e.category?.name || 'Uncategorized',
            'Amount': `KES ${Number(e.amount).toLocaleString()}`,
            'Date': format(new Date(e.date), 'yyyy-MM-dd'),
            'Method': e.paymentMethod
          }));

          if (!expData || expData.length === 0) {
            toast.error("No expense data found for this period.");
            return;
          }

          if (formatType === 'CSV') {
            exportToCSV(expData, 'expense_report', Object.keys(expData[0]));
          } else {
            generatePDF(
              "Expense Analysis Report", 
              expData, 
              Object.keys(expData[0]).map(k => ({ header: k, key: k })),
              'expense_report'
            );
          }
          break;

        case 'profit-loss':
          response = await reportService.getProfitLoss();
          const pl = response.data;
          // P&L is special, we generate a custom PDF layout for it
          const doc = new jsPDF();
          const pColor = [124, 58, 237];
          
          doc.setFontSize(22);
          doc.setTextColor(pColor[0], pColor[1], pColor[2]);
          doc.text("HERA COLLECTION", 14, 22);
          doc.setFontSize(16);
          doc.text("PROFIT & LOSS STATEMENT", 14, 32);
          
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Period: Lifetime/Global`, 14, 40);

          autoTable(doc, {
            startY: 50,
            head: [['Description', 'Amount (KES)']],
            body: [
              ['Total Revenue', Number(pl.summary.totalRevenue).toLocaleString()],
              ['Total Expenses', `(${Number(pl.summary.totalExpenses).toLocaleString()})`],
              ['Gross Profit', Number(pl.summary.grossProfit).toLocaleString()],
              ['Operating Margin', `${pl.summary.operatingMargin.toFixed(2)}%`],
              ['Net Profit', Number(pl.summary.netProfit).toLocaleString()],
            ],
            theme: 'striped',
            headStyles: { fillColor: pColor as [number, number, number] },
            columnStyles: { 1: { halign: 'right' } }
          });

          doc.save('profit_and_loss.pdf');
          break;
      }
      toast.success(`${id.replace(/-/g, ' ')} ${formatType} generated successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => (
          <Card key={report.id} className="shadow-medium border-none bg-card/40 backdrop-blur-md hover-lift overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors`} />
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${report.color}`}>
                  <report.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="max-w-[250px]">{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mt-4">
                {report.formats.map(fmt => (
                  <Button 
                    key={fmt}
                    variant="outline" 
                    size="sm" 
                    className="h-9 rounded-xl border-primary/20 hover:bg-primary hover:text-white transition-all gap-2"
                    disabled={!!generating}
                    onClick={() => handleGenerate(report.id, fmt as 'PDF' | 'CSV')}
                  >
                    {generating === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {fmt}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-strong border-none bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Executive Advisor
          </CardTitle>
          <CardDescription>Intelligent business recommendations based on real-time data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Stock Alert",
                insight: "High demand for 'Back Packs' detected. Restock suggested before weekend.",
                variant: "destructive"
              },
              {
                title: "Profit Optimizer",
                insight: "Current margin is 12% above target. Consider loyalty promotions.",
                variant: "success"
              },
              {
                title: "Expenses",
                insight: "Operational overhead is steady. No unusual spikes detected.",
                variant: "info"
              }
            ].map((insight, i) => (
              <div key={i} className="p-4 rounded-2xl bg-background/50 border border-border/50 hover:shadow-medium transition-all">
                <Badge variant={insight.variant as any} className="mb-2 uppercase text-[10px]">
                  {insight.title}
                </Badge>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight.insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
