import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import orderService from '@/api/order.service';
import { Search, Loader2 } from 'lucide-react';
import { format } from "date-fns";
import { Link } from 'react-router-dom';

const OrderItemsList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrderItems();
    }, [search]);

    const fetchOrderItems = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            
            const res = await orderService.getOrderItems(params);
            setItems(res.items || res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Order Items</h1>
                    <p className="text-muted-foreground mt-1">Detailed list of individual products sold</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items by product name..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[100px]">Order #</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span>Loading items...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No order items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item: any) => (
                                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <Link to={`/admin/orders/${item.orderId}`} className="text-primary hover:underline font-medium">
                                            #{item.order?.orderNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.product?.title || 'Unknown Product'}
                                    </TableCell>
                                    <TableCell>
                                        {item.variantName ? (
                                            <Badge variant="outline" className="text-xs">
                                                {item.variantName}: {item.variantValue}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                    <TableCell>KES {Number(item.price).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold">KES {Number(item.total).toLocaleString()}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing {items.length} items
                </div>
            </div>
        </div>
    );
};

export default OrderItemsList;
