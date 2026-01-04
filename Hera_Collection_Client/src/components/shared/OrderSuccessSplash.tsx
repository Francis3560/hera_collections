import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
    hidden: { y: 20, opacity: 0 },
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

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full"
      >
        {/* Success Icon Animation */}
        <motion.div 
          variants={itemVariants}
          className="relative mb-10 flex justify-center"
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
        <motion.div variants={itemVariants} className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Order Confirmed
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium">
            Thank you for choosing <span className="text-primary font-semibold">Hera Collection</span>.
          </p>
          {orderNumber && (
            <div className="inline-block px-4 py-2 bg-primary/5 rounded-full border border-primary/20 mt-2">
              <span className="text-sm font-semibold text-primary">Order #{orderNumber}</span>
            </div>
          )}
        </motion.div>

        {/* Corporate Status Roadmap */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
               <Package className="w-12 h-12" />
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-left mb-1 text-sm">Order Received</h3>
            <p className="text-xs text-muted-foreground text-left">Your order is logged and currently being acted upon by our concierge.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
               <Bell className="w-12 h-12" />
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-left mb-1 text-sm">Real-time Updates</h3>
            <p className="text-xs text-muted-foreground text-left">You will receive notifications at every milestone of your order's journey.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
               <Truck className="w-12 h-12" />
            </div>
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-left mb-1 text-sm">Express Delivery</h3>
            <p className="text-xs text-muted-foreground text-left">We'll notify you the moment your items are dispatched for delivery.</p>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div variants={itemVariants}>
          <Button 
            onClick={handleAction}
            className="rounded-full px-10 h-14 text-lg font-bold shadow-2xl shadow-primary/30 group hover:scale-105 transition-all"
          >
            {isPos ? 'New Sale' : 'Track My Order'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          {!isPos && (
            <p className="mt-6 text-sm text-muted-foreground">
              A confirmation email has been sent to your inbox.
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
