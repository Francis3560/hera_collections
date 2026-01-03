import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 max-w-[600px] w-full mx-6"
          >
            <div className="glass-card p-12 text-center space-y-8 border-none shadow-strong bg-white/5 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center relative">
                  <ShieldAlert className="h-12 w-12 text-primary" />
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive flex items-center justify-center animate-bounce shadow-glow-destructive">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight gradient-text leading-tight">
                  System Interruption
                </h1>
                <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
                  A premium experience encountered an unexpected structural failure. Our engineers have been notified.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 bg-black/40 rounded-2xl border border-white/10 text-left overflow-auto max-h-[150px] font-mono text-xs text-primary/70 mb-6">
                  {this.state.error.toString()}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.reload()}
                  className="btn-primary h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-glow group"
                >
                  <RefreshCcw className="mr-3 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  Restore Session
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => window.location.href = '/'}
                  className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-white/10 hover:bg-white/5"
                >
                  <Home className="mr-3 h-4 w-4" />
                  Return Base
                </Button>
              </div>
            </div>
            
            <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
              Hera Collection Infrastructure &copy; 2025
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
