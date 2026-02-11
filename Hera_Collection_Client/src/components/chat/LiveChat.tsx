import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  User, 
  Headphones,
  History,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { inquiryService, InquiryMessage, InquirySession } from "@/api/inquiry.service";
import { socketService } from "@/utils/socket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const GUEST_ID_KEY = "hera_guest_id";
const SESSION_ID_KEY = "hera_active_inquiry_session";

export const LiveChat: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [showHistory, setShowHistory] = useState(false);
  const [localSessionHistory, setLocalSessionHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Listen for external triggers to open chat with a message
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const { message: initialMessage } = e.detail || {};
      setIsOpen(true);
      if (initialMessage) {
        setMessage(initialMessage);
      }
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // Get or create Guest ID
  const [guestId] = useState(() => {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = `guest_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  });

  // Fetch current session
  const { data: session, isLoading: isLoadingSession, refetch: refetchSession } = useQuery({
    queryKey: ["inquiry-session", isAuthenticated ? user?.id : guestId],
    queryFn: async () => {
      const sess = await inquiryService.getOrCreateSession({
        guestId: !isAuthenticated ? guestId : undefined,
        guestName: !isAuthenticated ? guestInfo.name : undefined,
        guestEmail: !isAuthenticated ? guestInfo.email : undefined
      });
      localStorage.setItem(SESSION_ID_KEY, sess.id);
      return sess;
    },
    enabled: isOpen,
    staleTime: Infinity,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!session) throw new Error("No active session");
      return inquiryService.sendMessage(session.id, content);
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(["inquiry-session", isAuthenticated ? user?.id : guestId], (old: any) => ({
        ...old,
        messages: [...(old?.messages || []), newMessage]
      }));
      setMessage("");
      // Emit via socket for real-time
      socketService.emit("inquiry:message", {
        sessionId: session?.id,
        message: newMessage
      });
    }
  });

  // Socket logic
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("hera_accessToken");
      const socket = socketService.connect(token || undefined, !isAuthenticated ? guestId : undefined);

      if (socket && session) {
        socketService.emit("inquiry:join", session.id);

        const handleNewMessage = (data: any) => {
          if (data.sessionId === session.id) {
            queryClient.setQueryData(["inquiry-session", isAuthenticated ? user?.id : guestId], (old: any) => {
              // Avoid duplicates
              if (old?.messages?.some((m: any) => m.id === data.message.id)) return old;
              return {
                ...old,
                messages: [...(old?.messages || []), data.message]
              };
            });
          }
        };

        const handleClosed = (data: any) => {
          if (data.sessionId === session.id) {
            toast.info("This support session has been closed by the admin.");
            
            // Store in local history before clearing
            if (session) {
                setLocalSessionHistory(prev => [...prev, { ...session, closedAt: new Date().toISOString() }]);
            }
            
            localStorage.removeItem(SESSION_ID_KEY);
            queryClient.invalidateQueries({ queryKey: ["inquiry-session"] });
            setIsOpen(false);
          }
        };

        socketService.on("inquiry:message", handleNewMessage);
        socketService.on("inquiry:closed", handleClosed);

        return () => {
          socketService.off("inquiry:message", handleNewMessage);
          socketService.off("inquiry:closed", handleClosed);
        };
      }
    }
  }, [isOpen, session, isAuthenticated, guestId, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4"
          >
            <Card className="w-[350px] sm:w-[400px] h-[550px] flex flex-col shadow-2xl border-primary/10 overflow-hidden rounded-3xl bg-background/95 backdrop-blur-xl">
              {/* Header */}
              <div className="p-5 bg-primary text-primary-foreground flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Live Support</h3>
                    <p className="text-xs text-white/70">Typically replies in minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-white/10"
                    onClick={() => setShowHistory(!showHistory)}
                    title="History"
                  >
                    <History className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {isLoadingSession ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Connecting to support...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-secondary/30 p-4 rounded-2xl text-sm border border-border/40">
                      <p className="font-semibold mb-1">Welcome to Hera Live Inquiry!</p>
                      <p className="text-muted-foreground">How can we help you today? Our agents are online and ready to assist.</p>
                    </div>

                    {session?.messages?.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex flex-col gap-1 max-w-[85%]",
                          msg.isFromAdmin ? "items-start" : "items-end ml-auto"
                        )}
                      >
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm shadow-sm",
                          msg.isFromAdmin 
                            ? "bg-secondary text-secondary-foreground rounded-tl-none border border-border/40" 
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                    {sendMutation.isPending && (
                      <div className="flex items-start max-w-[80%] ml-auto animate-pulse">
                        <div className="px-4 py-3 rounded-2xl text-sm bg-primary/20 text-primary-foreground/50 rounded-tr-none italic">
                          Sending...
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t bg-secondary/10 flex gap-2 items-center">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="rounded-full bg-background border-primary/10 focus-visible:ring-primary h-11"
                  disabled={isLoadingSession}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full h-11 w-11 shrink-0"
                  disabled={!message.trim() || sendMutation.isPending || isLoadingSession}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 rounded-full shadow-2xl p-0 flex items-center justify-center transition-all duration-300 overflow-hidden",
            isOpen ? "bg-background text-primary border-2 border-primary" : "bg-primary text-primary-foreground"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="w-8 h-8" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative"
              >
                <MessageCircle className="w-8 h-8" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
};
