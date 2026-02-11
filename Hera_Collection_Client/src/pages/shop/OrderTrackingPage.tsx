import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderService from "@/api/order.service";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronRight, ArrowLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LiveChat } from "@/components/chat/LiveChat";

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Use getOrderById which now handles both numeric IDs and order numbers
        const response = await OrderService.getOrderById(orderNumber);
        if (response.success && response.data) {
          setOrder(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const handleNeedHelp = () => {
    window.dispatchEvent(new CustomEvent('open-chat', {
      detail: { message: `Hello, I need help with my order: ${orderNumber}` }
    }));
  };

  const steps = [
    { label: "Order Placed", icon: Clock, status: ["PENDING", "PAID", "PROCESSING", "FULFILLED", "SHIPPED", "COMPLETED"] },
    { label: "Paid", icon: CheckCircle, status: ["PAID", "PROCESSING", "FULFILLED", "SHIPPED", "COMPLETED"] },
    { label: "Processing", icon: Package, status: ["PROCESSING", "FULFILLED", "SHIPPED", "COMPLETED"] },
    { label: "Ready / Shipped", icon: Truck, status: ["FULFILLED", "SHIPPED", "COMPLETED"] },
    { label: "Completed", icon: CheckCircle, status: ["COMPLETED"] }
  ];

  // Determine the highest status reached
  const currentStatusIndex = steps.reduce((acc, step, index) => {
    if (step.status.includes(order?.status)) return index;
    return acc;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 print:bg-white">
        <div className="print:hidden"><Header /></div>
        <main className="flex-1 flex items-center justify-center print:items-start print:justify-start">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary print:hidden"></div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">We couldn't find an order with number {orderNumber}.</p>
          <Button asChild className="rounded-full">
            <Link to="/profile/orders">Go to My Orders</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      {/* MODERN RECEIPT PRINT VIEW - ONLY VISIBLE DURING PRINTING */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-12 text-zinc-900 overflow-visible">
        {/* Receipt Header */}
        <div className="flex justify-between items-start border-b-2 border-zinc-100 pb-8 mb-8">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
               <Package className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-none">HERA COLLECTION</h1>
              <p className="text-sm text-zinc-500 mt-1 uppercase tracking-widest">Premium Bags & Accessories</p>
              <div className="mt-2 text-[10px] text-zinc-400 font-medium">
                <p>Nairobi, Kenya</p>
                <p>+254 718577608 | admin@heracollection.com</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-zinc-100 absolute right-12 top-8 -z-10 select-none">RECEIPT</h2>
            <div className="mt-4">
               <p className="text-xs text-zinc-400 uppercase font-bold tracking-tighter">Receipt Number</p>
               <p className="text-xl font-mono font-bold">#{order.orderNumber}</p>
            </div>
            <div className="mt-2">
               <p className="text-xs text-zinc-400 uppercase font-bold tracking-tighter">Date issued</p>
               <p className="text-sm font-semibold">{format(new Date(order.createdAt), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Client & Shipping Info */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-3 border-b border-zinc-100 pb-1">Billed To</h3>
            <p className="font-bold text-lg">{order.customerFirstName} {order.customerLastName}</p>
            <p className="text-zinc-600 text-sm mt-1">{order.customerEmail}</p>
            <p className="text-zinc-600 text-sm">{order.customerPhone}</p>
          </div>
          <div>
            <h3 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-3 border-b border-zinc-100 pb-1">Shipping Details</h3>
            <p className="text-zinc-800 text-sm leading-relaxed">{order.shippingAddress || "N/A"}</p>
            <div className="mt-2 flex gap-4 text-[11px]">
               <div>
                  <span className="text-zinc-400 uppercase">Method:</span>
                  <span className="ml-1 font-bold">{order.shippingMethod || "Standard"}</span>
               </div>
               <div>
                  <span className="text-zinc-400 uppercase">Payment:</span>
                  <span className="ml-1 font-bold">{order.paymentMethod}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-y-2 border-zinc-900">
                    <th className="py-4 text-[10px] uppercase font-black tracking-widest">Product Description</th>
                    <th className="py-4 text-[10px] uppercase font-black tracking-widest text-center">Unit Price</th>
                    <th className="py-4 text-[10px] uppercase font-black tracking-widest text-center">Qty</th>
                    <th className="py-4 text-[10px] uppercase font-black tracking-widest text-right">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                 {order.items?.map((item: any) => (
                    <tr key={item.id}>
                       <td className="py-5">
                          <p className="font-bold text-zinc-900">{item.product?.title || "Luxury Item"}</p>
                          {item.variantName && (
                              <p className="text-xs text-zinc-500 mt-0.5">
                                 {item.variantName}: {item.variantValue}
                                 {item.variant?.sku && <span className="ml-2 font-mono opacity-60">SKU: {item.variant.sku}</span>}
                              </p>
                          )}
                       </td>
                       <td className="py-5 text-center font-mono text-sm">
                          KES {Number(item.price).toLocaleString()}
                       </td>
                       <td className="py-5 text-center font-bold">
                          {item.quantity}
                       </td>
                       <td className="py-5 text-right font-bold font-mono">
                          KES {(item.price * item.quantity).toLocaleString()}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-8 border-t-2 border-zinc-900">
           <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                 <span className="text-zinc-400 font-bold uppercase tracking-tighter">Subtotal</span>
                 <span className="font-mono font-bold">KES {Number(order.subtotalAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-zinc-400 font-bold uppercase tracking-tighter">VAT (Taxes)</span>
                 <span className="font-mono font-bold">KES {Number(order.taxAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pb-3 border-b border-zinc-100">
                 <span className="text-zinc-400 font-bold uppercase tracking-tighter">Shipping</span>
                 <span className="font-mono font-bold">KES {Number(order.shippingCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 text-white p-4 rounded-xl">
                 <span className="text-[10px] uppercase font-black tracking-widest">Total Amount</span>
                 <span className="text-xl font-mono font-bold underline decoration-primary underline-offset-4">
                    KES {Number(order.totalAmount).toLocaleString()}
                 </span>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-24 text-center">
           <div className="inline-block px-8 py-2 border-2 border-zinc-900 rounded-full mb-4">
              <p className="text-xs font-black uppercase tracking-[0.3em]">Thank you for your business</p>
           </div>
           <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Items are non-refundable once seals are broken. Verify your package upon delivery.</p>
        </div>
      </div>

      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 print:hidden">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Link to="/profile/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Order History
            </Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-light mb-2">Track <span className="font-semibold">Order</span></h1>
                <p className="text-muted-foreground font-mono">Order #{order.orderNumber}</p>
              </div>
              <div className="flex gap-4">
                  {order.status === 'COMPLETED' && (
                      <Button onClick={() => window.print()} variant="outline" className="gap-2 cursor-pointer hover:bg-zinc-900 hover:text-white transition-all">
                          <Download className="w-4 h-4" /> Print Receipt
                      </Button>
                  )}
                  <Badge className="px-6 py-2 text-lg rounded-full bg-primary/10 text-primary border-primary/20">
                  {order.status}
                  </Badge>
              </div>
            </div>
            
            {/* Tracking Progress Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-border/40 mb-12">
              <div className="relative flex justify-between items-center z-10">
                {steps.map((step, index) => {
                  const isActive = index <= currentStatusIndex; 
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-3 relative flex-1 text-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                        isActive 
                          ? "bg-primary text-white scale-110" 
                          : "bg-secondary text-muted-foreground grayscale"
                      }`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                      
                      {/* Connecting Line */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-7 left-1/2 w-full h-1 -z-10 overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${
                            index < currentStatusIndex ? "bg-primary w-full" : "bg-slate-200 w-0"
                          }`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Delivery Info */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-border/40">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Information
                </h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Shipping Address</p>
                    <p className="font-medium">{order.shippingAddress || "Information not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Recipient</p>
                    <p className="font-medium">{order.customerFirstName} {order.customerLastName} ({order.customerEmail})</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Estimate Time</p>
                    <p className="font-medium">3-5 Business Days</p>
                  </div>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-border/40">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Summary
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm font-medium">Items Total</span>
                    <span className="font-bold">KES {Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2">
                     {order.items?.map((item: any) => (
                         <div key={item.id} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 ">
                             <div className="flex flex-col flex-1 pr-4">
                                 <span className="font-medium truncate">{item.product?.title || "Product"}</span>
                                 {item.variantName && (
                                     <span className="text-xs text-muted-foreground">
                                         {item.variantName}: {item.variantValue}
                                         {item.variant?.sku && <span className="ml-2 font-mono opacity-70">SKU: {item.variant.sku}</span>}
                                     </span>
                                 )}
                                 <span className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</span>
                             </div>
                             <span className="font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
                         </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
               <Button 
                  onClick={handleNeedHelp}
                  variant="outline" 
                  className="rounded-full px-8 py-6 h-auto text-lg group"
               >
                  Need help with your order?
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>
          </div>
        </main>
        <Footer />
        <LiveChat />
      </div>
    </>
  );
}
