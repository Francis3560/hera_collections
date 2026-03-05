import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
    Check, Banknote, CreditCard, Phone, User, Loader2, 
    Search, UserPlus, Info, CheckCircle 
} from 'lucide-react';
import 'react-phone-number-input/style.css';
import '@/components/ui/phone-input.css';
import PhoneInput from 'react-phone-number-input';
import { cn } from '@/lib/utils';
import customerService from '@/api/customer.service';
import paymentService from '@/api/payment.service';
import { debounce } from 'lodash';
import { OrderSuccessSplash } from '@/components/shared/OrderSuccessSplash';
import { useAuth } from '@/context/AuthContext';
import { usePaystackPayment } from 'react-paystack';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  items: any[];
  onConfirm: (data: any) => Promise<void>;
  onPaymentSuccess?: () => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  total, 
  items,
  onConfirm,
  onPaymentSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "FAILED">("IDLE");
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  
  const { role: currentUserRole } = useAuth();
  
  // Customer info
  const [customer, setCustomer] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [paystackKey, setPaystackKey] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const change = Number(cashTendered) - total;
  const isCashSufficient = paymentMethod !== 'CASH' || change >= 0;

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setCashTendered('');
      setLoading(false);
      setPaymentStatus('IDLE');
      setCheckoutId(null);
      setCustomerSearch('');
      setSearchResults([]);
      setSelectedCustomer(null);
      setNoResults(false);
      setCustomer({
        full_name: '',
        email: '',
        phone_number: ''
      });
      fetchPaystackConfig();
    }
  }, [isOpen]);

  const fetchPaystackConfig = async () => {
    try {
      const config = await paymentService.getPaystackConfig();
      if (config.success && config.publicKey) {
        setPaystackKey(config.publicKey);
      }
    } catch (error) {
      console.error("Failed to fetch Paystack config", error);
    }
  };

  const initializePayment = usePaystackPayment({
    reference: new Date().getTime().toString(),
    email: customer.email || "customer@example.com",
    amount: total * 100,
    publicKey: paystackKey || 'pk_test_d3e20e8d91c12e2c4cb71c841e0ff05e19bd8ff9', 
    currency: 'KES',
    firstname: customer.full_name?.split(" ")[0] || "",
    lastname: customer.full_name?.split(" ").slice(1).join(" ") || "",
    phone: customer.phone_number
  });

  const onPaystackSuccess = async (reference: any) => {
    await finalizeCheckout(reference.reference);
  };

  const onPaystackClose = () => {
    setLoading(false);
    toast.error("Payment was cancelled.");
  };

  const pollPaymentStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 30; // ~2.5 minutes total (5s intervals)
    
    const intervalId = setInterval(async () => {
      attempts++;
      try {
        const response = await paymentService.checkPaymentStatus(id);
        if (response.success && response.data.status === "SUCCESS") {
          clearInterval(intervalId);
          setSuccessOrder(response.data.order);
          setPaymentStatus("SUCCESS");
          setLoading(false);
        } else if (response.data.status === "FAILED" || attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPaymentStatus("FAILED");
          setLoading(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000); 
  };

  const getOrCreateCustomer = async () => {
    let userId = selectedCustomer?.id;
    if (!userId && customer.full_name && customer.phone_number) {
      try {
        const res = await customerService.createCustomer({
          full_name: customer.full_name,
          email: customer.email || `${customer.phone_number.replace('+', '')}@heracollection.com`,
          phone_number: customer.phone_number,
          password: 'User@' + Math.random().toString(36).slice(-8),
          isVerified: currentUserRole === 'ADMIN',
          role: 'USER'
        });
        userId = res.id || res.user?.id;
      } catch (err) {
        console.error("Auto-customer creation failed", err);
      }
    }
    return userId;
  };

  const finalizeCheckout = async (paystackRef?: string) => {
    try {
        const userId = await getOrCreateCustomer();

        await onConfirm({
          payment: {
            method: paymentMethod,
            phone: customer.phone_number,
            paystackReference: paystackRef
          },
          customer: {
            ...customer,
            userId
          },
          shipping: null
        });
        onClose();
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  // Click away listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setNoResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      setNoResults(false);
      try {
        const res = await customerService.getCustomers({ search: query.trim() });
        const results = Array.isArray(res) ? res : (res.items || res.data || []);
        setSearchResults(results);
        setNoResults(results.length === 0);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (customerSearch) {
      searchCustomers(customerSearch);
    } else {
      setSearchResults([]);
    }
  }, [customerSearch, searchCustomers]);

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setCustomer({
      full_name: c.name || c.full_name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      email: c.email || '',
      phone_number: c.phone || c.phone_number || ''
    });
    setCustomerSearch('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!isCashSufficient) return;
    
    setLoading(true);

    if (paymentMethod === 'MPESA') {
        if (!customer.phone_number) {
            setLoading(false);
            return;
        }

        try {
            const formattedPhone = customer.phone_number.replace('+', '');
            const userId = await getOrCreateCustomer();
            
            const paymentData = {
                items: items.map(item => ({
                    productId: item.productId || null,
                    variantId: item.variantId || null,
                    quantity: item.quantity,
                    price: item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || "0"),
                    variantName: item.variantName || item.title || null
                })),
                customer: {
                  full_name: customer.full_name,
                  name: customer.full_name,
                  email: customer.email || `${formattedPhone}@heracollection.com`,
                  phone_number: formattedPhone,
                  userId 
                },
                payment: {
                    method: "MPESA",
                    phone: formattedPhone
                },
                amounts: {
                    subtotal: total,
                    total: total
                },
                isPos: true 
            };

            setPaymentStatus("PENDING");
            const response = await paymentService.startMpesaPayment(paymentData);
            
            if (response.success) {
                setCheckoutId(response.data.checkoutRequestId);
                pollPaymentStatus(response.data.checkoutRequestId);
            } else {
                throw new Error(response.message || "Failed to initiate payment");
            }
            return; 
        } catch (error: any) {
            console.error("M-Pesa initiation failed:", error);
            setPaymentStatus("FAILED");
            setLoading(false);
            return;
        }
    }

    if (paymentMethod === 'CARD') {
        initializePayment({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
        return;
    }

    // For CASH or other immediate methods
    await finalizeCheckout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden rounded-3xl p-0">
        <DialogHeader className="p-6 bg-primary/5 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
             POS Checkout
             <span className="text-primary">KES {total.toLocaleString()}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="payment" className="rounded-xl">Payment Details</TabsTrigger>
              <TabsTrigger value="customer" className="rounded-xl">Customer Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payment" className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="relative">
                      <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
                      <Label
                        htmlFor="cash"
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <Banknote className="mb-2 h-6 w-6 text-green-600" />
                        <span className="text-sm font-medium">Cash</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="MPESA" id="mpesa" className="peer sr-only" />
                      <Label
                        htmlFor="mpesa"
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg"
                          alt="M-PESA"
                          className="h-6 mb-2 object-contain"
                        />
                        <span className="text-sm font-medium">M-Pesa</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="CARD" id="card" className="peer sr-only" />
                      <Label
                        htmlFor="card"
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <CreditCard className="mb-2 h-6 w-6 text-blue-600" />
                        <span className="text-sm font-medium">Card</span>
                      </Label>
                    </div>
                    <div className="relative opacity-50 cursor-not-allowed">
                       <Label
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-muted/20 p-4 h-full text-center"
                      >
                        <Info className="mb-2 h-6 w-6" />
                        <span className="text-[10px] leading-tight font-medium">Bank Trans (Soon)</span>
                      </Label>
                    </div>
                </RadioGroup>
              </div>

              {/* Dynamic Status Display */}
              <div className="min-h-[100px] flex items-center justify-center bg-secondary/20 rounded-2xl p-4 border border-border/50">
                {paymentStatus === 'IDLE' && paymentMethod === 'CASH' && (
                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tendered">Cash Tendered</Label>
                        <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KES</span>
                           <Input 
                            id="tendered" 
                            type="number" 
                            className="pl-12 rounded-xl text-lg font-bold"
                            placeholder="0.00" 
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            autoFocus
                           />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Change Due</Label>
                        <div className={cn("flex h-[42px] items-center px-4 rounded-xl border text-xl font-black", 
                          change < 0 ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-600"
                        )}>
                          {change >= 0 ? `KES ${change.toLocaleString()}` : '-'}
                        </div>
                    </div>
                  </div>
                )}

                {paymentStatus === 'IDLE' && paymentMethod === 'MPESA' && (
                  <div className="w-full space-y-3">
                    <Label className="text-sm font-medium">Customer M-Pesa Number</Label>
                    <PhoneInput
                      placeholder="e.g. 0712345678"
                      value={customer.phone_number}
                      onChange={(value) => setCustomer({...customer, phone_number: value || ''})}
                      defaultCountry="KE"
                      inputComponent={Input}
                      className="rounded-xl overflow-hidden"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">STK push will be sent to this number for confirmation.</p>
                  </div>
                )}

                {paymentStatus === 'PENDING' && (
                  <div className="text-center animate-pulse py-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                       <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-bold text-primary text-lg">STK Push Sent!</p>
                    <p className="text-xs text-muted-foreground">Waiting for PIN entry on customer's phone...</p>
                  </div>
                )}

                {paymentStatus === 'SUCCESS' && (
                  <div className="w-full bg-white dark:bg-zinc-950 py-4">
                     <OrderSuccessSplash 
                        orderNumber={successOrder?.orderNumber} 
                        isPos={true}
                        onContinue={async () => {
                           if (onPaymentSuccess) {
                              await onPaymentSuccess();
                           } else {
                              await finalizeCheckout();
                           }
                        }}
                     />
                  </div>
                )}

                {paymentStatus === 'FAILED' && (
                  <div className="text-center py-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                       <Info className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="font-bold text-red-600">Transaction Failed</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary underline" onClick={() => setPaymentStatus('IDLE')}>Try again</Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="customer" className="space-y-4">
              <div className="space-y-3 relative">
                <Label className="font-semibold">Search Existing Profile</Label>
                <div className="relative" ref={dropdownRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Name, phone or email..." 
                      className="pl-9 rounded-xl"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}

                    {(searchResults.length > 0 || noResults) && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white dark:bg-zinc-950 border rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200 border-primary/20">
                         {searchResults.map(c => (
                            <div 
                              key={c.id} 
                              className="p-3 hover:bg-primary/5 cursor-pointer border-b last:border-0 flex items-center justify-between group"
                              onClick={() => handleSelectCustomer(c)}
                            >
                               <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                     {(c.name || c.full_name || c.firstName)?.[0] || 'U'}
                                  </div>
                                  <div className="min-w-0">
                                     <p className="font-bold text-sm truncate">{c.name || c.full_name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}</p>
                                     <p className="text-[10px] text-muted-foreground">{c.phone || c.phone_number}</p>
                                  </div>
                               </div>
                               <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                            </div>
                         ))}
                         {noResults && (
                            <div className="p-8 text-center text-muted-foreground">
                               <p className="text-sm font-medium">No results for "{customerSearch}"</p>
                            </div>
                         )}
                      </div>
                    )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="John Doe"
                    value={customer.full_name}
                    onChange={(e) => setCustomer({...customer, full_name: e.target.value})}
                    readOnly={!!selectedCustomer}
                    className={cn("rounded-xl", selectedCustomer && "bg-muted font-medium")}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Phone Number</Label>
                     <PhoneInput 
                        placeholder="Enter phone..."
                        value={customer.phone_number}
                        onChange={(val) => setCustomer({...customer, phone_number: val || ''})}
                        defaultCountry="KE"
                        inputComponent={Input}
                        readOnly={!!selectedCustomer}
                        className={cn("rounded-xl", selectedCustomer && "bg-muted font-medium")}
                      />
                  </div>
                  <div className="space-y-2">
                     <Label>Email Address</Label>
                     <Input 
                      type="email"
                      placeholder="customer@example.com"
                      value={customer.email}
                      onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      readOnly={!!selectedCustomer}
                      className={cn("rounded-xl", selectedCustomer && "bg-muted font-medium")}
                    />
                  </div>
                </div>
              </div>

              {selectedCustomer && (
                 <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8" onClick={() => {
                    setSelectedCustomer(null);
                    setCustomer({full_name: '', email: '', phone_number: ''});
                 }}>
                    Switch to another customer
                 </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {paymentStatus !== 'SUCCESS' && (
          <DialogFooter className="p-6 bg-secondary/10 border-t flex sm:justify-between items-center gap-4">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">Discard</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isCashSufficient || paymentStatus === 'PENDING' || loading}
              className="rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-none"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
              Confirm Sale
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
