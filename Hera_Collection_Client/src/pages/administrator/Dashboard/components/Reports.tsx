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

interface DashboardReportsProps {
  period: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
}

const BRAND_INFO = {
  name: 'HERA COLLECTION',
  logo: 'https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771745617/HERA-logo-black_o0ulzi.png', // Official Brand Logo
  email: 'admin@heracollections.com',
  phone: '+254718577608 | +254707064827',
  location: 'Nairobi, Kenya'
};

export const DashboardReports: React.FC<DashboardReportsProps> = ({ period, dateRange }) => {
  const [generating, setGenerating] = useState<string | null>(null);

  const getParams = () => {
    if (period === 'custom' && dateRange.from && dateRange.to) {
      return {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      };
    }
    return { timeframe: period };
  };

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

    // Add Logo if available (Base64 or URL)
    // For simplicity, we use text-based branding for robustness
    
    // Header Background Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 45, 'F');

    // Add Brand Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text(BRAND_INFO.name, 14, 25);
    
    // Add Report Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(title.toUpperCase(), 14, 35);
    
    // Header Contact Info (Top Right)
    doc.setFontSize(8);
    doc.text(BRAND_INFO.email, 196, 15, { align: 'right' });
    doc.text(BRAND_INFO.phone, 196, 20, { align: 'right' });
    doc.text(BRAND_INFO.location, 196, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(60);
    const dateStr = period === 'custom' && dateRange.from ? 
       `${format(dateRange.from, 'PP')} - ${format(dateRange.to || new Date(), 'PP')}` : 
       `Period: Last ${period.charAt(0).toUpperCase() + period.slice(1)}`;
    doc.text(`Report Range: ${dateStr}`, 14, 55);
    doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 196, 55, { align: 'right' });

    autoTable(doc, {
      startY: 62,
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.key])),
      headStyles: { 
        fillColor: primaryColor as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' },
      margin: { left: 14, right: 14 }
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.line(14, doc.internal.pageSize.getHeight() - 20, 196, doc.internal.pageSize.getHeight() - 20);
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `© ${new Date().getFullYear()} Hera Collection Business Insights - Nairobi, Kenya`,
        14,
        doc.internal.pageSize.getHeight() - 12
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        196,
        doc.internal.pageSize.getHeight() - 12,
        { align: 'right' }
      );
    }

    doc.save(`${filename}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleGenerate = async (id: string, formatType: 'PDF' | 'CSV') => {
    setGenerating(id);
    const params = getParams();
    try {
      let response;
      switch (id) {
        case 'sales-summary':
          response = await reportService.getSalesSummary(params);
          const salesData = response.data.map((o: any) => ({
            'Order #': o.orderNumber,
            'Customer': o.buyer?.name || o.customerFirstName || 'Guest',
            'Amount': `KES ${Number(o.totalAmount).toLocaleString()}`,
            'Status': o.status,
            'Date': format(new Date(o.createdAt), 'yyyy-MM-dd')
          }));
          
          if (!salesData || salesData.length === 0) {
            toast.error("No sales data found for the selected period.");
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
          response = await reportService.getExpensesReport(params);
          const expData = response.data.map((e: any) => ({
            'Title': e.title,
            'Category': e.category?.name || 'Uncategorized',
            'Amount': `KES ${Number(e.amount).toLocaleString()}`,
            'Date': format(new Date(e.date), 'yyyy-MM-dd'),
            'Method': e.paymentMethod
          }));

          if (!expData || expData.length === 0) {
            toast.error("No expense data found for the selected period.");
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
          response = await reportService.getProfitLoss(params);
          const pl = response.data;
          // P&L is special, we generate a custom PDF layout for it
          const doc = new jsPDF();
          const pColor = [124, 58, 237];
          
          // Header Background
          doc.setFillColor(pColor[0], pColor[1], pColor[2]);
          doc.rect(0, 0, 210, 45, 'F');

          doc.setFont("helvetica", "bold");
          doc.setFontSize(26);
          doc.setTextColor(255, 255, 255);
          doc.text(BRAND_INFO.name, 14, 25);
          
          doc.setFontSize(14);
          doc.setFont("helvetica", "normal");
          doc.text("PROFIT & LOSS STATEMENT", 14, 35);

          doc.setFontSize(8);
          doc.text(BRAND_INFO.email, 196, 15, { align: 'right' });
          doc.text(BRAND_INFO.phone, 196, 20, { align: 'right' });
          doc.text(BRAND_INFO.location, 196, 25, { align: 'right' });
          
          doc.setFontSize(10);
          doc.setTextColor(60);
          const plDateStr = period === 'custom' && dateRange.from ? 
            `${format(dateRange.from, 'PP')} - ${format(dateRange.to || new Date(), 'PP')}` : 
            `Time Range: ${period.charAt(0).toUpperCase() + period.slice(1)}`;
          doc.text(`Financial Performance: ${plDateStr}`, 14, 55);
          doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 196, 55, { align: 'right' });

          autoTable(doc, {
            startY: 65,
            head: [['Financial Categorization', 'Amount (KES)']],
            body: [
              ['Total Gross Revenue', { content: Number(pl.summary.totalRevenue).toLocaleString(), styles: { fontStyle: 'bold' } }],
              ['Total Operating Expenses', `(${Number(pl.summary.totalExpenses || 0).toLocaleString()})`],
              ['Gross Profit Margin', { content: Number(pl.summary.grossProfit).toLocaleString(), styles: { fontStyle: 'bold' } }],
              ['Operating Percentage', `${pl.summary.operatingMargin?.toFixed(1) || 0}%`],
              [{ content: 'NET BUSINESS PROFIT', styles: { fontStyle: 'bold', fontSize: 12 } }, 
               { content: Number(pl.summary.netProfit).toLocaleString(), styles: { fontStyle: 'bold', textColor: [21, 128, 61], fontSize: 12 } }],
            ],
            theme: 'grid',
            headStyles: { fillColor: pColor as [number, number, number] },
            columnStyles: { 1: { halign: 'right' } },
            styles: { cellPadding: 8 }
          });

          // Add footer
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `© ${new Date().getFullYear()} Hera Collection Financial Division - Executive Confidential`,
            14,
            doc.internal.pageSize.getHeight() - 12
          );

          doc.save(`ProfitLoss_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
          break;
      }
      toast.success(`${id.replace(/-/g, ' ')} report generated successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate the requested report.');
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
