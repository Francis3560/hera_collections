import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderService from "@/api/order.service";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Assuming we can fetch by order number or id
        // For tracking page, usually search by order number
        const response = await OrderService.getOrders({ search: orderNumber });
        if (response.data?.length > 0) {
          setOrder(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  const steps = [
    { label: "Order Placed", icon: Clock, status: ["PENDING", "PAID", "FULFILLED"] },
    { label: "Processing", icon: Package, status: ["PAID", "FULFILLED"] },
    { label: "On the Way", icon: Truck, status: ["SHIPPED", "FULFILLED"] }, // Add SHIPPED if applicable
    { label: "Delivered", icon: CheckCircle, status: ["FULFILLED"] }
  ];

  const currentStatusIndex = steps.findIndex(step => step.status.includes(order?.status)) || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
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
            <Badge className="px-6 py-2 text-lg rounded-full bg-primary/10 text-primary border-primary/20">
              {order.status}
            </Badge>
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
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Shipping Address</p>
                  <p className="font-medium">{order.shippingAddress || "Information not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Recipient</p>
                  <p className="font-medium">{order.user?.name || "Customer"}</p>
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
                  <span className="font-bold">KES {order.totalAmount}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2">
                   {order.items?.map((item: any) => (
                       <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                           <span className="truncate flex-1 pr-4">{item.product?.title || "Product"} × {item.quantity}</span>
                           <span className="font-semibold">KES {item.price * item.quantity}</span>
                       </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
             <Button variant="outline" className="rounded-full px-8 py-6 h-auto text-lg group">
                Need help with your order?
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
             </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
