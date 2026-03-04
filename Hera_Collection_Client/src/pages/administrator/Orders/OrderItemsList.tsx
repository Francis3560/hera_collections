import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import orderService from '@/api/order.service';
import { Search, Loader2, Package } from 'lucide-react';
import { format } from "date-fns";
import { Link } from 'react-router-dom';

const OrderItemsList = () => {
    const [items, setItems] = useState<any[]>([]);
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
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Order Items
                    </h1>
                    <p className="text-muted-foreground mt-1">Detailed list of individual products sold</p>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by product name..."
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
                            <TableHead>Order #</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Item Total</TableHead>
                            <TableHead className="text-right">Order Total</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span>Loading items...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-7 w-7 opacity-30" />
                                        No order items found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item: any) => (
                                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">

                                    {/* Order # */}
                                    <TableCell>
                                        <Link
                                            to={`/admin/orders/${item.order?.id || item.orderId}`}
                                            className="text-primary hover:underline font-semibold text-sm"
                                        >
                                            #{item.order?.orderNumber}
                                        </Link>
                                        {item.order?.mpesaReference && (
                                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5 bg-secondary/30 px-1 rounded w-fit">
                                                {item.order.mpesaReference}
                                            </div>
                                        )}
                                    </TableCell>

                                    {/* Product */}
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm">{item.product?.title || 'Unknown Product'}</span>
                                            {item.product?.category?.name && (
                                                <span className="text-[11px] text-muted-foreground">{item.product.category.name}</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Variant */}
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {item.variantName ? (
                                                <Badge variant="outline" className="text-xs w-fit font-normal">
                                                    {item.variantName}: <span className="font-semibold ml-1">{item.variantValue}</span>
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                            {item.variant?.sku && (
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    SKU: {item.variant.sku}
                                                </span>
                                            )}
                                            {item.variant?.color && (
                                                <span className="text-[10px] text-muted-foreground">Color: {item.variant.color}</span>
                                            )}
                                            {item.variant?.size && (
                                                <span className="text-[10px] text-muted-foreground">Size: {item.variant.size}</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Quantity */}
                                    <TableCell className="text-center font-bold font-mono">
                                        {item.quantity}
                                    </TableCell>

                                    {/* Unit Price */}
                                    <TableCell className="text-right font-mono text-sm">
                                        KES {Number(item.price).toLocaleString()}
                                    </TableCell>

                                    {/* Item Total */}
                                    <TableCell className="text-right font-semibold text-sm text-primary">
                                        KES {Number(item.total || item.price * item.quantity).toLocaleString()}
                                    </TableCell>

                                    {/* Order Total */}
                                    <TableCell className="text-right font-bold text-sm">
                                        KES {Number(item.order?.totalAmount || 0).toLocaleString()}
                                    </TableCell>

                                    {/* Date */}
                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                        {item.createdAt ? (
                                            <>
                                                <div>{format(new Date(item.createdAt), 'MMM dd, yyyy')}</div>
                                                <div className="text-[11px]">{format(new Date(item.createdAt), 'hh:mm a')}</div>
                                            </>
                                        ) : '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-sm text-muted-foreground px-1">
                Showing {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default OrderItemsList;
