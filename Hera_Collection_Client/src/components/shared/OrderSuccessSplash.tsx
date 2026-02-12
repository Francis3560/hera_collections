import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Bell, ArrowRight, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import orderService from '@/api/order.service';
import { format } from 'date-fns';
import { toast } from "sonner";

interface OrderSuccessSplashProps {
  orderNumber?: string;
  onContinue?: () => void;
  isPos?: boolean;
}

export const OrderSuccessSplash: React.FC<OrderSuccessSplashProps> = ({ 
  orderNumber, 
  onContinue,
  isPos = false 
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderNumber) {
        fetchOrderStatus();
    }
  }, [orderNumber]);

  const fetchOrderStatus = async () => {
    setLoading(true);
    try {
        const res = await orderService.getOrders({ search: orderNumber });
        const foundOrder = res.data?.[0] || res?.[0];
        if (foundOrder) {
            setOrder(foundOrder);
            setStatus(foundOrder.status);
            toast.success("Order status updated");
        }
    } catch (error) {
        console.error("Failed to fetch order status", error);
    } finally {
        setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const handleAction = () => {
    if (onContinue) {
      onContinue();
    } else if (orderNumber) {
      navigate(`/order-tracking/${orderNumber}`);
    } else {
      navigate('/');
    }
  };

  const handleDownloadReceipt = () => {
      window.print();
  };

  const getStepStatus = (step: string) => {
      const steps = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED'];
      const currentIndex = steps.indexOf(status === 'FULFILLED' ? 'PROCESSING' : status);
      const stepIndex = steps.indexOf(step);
      
      if (status === 'CANCELLED') return 'cancelled';
      if (currentIndex >= stepIndex) return 'completed';
      return 'pending';
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center print:p-0 print:text-left print:items-start print:min-h-0">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl w-full print:max-w-none"
      >
        {/* Success Icon Animation - Hide in Print */}
        <motion.div 
          variants={itemVariants}
          className="relative mb-10 flex justify-center print:hidden"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse scale-150" />
          <div className="relative bg-white dark:bg-zinc-900 rounded-full p-8 shadow-2xl border border-primary/10">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.5 
              }}
            >
              <CheckCircle2 className="w-20 h-20 text-primary" strokeWidth={1.5} />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div variants={itemVariants} className="space-y-4 mb-12 print:mb-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 print:text-2xl">
            {status === 'COMPLETED' ? 'Order Completed' : 'Order Confirmed'}
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium print:text-sm">
            Thank you for choosing <span className="text-primary font-semibold">Hera Collection</span>.
          </p>
          {orderNumber && (
            <div className="inline-block px-4 py-2 bg-primary/5 rounded-full border border-primary/20 mt-2 print:border-none print:px-0">
              <span className="text-sm font-semibold text-primary print:text-black">Order #{orderNumber}</span>
            </div>
          )}
        </motion.div>

        {/* Status Stepper */}
        {orderNumber && !isPos && (
             <motion.div variants={itemVariants} className="mb-12 bg-card border rounded-xl p-6 shadow-sm print:shadow-none print:border-none print:p-0">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
                     {/* Progress Bar Background (Desktop) */}
                     <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded" />
                     
                     {['PENDING', 'PAID', 'PROCESSING', 'COMPLETED'].map((step, idx) => {
                         const stepStatus = getStepStatus(step);
                         const isCompleted = stepStatus === 'completed';
                         const isCurrent = (status === 'FULFILLED' ? 'PROCESSING' : status) === step;
                         
                         let label = step.charAt(0) + step.slice(1).toLowerCase();
                         if (step === 'PENDING') label = 'Placed';
                         
                         return (
                             <div key={step} className="flex flex-col items-center gap-2 bg-card px-2 z-10 w-full md:w-auto">
                                 <div className={`
                                     w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                                     ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                                       isCurrent ? 'bg-background border-primary text-primary animate-pulse' : 'bg-muted border-muted text-muted-foreground'}
                                 `}>
                                     {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{idx + 1}</span>}
                                 </div>
                                 <span className={`text-xs font-semibold ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                     {label}
                                 </span>
                             </div>
                         );
                     })}
                 </div>
                 
                 {/* Current Status Message */}
                 <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed flex items-start gap-3 text-left">
                     <Bell className="w-5 h-5 text-primary mt-0.5" />
                     <div>
                         <h4 className="font-semibold text-sm">Status: {status}</h4>
                         <p className="text-xs text-muted-foreground mt-1">
                             {status === 'PENDING' && "We have received your order. Please complete payment if you haven't already."}
                             {status === 'PAID' && "Payment confirmed. We are preparing your order."}
                             {(status === 'PROCESSING' || status === 'FULFILLED') && "Your order is being processed and packed with care."}
                             {status === 'COMPLETED' && "Order completed and delivered. Enjoy!"}
                             {status === 'CANCELLED' && "This order has been cancelled."}
                         </p>
                     </div>
                 </div>
             </motion.div>
        )}

        {/* Receipt / Invoice View (Only visible when printing) */}
        {order && (
            <div className="hidden print:block text-left space-y-4 mt-8">
                <div className="border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold">Receipt</h2>
                    <p className="text-sm text-gray-500">Date: {format(new Date(order.createdAt), 'PPP')}</p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2">Item</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2">Price</th>
                            <th className="text-right py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item: any) => (
                            <tr key={item.id} className="border-b">
                                <td className="py-2">
                                    {item.product?.title}
                                    {item.variantName && <span className="text-gray-500 block text-xs">{item.variantName}: {item.variantValue}</span>}
                                </td>
                                <td className="text-right py-2">{item.quantity}</td>
                                <td className="text-right py-2">{Number(item.price).toLocaleString()}</td>
                                <td className="text-right py-2">{Number(item.total).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 flex justify-end">
                    <div className="w-48 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{Number(order.subtotalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>{Number(order.totalAmount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Action Buttons - Hide in Print */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <Button 
            onClick={fetchOrderStatus}
            variant="outline"
            className="rounded-full h-12 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>

          {status === 'COMPLETED' && (
               <Button 
                onClick={handleDownloadReceipt}
                variant="outline"
                className="rounded-full h-12 gap-2 border-primary/20 text-primary hover:bg-primary/5"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </Button>
          )}

          <Button 
            onClick={handleAction}
            className="rounded-full px-8 h-12 text-lg font-bold shadow-xl shadow-primary/20 group transition-all"
          >
            {isPos ? 'New Sale' : 'Continue Shopping'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
