import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import orderService from '@/api/order.service';
import { Eye, Search, Filter, Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Link } from 'react-router-dom';
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
import { toast } from "sonner";

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Status Update State
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [search, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
            
            const res = await orderService.getAllOrders(params);
            setOrders(res.items || res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus, mpesaRef = null) => {
        setIsUpdating(true);
        try {
            await orderService.updateOrderStatus(orderId, newStatus, mpesaRef);
            toast.success(`Order status updated to ${newStatus}`);
            fetchOrders(); // Refresh list data
            
            // Perform a full page refresh to ensure all global state and UI elements are synced
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
            setConfirmDialogOpen(false);
            setSelectedOrder(null);
            setVerificationCode('');
        }
    };

    const initiateStatusChange = (order, newStatus) => {
        // Workflow Enforcement
        if (order.status === 'PENDING' && newStatus === 'PAID') {
            setSelectedOrder({ ...order, newStatus });
            setVerificationCode(order.mpesaReference || '');
            setConfirmDialogOpen(true);
        } else if (order.status === 'PAID' && newStatus === 'PROCESSING') {
             handleStatusUpdate(order.id, newStatus);
        } else if (order.status === 'PROCESSING' && newStatus === 'COMPLETED') {
             handleStatusUpdate(order.id, newStatus);
        } else {
             // Allow other transitions
             handleStatusUpdate(order.id, newStatus);
        }
    };

    const confirmPayment = () => {
        if (!selectedOrder) return;
        
        // If it was a manual payment and no code existed/entered
        if (!verificationCode && selectedOrder.paymentMethod === 'MPESA') {
            toast.error("Please enter the M-Pesa Reference Code to verify payment.");
            return;
        }
        
        handleStatusUpdate(selectedOrder.id, 'PAID', verificationCode);
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'PAID': return 'default'; 
            case 'PROCESSING': return 'secondary';
            case 'FULFILLED': return 'default';
            case 'SHIPPED': return 'secondary';
            case 'COMPLETED': return 'default'; 
            case 'PENDING': return 'outline';
            case 'CANCELLED': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Orders</h1>
                    <p className="text-muted-foreground mt-1">Manage and track all customer orders</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <select 
                     className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value)}
                   >
                     <option value="">All Statuses</option>
                     <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                     <option value="PROCESSING">Processing</option>
                     <option value="FULFILLED">Fulfilled</option>
                     <option value="SHIPPED">Shipped</option>
                     <option value="COMPLETED">Completed</option>
                     <option value="CANCELLED">Cancelled</option>
                   </select>
                   <Button variant="outline" size="icon">
                       <Filter className="h-4 w-4" />
                   </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[100px]">Order #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span>Loading orders...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order: any) => (
                                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-primary">{order.orderNumber}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {order.customerFirstName || order.customerLastName 
                                                    ? `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim()
                                                    : (order.buyer?.name || 'Guest Customer')}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{order.customerEmail || order.customerPhone || order.buyer?.email || ''}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-md font-medium text-foreground">
                                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                        <div className="text-xs text-muted-foreground">{order.createdAt ? format(new Date(order.createdAt), 'h:mm a') : ''}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        KES {Number(order.totalAmount).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="text-xs font-mono w-fit">
                                                {order.paymentMethod}
                                            </Badge>
                                            
                                            {order.mpesaReference ? (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded border border-border/40 w-fit" title="M-Pesa Reference">
                                                    <span className="font-semibold text-primary">#</span>
                                                    {order.mpesaReference}
                                                </div>
                                            ) : (
                                                order.status === 'PENDING' && order.paymentMethod === 'MPESA' && (
                                                     <span className="text-[10px] text-destructive font-semibold blink-animation">Verify Payment</span>
                                                )
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link to={`/admin/orders/${order.id}`} className="cursor-pointer flex items-center">
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                
                                                {/* Workflow Actions */}
                                                {order.status === 'PENDING' && (
                                                     <DropdownMenuItem onClick={() => initiateStatusChange(order, 'PAID')}>
                                                        <span className="text-green-600 font-semibold">Confirm Payment</span>
                                                     </DropdownMenuItem>
                                                )}
                                                {order.status === 'PAID' && (
                                                     <DropdownMenuItem onClick={() => initiateStatusChange(order, 'PROCESSING')}>
                                                        <span className="text-blue-600 font-semibold">Mark Processing</span>
                                                     </DropdownMenuItem>
                                                )}
                                                 {order.status === 'PROCESSING' && (
                                                      <DropdownMenuItem onClick={() => initiateStatusChange(order, 'FULFILLED')}>
                                                         <span className="text-blue-600 font-semibold">Mark Fulfilled</span>
                                                      </DropdownMenuItem>
                                                 )}
                                                 {order.status === 'FULFILLED' && (
                                                      <DropdownMenuItem onClick={() => initiateStatusChange(order, 'SHIPPED')}>
                                                         <span className="text-orange-600 font-semibold">Mark Shipped</span>
                                                      </DropdownMenuItem>
                                                 )}
                                                 {(order.status === 'SHIPPED' || order.status === 'FULFILLED') && (
                                                      <DropdownMenuItem onClick={() => initiateStatusChange(order, 'COMPLETED')}>
                                                         <span className="text-emerald-600 font-bold">Mark Completed</span>
                                                      </DropdownMenuItem>
                                                 )}
                                                {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                                                    <DropdownMenuItem onClick={() => initiateStatusChange(order, 'CANCELLED')}>
                                                        <span className="text-red-600">Cancel Order</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing {orders.length} orders
                </div>
                {/* Pagination (Simplified) */}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
            </div>

            {/* Payment Confirmation Dialog */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark Order <strong>#{selectedOrder?.orderNumber}</strong> as PAID?
                            <br/><br/>
                            Please verify the M-Pesa Reference Code below:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">M-Pesa Reference Code</label>
                        <Input 
                            value={verificationCode} 
                            onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                            placeholder="e.g. QKH45..."
                            className="font-mono uppercase tracking-widest"
                        />
                         <p className="text-xs text-muted-foreground mt-2">
                            Check your M-Pesa statement for this code to ensure payment was received.
                        </p>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmPayment(); }} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm Payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OrdersList;
