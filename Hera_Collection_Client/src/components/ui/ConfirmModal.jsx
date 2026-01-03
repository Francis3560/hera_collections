import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  variant = "destructive", // 'destructive' | 'info'
  isLoading = false,
  children 
}) => {
  const isDestructive = variant === 'destructive';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className={`
        glass-card border-none shadow-strong max-w-[480px] overflow-hidden p-0
        ${isDestructive ? 'shadow-destructive/20' : 'shadow-primary/20'}
      `}>
        <div className="p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-5">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`p-5 rounded-3xl ${isDestructive ? 'bg-destructive/10 text-destructive shadow-glow-destructive' : 'bg-primary/10 text-primary shadow-glow'}`}
            >
              {isDestructive ? <Trash2 className="h-12 w-12" /> : <Info className="h-12 w-12" />}
            </motion.div>
            
            <div className="space-y-3">
              <AlertDialogTitle className="text-3xl font-black tracking-tight text-foreground leading-tight">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-lg font-medium leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>

          {children && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 dark:bg-black/20 rounded-2xl p-4 border border-white/10"
            >
              {children}
            </motion.div>
          )}

          <AlertDialogFooter className="flex-col sm:flex-row gap-4 pt-4">
            <AlertDialogCancel asChild>
              <Button 
                variant="ghost" 
                className="h-14 rounded-2xl border-white/10 hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-bounce"
              >
                {cancelText}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isLoading}
                className={`
                  h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-glow transition-bounce
                  ${isDestructive ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'btn-primary'}
                `}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
        
        {/* Animated accent gradient at the bottom */}
        <div className="h-2 w-full overflow-hidden">
          <motion.div 
            animate={{ 
              x: ["-100%", "100%"] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className={`h-full w-full ${isDestructive ? 'bg-gradient-to-r from-transparent via-destructive to-transparent' : 'bg-gradient-to-r from-transparent via-primary to-transparent'}`} 
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmModal;
