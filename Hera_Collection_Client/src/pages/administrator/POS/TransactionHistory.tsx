import React, { useState, useEffect } from 'react';
import posService from '@/api/pos.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const TransactionHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, []); // Reload when search changes if implemented server-side

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await posService.getTransactions({ limit: 50 }); // Fetch last 50
      // Assuming res.data contains the array
      setOrders(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o: any) => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    (o.customerFirstName && o.customerFirstName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
        <div className="w-[300px]">
          <Input 
            placeholder="Search by Order # or Customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                   <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                   No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</TableCell>
                  <TableCell>
                    {order.customerFirstName ? `${order.customerFirstName} ${order.customerLastName || ''}` : 'Walk-in Customer'}
                  </TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'PAID' || order.status === 'FULFILLED' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">KES {Number(order.totalAmount).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionHistory;
