import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Calendar, User, MapPin, CreditCard, Package, Truck, 
  CheckCircle2, XCircle, Clock, Printer, Mail, MoreVertical, Loader2
} from 'lucide-react';
import orderService from '@/api/order.service';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_BASE_URL } from '@/utils/axiosClient';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (id) fetchOrder(id);
    }, [id]);

    const fetchOrder = async (orderId) => {
        try {
            const res = await orderService.getOrderById(orderId);
            // The API returns { success: true, data: {...} }
            setOrder(res.data || res); 
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load order details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!order) return;
        setStatusUpdating(true);
        try {
            await orderService.updateOrderStatus(order.id, newStatus);
            // Refetch full order data to ensure relations/updated fields are current
            await fetchOrder(order.id); 
            toast({ title: "Success", description: `Order status updated to ${newStatus}` });
        } catch (error) {
           console.error(error);
           toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        } finally {
            setStatusUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'default'; // Purple
            case 'FULFILLED': return 'secondary';
            case 'PENDING': return 'outline'; // Yellow/Warn usually handled by specialized class or just outline
            case 'CANCELLED': return 'destructive';
            case 'SHIPPED': return 'default';
            default: return 'outline';
        }
    };

    if (loading) {
        return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
    }

    if (!order) {
        return <div className="p-10 text-center text-muted-foreground">Order not found</div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Order #{order.orderNumber}
                            <Badge variant={getStatusColor(order.status)} className="ml-2">
                                {order.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy - hh:mm a') : 'Date N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" disabled={statusUpdating}>
                            {statusUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Status <MoreVertical className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusUpdate('PENDING')}>
                            <Clock className="mr-2 h-4 w-4" /> Mark Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate('PAID')}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Mark Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate('FULFILLED')}>
                            <Package className="mr-2 h-4 w-4 text-blue-500" /> Mark Fulfilled (Processing)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate('SHIPPED')}>
                            <Truck className="mr-2 h-4 w-4 text-purple-500" /> Mark Shipped
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate('CANCELLED')}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Mark Cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="outline" size="icon" title="Print Invoice">
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Email Customer">
                        <Mail className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content - Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" /> Order Items ({order.items?.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="bg-card">
                                {order.items?.map((item, index) => {
                                    const photoUrl = item.product?.photos?.[0]?.url 
                                        ? `${API_BASE_URL}${item.product.photos[0].url}` 
                                        : null;
                                        
                                    return (
                                        <div key={item.id} className={`flex gap-4 p-4 ${index !== order.items.length - 1 ? 'border-b' : ''}`}>
                                            <div className="h-20 w-20 bg-muted rounded-md border overflow-hidden flex-shrink-0">
                                                {photoUrl ? (
                                                    <img src={photoUrl} alt={item.product?.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{item.product?.title || 'Unknown Product'}</h4>
                                                        {item.variantName && (
                                                            <div className="text-sm text-muted-foreground mt-0.5">
                                                                <Badge variant="outline" className="text-xs font-normal">
                                                                   {item.variantName}: {item.variantValue}
                                                                </Badge>
                                                                {item.variant?.sku && <span className="ml-2 font-mono text-xs">SKU: {item.variant.sku}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">KES {Number(item.price).toLocaleString()}</div>
                                                        <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex justify-between items-end">
                                                    <div></div>
                                                    <div className="font-bold text-lg text-primary">
                                                        KES {(item.price * item.quantity).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="bg-muted/20 p-4 border-t space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{order.currency || 'KES'} {Number(order.subtotalAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{order.currency || 'KES'} {Number(order.taxAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>
                                        {Number(order.shippingCost) > 0 
                                            ? `${order.currency || 'KES'} ${Number(order.shippingCost).toLocaleString()}` 
                                            : 'Free'}
                                    </span>
                                </div>
                                {Number(order.discountAmount) > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-{order.currency || 'KES'} {Number(order.discountAmount).toLocaleString()}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg text-foreground">
                                    <span>Total</span>
                                    <span className="text-primary">{order.currency || 'KES'} {Number(order.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Order Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {/* Simple timeline representation */}
                             <div className="relative pl-6 border-l-2 border-muted space-y-6">
                                <div className="relative">
                                    <div className={`absolute -left-[31px] h-4 w-4 rounded-full border-2 ${order.createdAt ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
                                    <div className="text-sm font-semibold">Order Placed</div>
                                    <div className="text-xs text-muted-foreground">{order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : '-'}</div>
                                </div>
                                <div className="relative">
                                    <div className={`absolute -left-[31px] h-4 w-4 rounded-full border-2 ${['PAID', 'FULFILLED', 'SHIPPED'].includes(order.status) ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
                                    <div className="text-sm font-semibold">Payment Confirmed</div>
                                    <div className="text-xs text-muted-foreground">{order.paidAt ? format(new Date(order.paidAt), 'MMM dd, HH:mm') : 'Pending'}</div>
                                </div>
                                <div className="relative">
                                    <div className={`absolute -left-[31px] h-4 w-4 rounded-full border-2 ${['FULFILLED', 'SHIPPED'].includes(order.status) ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
                                    <div className="text-sm font-semibold">Processing / Fulfilled</div>
                                </div>
                                 <div className="relative">
                                    <div className={`absolute -left-[31px] h-4 w-4 rounded-full border-2 ${['SHIPPED'].includes(order.status) ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
                                    <div className="text-sm font-semibold">Shipped</div>
                                    <div className="text-xs text-muted-foreground">{order.shippedAt ? format(new Date(order.shippedAt), 'MMM dd, HH:mm') : 'Pending'}</div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-md flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3 text-sm">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {order.customerFirstName ? order.customerFirstName[0]?.toUpperCase() : (order.buyer?.name?.[0].toUpperCase() || 'C')}
                                    {order.customerLastName ? order.customerLastName[0]?.toUpperCase() : ''}
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        {order.customerFirstName && order.customerLastName 
                                            ? `${order.customerFirstName} ${order.customerLastName}`
                                            : order.buyer?.name || 'Guest Customer'}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {order.customerEmail || order.buyer?.email || 'No email provided'}
                                    </div>
                                </div>
                             </div>
                             <Separator />
                             <div className="space-y-1">
                                 <div className="text-xs text-muted-foreground uppercase opacity-70">Contact Info</div>
                                 <div className="flex items-center gap-2">
                                     <Mail className="h-3 w-3" /> 
                                     {order.customerEmail || order.buyer?.email || 'N/A'}
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className="h-3 w-3 flex justify-center items-center font-bold">P</span>
                                     {order.customerPhone || order.buyer?.phone || 'N/A'}
                                 </div>
                             </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-md flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 text-sm space-y-1">
                            {order.shippingAddress || order.shippingCity || order.shippingCountry ? (
                                <>
                                   {order.shippingAddress && <div>{order.shippingAddress}</div>}
                                   {(order.shippingCity || order.shippingZipCode) && (
                                       <div>
                                           {order.shippingCity || ''}
                                           {order.shippingCity && order.shippingZipCode ? ', ' : ''}
                                           {order.shippingZipCode || ''}
                                       </div>
                                   )}
                                   {order.shippingCountry && <div>{order.shippingCountry}</div>}
                                </>
                            ) : (
                                <div className="text-muted-foreground italic">No shipping address provided</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-md flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" /> Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Method:</span>
                                <span className="font-semibold">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Payment Status:</span>
                                <Badge variant={order.status === 'PAID' || order.paidAt ? "default" : "outline"} className="">
                                    {order.status === 'PAID' || order.paidAt ? 'Paid' : 'Unpaid'}
                                </Badge>
                            </div>
                             {order.paymentIntentId && (
                                <div className="text-xs text-muted-foreground break-all mt-1">
                                    ID: {order.paymentIntentId}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default OrderDetails;
