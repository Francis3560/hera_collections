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

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

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

    const getStatusVariant = (status) => {
        switch (status) {
            case 'PAID': return 'default'; // Using default (purple) for PAID
            case 'FULFILLED': return 'secondary';
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
                {/* <Button className="bg-primary hover:bg-primary/90">Create Order</Button> */}
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
                     <option value="FULFILLED">Fulfilled</option>
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
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {order.paymentMethod}
                                            </Badge>
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
                                                {/* Add more actions if needed */}
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
        </div>
    );
};

export default OrdersList;
