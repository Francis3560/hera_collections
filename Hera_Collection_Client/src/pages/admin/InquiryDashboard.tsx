import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  MessageCircle, 
  User, 
  Send, 
  XCircle, 
  MoreVertical,
  ChevronRight,
  Loader2,
  Trash2,
  Clock,
  UserCheck,
  UserX,
  MessageSquare
} from "lucide-react";
import { inquiryService, InquirySession } from "@/api/inquiry.service";
import { socketService } from "@/utils/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export default function InquiryDashboard() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();

  // Mark associated notifications as read when session is selected
  useEffect(() => {
    if (selectedSessionId) {
       const relatedNotifications = notifications.filter(
         n => !n.isRead && n.entityType === 'INQUIRY' && n.entityId === selectedSessionId
       );
       if (relatedNotifications.length > 0) {
         markAsRead(relatedNotifications.map(n => n.id));
       }
    }
  }, [selectedSessionId, notifications, markAsRead]);

  // Fetch all active inquiries
  const { data: activeSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: () => inquiryService.getActiveInquiries(),
    refetchInterval: 5000, // Faster poll for admin responsiveness
  });

  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAdminTyping = () => {
    if (!selectedSessionId) return;

    // Emit typing event
    socketService.emit("inquiry:typing", {
      sessionId: selectedSessionId,
      isTyping: true
    });

    // Reset typing status after a delay
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit("inquiry:typing", {
         sessionId: selectedSessionId,
         isTyping: false
      });
    }, 3000);
  };

  // Fetch messages for selected session
  const { data: selectedSession, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["inquiry-messages", selectedSessionId],
    queryFn: () => inquiryService.getMessages(selectedSessionId!),
    enabled: !!selectedSessionId,
    refetchInterval: 5000,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      return inquiryService.adminReply(sessionId, content);
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(["inquiry-messages", selectedSessionId], (old: any) => ({
        ...old,
        messages: [...(old?.messages || []), newMessage]
      }));
      setReply("");
      // Emit via socket
      socketService.emit("inquiry:message", {
        sessionId: selectedSessionId,
        message: newMessage
      });
    }
  });

  // Close session mutation
  const closeMutation = useMutation({
    mutationFn: (sessionId: string) => inquiryService.closeSession(sessionId),
    onSuccess: (_, sessionId) => {
      toast.success("Inquiry closed successfully");
      if (selectedSessionId === sessionId) setSelectedSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      // Notify user via socket
      socketService.emit("inquiry:close", sessionId);
    }
  });

  // Real-time updates
  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket) {
      const handleNewMessage = (data: any) => {
        // If it's for the selected chat, update messages
        if (selectedSessionId === data.sessionId) {
          queryClient.setQueryData(["inquiry-messages", selectedSessionId], (old: any) => {
             if (old?.messages?.some((m: any) => m.id === data.message.id)) return old;
             return {
               ...old,
               messages: [...(old?.messages || []), data.message]
             };
          });
        }
        // Always refresh the sidebar to show latest preview
        queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
        
        // Notification toast for admin
        // Removed local toast to avoid double notifications (global toast in NotificationContext)
      };

      const handleNewInquiry = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      };

      const handleTyping = (data: any) => {
        if (data.sessionId === selectedSessionId && data.userRole !== 'ADMIN') { 
          setIsCustomerTyping(data.isTyping);
        }
      };

      socketService.on("inquiry:new_message", handleNewMessage);
      socketService.on("inquiry:joined", handleNewInquiry);
      socketService.on("inquiry:typing", handleTyping);

      return () => {
        socketService.off("inquiry:new_message", handleNewMessage);
        socketService.off("inquiry:joined", handleNewInquiry);
        socketService.off("inquiry:typing", handleTyping);
      };
    } else {
      // If socket not ready, check again soon or try connecting
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] }); // Trigger a re-render
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedSessionId, queryClient, socketService.connected]);

  // Join session room when selected
  useEffect(() => {
    if (selectedSessionId) {
      socketService.emit("inquiry:join", selectedSessionId);
    }
  }, [selectedSessionId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedSession?.messages, selectedSessionId]);

  const handleSendReply = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!reply.trim() || !selectedSessionId || replyMutation.isPending) return;
    replyMutation.mutate({ sessionId: selectedSessionId, content: reply.trim() });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background border rounded-3xl overflow-hidden shadow-elegant">
      {/* Sidebar - Chat List */}
      <div className="w-[350px] border-r flex flex-col bg-secondary/5">
        <div className="p-6 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            Live Inquiries
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search inquiries..." className="pl-9 bg-background/50 border-primary/10 rounded-xl" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoadingSessions ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activeSessions?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <p className="text-sm">No active inquiries at the moment.</p>
              </div>
            ) : (
              activeSessions?.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-start gap-4 transition-all duration-200 hover:bg-secondary/40 group relative overflow-hidden",
                    selectedSessionId === sess.id ? "bg-primary text-primary-foreground shadow-md" : "bg-background border border-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2",
                    selectedSessionId === sess.id ? "bg-white/20 border-white/30" : "bg-primary/10 border-primary/5"
                  )}>
                    {sess.user?.picture ? (
                      <img src={sess.user.picture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className={cn("w-6 h-6", selectedSessionId === sess.id ? "text-white" : "text-primary")} />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold truncate text-sm">
                        {sess.user?.name || sess.guestName || "Guest Visitor"}
                      </span>
                      <span className={cn(
                        "text-[10px] shrink-0",
                        selectedSessionId === sess.id ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {sess.messages?.[0] ? format(new Date(sess.messages[0].createdAt), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs truncate",
                      selectedSessionId === sess.id ? "text-white/80" : "text-muted-foreground"
                    )}>
                      {sess.messages?.[0]?.content || "Started a new inquiry"}
                    </p>
                  </div>
                  {selectedSessionId === sess.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-background/50">
        {selectedSessionId ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/5">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    {selectedSession?.user?.name || selectedSession?.guestName || "Guest Visitor"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 bg-green-500/5 text-green-500 border-green-500/20 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      Active Session
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ID: {selectedSessionId.split('-')[0]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => closeMutation.mutate(selectedSessionId)}
                  disabled={closeMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 w-48">
                    <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                      <UserCheck className="w-4 h-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl p-3 text-red-500 cursor-pointer">
                      <UserX className="w-4 h-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-dots-grid">
              {isLoadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p>Loading conversation history...</p>
                </div>
              ) : (
                selectedSession?.messages?.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex flex-col gap-2 max-w-[70%]",
                      msg.isFromAdmin ? "items-end ml-auto" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-2 mb-1 px-1",
                      msg.isFromAdmin && "flex-row-reverse"
                    )}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {msg.isFromAdmin ? "Hera Agent" : "Customer"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <div className={cn(
                      "px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                      msg.isFromAdmin 
                        ? "bg-primary text-primary-foreground rounded-tr-none text-right" 
                        : "bg-background border border-primary/10 text-foreground rounded-tl-none shadow-elegant"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isCustomerTyping && (
                <div className="flex flex-col gap-2 max-w-[70%] items-start">
                   <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Customer is typing
                      </span>
                   </div>
                   <div className="px-5 py-3 rounded-3xl bg-background border border-primary/10 flex gap-1 items-center">
                     <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t bg-background/80 backdrop-blur-md sticky bottom-0">
              <form onSubmit={handleSendReply} className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Input
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value);
                      handleAdminTyping();
                    }}
                    placeholder="Type your response here..."
                    className="pr-12 py-7 rounded-3xl bg-secondary/5 border-primary/10 transition-all focus:bg-background focus:ring-primary h-auto text-base"
                    disabled={replyMutation.isPending}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    {/* Add attachment/emoji buttons here if needed */}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full h-14 w-14 shadow-lg shrink-0 transition-transform active:scale-95"
                  disabled={!reply.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Select a Conversation</h3>
            <p className="max-w-md">
              Choose an active inquiry from the sidebar to view details and start chatting with the customer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
