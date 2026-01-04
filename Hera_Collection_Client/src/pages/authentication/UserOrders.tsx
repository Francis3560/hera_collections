import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderService from "@/api/order.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, ChevronRight, Clock, CheckCircle, Truck, XCircle, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const UserOrders = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await OrderService.getOrders({ search: searchTerm });
            setOrders(res.data || []);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING": return <Clock className="w-4 h-4" />;
            case "PAID": return <CheckCircle className="w-4 h-4" />;
            case "SHIPPED": return <Truck className="w-4 h-4" />;
            case "DELIVERED": return <CheckCircle className="w-4 h-4" />;
            case "CANCELLED": return <XCircle className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "PAID": return "bg-green-100 text-green-700 border-green-200";
            case "SHIPPED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Orders</h2>
                    <p className="text-muted-foreground">Manage and track your recent purchases</p>
                </div>
                <form onSubmit={handleSearch} className="flex w-full md:w-auto items-center gap-2">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Order number..."
                            className="pl-9 h-10 rounded-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </form>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden border-border/40">
                            <CardContent className="p-0">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                        <p className="text-muted-foreground mb-8 max-w-xs">
                            {searchTerm ? `We couldn't find any orders matching "${searchTerm}"` : "You haven't placed any orders yet."}
                        </p>
                        <Button asChild className="rounded-full px-8 h-12">
                            <Link to="/">Start Shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {orders.map((order) => (
                        <Card 
                            key={order.id} 
                            className="group overflow-hidden border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                        >
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{order.orderNumber}</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </Badge>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            KES {Number(order.totalAmount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase mb-1">Placed On</p>
                                                <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase mb-1">Items</p>
                                                <p className="text-sm font-medium">{order.items?.length || 0} Products</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase mb-1">Payment</p>
                                                <p className="text-sm font-medium">{order.paymentMethod}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase mb-1">Location</p>
                                                <p className="text-sm font-medium truncate max-w-[120px]">{order.shippingAddress || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-auto flex gap-2">
                                        <Button 
                                            variant="secondary" 
                                            className="flex-1 md:flex-none rounded-full"
                                            onClick={() => navigate(`/order-tracking/${order.orderNumber}`)}
                                        >
                                            Track Order
                                        </Button>
                                        <Button 
                                            className="flex-1 md:flex-none rounded-full group/btn"
                                            asChild
                                        >
                                           <Link to={`/order-tracking/${order.orderNumber}`}>
                                                Details
                                                <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                           </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Items Preview */}
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-border/40 flex items-center gap-3 overflow-x-auto no-scrollbar">
                                {order.items?.slice(0, 5).map((item: any) => (
                                    <div key={item.id} className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-border/40 bg-white">
                                        <img 
                                            src={item.product?.photos?.[0]?.url || "/placeholder.png"} 
                                            alt={item.product?.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {item.quantity > 1 && (
                                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                                {item.quantity}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {order.items?.length > 5 && (
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                        +{order.items.length - 5}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserOrders;
