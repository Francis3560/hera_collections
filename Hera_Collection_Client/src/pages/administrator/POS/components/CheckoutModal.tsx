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
  Check, Banknote, CreditCard, Phone, Loader2,
  Search, Info, CheckCircle
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
import Swal from 'sweetalert2';

// ── SweetAlert2 M-Pesa helpers (identical to CheckoutPage) ──────────────────
const mpesaSwal = Swal.mixin({
  background: '#0f172a',
  color: '#f1f5f9',
  confirmButtonColor: '#16a34a',
  cancelButtonColor: '#dc2626',
  customClass: {
    popup: 'mpesa-swal-popup',
    confirmButton: 'mpesa-swal-confirm',
    cancelButton: 'mpesa-swal-cancel',
  },
});

function showMpesaLoader(phone: string) {
  mpesaSwal.fire({
    title: '<span style="color:#4ade80">M-Pesa STK Push Sent</span>',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0">
        <div style="position:relative;width:80px;height:80px">
          <svg viewBox="0 0 80 80" style="position:absolute;top:0;left:0;animation:mpesaSpin 1.4s linear infinite" width="80" height="80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#16a34a" stroke-width="6" stroke-dasharray="160" stroke-dashoffset="40" stroke-linecap="round"/>
          </svg>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px">📱</div>
        </div>
        <p style="margin:0;font-size:15px;color:#94a3b8">Check <strong style="color:#f1f5f9">${phone}</strong> for the<br/>M-Pesa payment prompt</p>
        <p style="margin:0;font-size:12px;color:#64748b">Enter your M-Pesa PIN to confirm</p>
        <div id="mpesa-dots" style="display:flex;gap:6px;margin-top:4px">
          <span style="width:8px;height:8px;border-radius:50%;background:#16a34a;animation:mpesaBounce 1.2s ease-in-out 0s infinite"></span>
          <span style="width:8px;height:8px;border-radius:50%;background:#16a34a;animation:mpesaBounce 1.2s ease-in-out 0.2s infinite"></span>
          <span style="width:8px;height:8px;border-radius:50%;background:#16a34a;animation:mpesaBounce 1.2s ease-in-out 0.4s infinite"></span>
        </div>
      </div>
      <style>
        @keyframes mpesaSpin { to { transform: rotate(360deg); } }
        @keyframes mpesaBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
      </style>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: '✕ Cancel Payment',
  });
}

function closeMpesaLoader() {
  Swal.close();
}
// ─────────────────────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  items: any[];
  onConfirm: (data: any) => Promise<any>;
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
  const [paystackKey, setPaystackKey] = useState<string>("");

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const change = Number(cashTendered) - total;
  const isCashSufficient = paymentMethod !== 'CASH' || change >= 0;

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setCashTendered('');
      setLoading(false);
      setPaymentStatus('IDLE');
      setSuccessOrder(null);
      setCustomerSearch('');
      setSearchResults([]);
      setSelectedCustomer(null);
      setNoResults(false);
      setCustomer({ full_name: '', email: '', phone_number: '' });
      // Fetch Paystack key
      paymentService.getPaystackConfig()
        .then(cfg => { if (cfg.success && cfg.publicKey) setPaystackKey(cfg.publicKey); })
        .catch(console.error);
    }
  }, [isOpen]);

  // ── Paystack ───────────────────────────────────────────────────────────────
  const initializePayment = usePaystackPayment({
    reference: new Date().getTime().toString(),
    email: customer.email || 'customer@heracollection.com',
    amount: total * 100,
    publicKey: paystackKey || 'pk_test_d3e20e8d91c12e2c4cb71c841e0ff05e19bd8ff9',
    currency: 'KES',
    firstname: customer.full_name?.split(' ')[0] || '',
    lastname: customer.full_name?.split(' ').slice(1).join(' ') || '',
    phone: customer.phone_number
  });

  const onPaystackSuccess = async (reference: any) => {
    await finalizeCardCheckout(reference.reference);
  };

  const onPaystackClose = () => {
    setLoading(false);
    setPaymentStatus('IDLE');
    mpesaSwal.fire({
      icon: 'warning',
      title: '<span style="color:#facc15">Payment Cancelled</span>',
      html: '<p style="color:#94a3b8">You closed the payment window.<br/>The sale has not been completed.</p>',
      confirmButtonText: 'Try Again',
    });
  };

  // ── Customer helpers ───────────────────────────────────────────────────────
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
        console.error('Auto-customer creation failed', err);
      }
    }
    return userId;
  };

  // ── Polling (identical pattern to CheckoutPage) ────────────────────────────
  const pollPaymentStatus = (id: string) => {
    let attempts = 0;
    const maxAttempts = 24; // ~2 min at 5 s intervals

    const intervalId = setInterval(async () => {
      attempts++;
      try {
        const response = await paymentService.checkPaymentStatus(id);

        if (response.success && response.data.status === 'SUCCESS') {
          clearInterval(intervalId);
          closeMpesaLoader();
          setSuccessOrder(response.data.order);
          setPaymentStatus('SUCCESS');
          setLoading(false);
          if (onPaymentSuccess) await onPaymentSuccess();
          await mpesaSwal.fire({
            icon: 'success',
            title: '<span style="color:#4ade80">Payment Successful! 🎉</span>',
            html: `<p style="color:#94a3b8">M-Pesa payment confirmed.<br/>The order has been recorded successfully.</p>`,
            confirmButtonText: 'Done',
            showConfirmButton: true,
            timer: 4000,
            timerProgressBar: true,
          });
          onClose();
        } else if (response.data.status === 'FAILED') {
          clearInterval(intervalId);
          closeMpesaLoader();
          setPaymentStatus('FAILED');
          setLoading(false);
          const reason = response.data.failureReason || 'Payment was declined or cancelled.';
          const isCancelled = reason.toLowerCase().includes('cancel') || reason.toLowerCase().includes('user');
          mpesaSwal.fire({
            icon: isCancelled ? 'warning' : 'error',
            title: isCancelled
              ? '<span style="color:#facc15">Payment Cancelled</span>'
              : '<span style="color:#f87171">Payment Failed</span>',
            html: `<p style="color:#94a3b8">${reason}</p>`,
            confirmButtonText: 'Try Again',
            showCancelButton: true,
            cancelButtonText: 'Close',
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          closeMpesaLoader();
          setPaymentStatus('FAILED');
          setLoading(false);
          mpesaSwal.fire({
            icon: 'error',
            title: '<span style="color:#f87171">Payment Timed Out</span>',
            html: `<p style="color:#94a3b8">No confirmation received from M-Pesa.<br/>Check your M-Pesa messages and retry.</p>`,
            confirmButtonText: 'Try Again',
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
  };

  // ── M-Pesa submit ──────────────────────────────────────────────────────────
  const handleMpesaSubmit = async () => {
    if (!customer.phone_number) {
      mpesaSwal.fire({
        icon: 'warning',
        title: 'Phone Number Required',
        text: 'Please enter the customer M-Pesa phone number.',
        confirmButtonText: 'Got it',
      });
      return;
    }

    setLoading(true);
    setPaymentStatus('PENDING');

    try {
      const formattedPhone = customer.phone_number.replace('+', '');
      const userId = await getOrCreateCustomer();

      const paymentData = {
        items: items.map(item => ({
          productId: item.productId || null,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || '0'),
          variantName: item.variantName || item.title || null,
        })),
        customer: {
          full_name: customer.full_name,
          name: customer.full_name,
          email: customer.email || `${formattedPhone}@heracollection.com`,
          phone: formattedPhone,
          phone_number: formattedPhone,
          userId,
        },
        payment: { method: 'MPESA', phone: formattedPhone },
        amounts: { subtotal: total, total },
        isPos: true,
      };

      const response = await paymentService.startMpesaPayment(paymentData);

      if (response.success) {
        showMpesaLoader(customer.phone_number);
        pollPaymentStatus(response.data.checkoutRequestId);
      } else {
        throw new Error(response.message || 'Failed to initiate M-Pesa payment');
      }
    } catch (error: any) {
      console.error('M-Pesa error:', error);
      setPaymentStatus('FAILED');
      setLoading(false);
      mpesaSwal.fire({
        icon: 'error',
        title: '<span style="color:#f87171">M-Pesa Error</span>',
        html: `<p style="color:#94a3b8">${error.response?.data?.message || error.message || 'Could not initiate payment.'}</p>`,
        confirmButtonText: 'Try Again',
      });
    }
  };

  // ── Card (Paystack) paystack callback ──────────────────────────────────────
  const finalizeCardCheckout = async (paystackRef: string) => {
    try {
      const userId = await getOrCreateCustomer();
      const formattedPhone = customer.phone_number?.replace('+', '') || '';

      const order = await onConfirm({
        payment: {
          method: 'CARD',
          phone: formattedPhone,
          paystackReference: paystackRef,
        },
        customer: { ...customer, userId },
        shipping: null,
      });

      setSuccessOrder(order);
      setPaymentStatus('SUCCESS');
      setLoading(false);

      if (onPaymentSuccess) await onPaymentSuccess();
    } catch (err: any) {
      console.error('Card checkout error:', err);
      setLoading(false);
      setPaymentStatus('FAILED');
    }
  };

  // ── Cash submit ────────────────────────────────────────────────────────────
  const finalizeCheckout = async (paystackRef?: string) => {
    try {
      const userId = await getOrCreateCustomer();
      const order = await onConfirm({
        payment: {
          method: paymentMethod,
          phone: customer.phone_number?.replace('+', '') || '',
          paystackReference: paystackRef,
        },
        customer: { ...customer, userId },
        shipping: null,
      });
      
      setSuccessOrder(order);
      setPaymentStatus('SUCCESS');
      if (onPaymentSuccess) await onPaymentSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Main submit handler ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isCashSufficient) return;
    setLoading(true);

    if (paymentMethod === 'MPESA') {
      await handleMpesaSubmit();
      return;
    }

    if (paymentMethod === 'CARD') {
      initializePayment({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
      return;
    }

    // CASH
    await finalizeCheckout();
  };

  // ── Customer search ────────────────────────────────────────────────────────
  const searchCustomers = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length === 0) { setSearchResults([]); return; }
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
    if (customerSearch) searchCustomers(customerSearch);
    else setSearchResults([]);
  }, [customerSearch, searchCustomers]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchResults([]);
        setNoResults(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden rounded-3xl p-0">
        <DialogHeader className="p-6 bg-primary/5 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            POS Checkout
            <span className="text-primary">KES {total.toLocaleString()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="payment" className="rounded-xl">Payment Details</TabsTrigger>
              <TabsTrigger value="customer" className="rounded-xl">Customer Profile</TabsTrigger>
            </TabsList>

            {/* ── Payment Tab ── */}
            <TabsContent value="payment" className="space-y-6">
              {/* Method selector — 3 options: Cash, M-Pesa, Card */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={v => { setPaymentMethod(v); setPaymentStatus('IDLE'); }}
                  className="grid grid-cols-3 gap-3"
                >
                  {/* Cash */}
                  <div className="relative">
                    <RadioGroupItem value="CASH" id="pos-cash" className="peer sr-only" />
                    <Label
                      htmlFor="pos-cash"
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <Banknote className="mb-2 h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium">Cash</span>
                    </Label>
                  </div>

                  {/* M-Pesa */}
                  <div className="relative">
                    <RadioGroupItem value="MPESA" id="pos-mpesa" className="peer sr-only" />
                    <Label
                      htmlFor="pos-mpesa"
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

                  {/* Card */}
                  <div className="relative">
                    <RadioGroupItem value="CARD" id="pos-card" className="peer sr-only" />
                    <Label
                      htmlFor="pos-card"
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <CreditCard className="mb-2 h-6 w-6 text-blue-600" />
                      <span className="text-sm font-medium">Card</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Dynamic status panel */}
              <div className="min-h-[100px] flex items-center justify-center bg-secondary/20 rounded-2xl p-4 border border-border/50">

                {/* CASH — tendered / change */}
                {paymentStatus === 'IDLE' && paymentMethod === 'CASH' && (
                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pos-tendered">Cash Tendered</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KES</span>
                        <Input
                          id="pos-tendered"
                          type="number"
                          className="pl-12 rounded-xl text-lg font-bold"
                          placeholder="0.00"
                          value={cashTendered}
                          onChange={e => setCashTendered(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Change Due</Label>
                      <div className={cn(
                        "flex h-[42px] items-center px-4 rounded-xl border text-xl font-black",
                        change < 0 ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-600"
                      )}>
                        {change >= 0 ? `KES ${change.toLocaleString()}` : '-'}
                      </div>
                    </div>
                  </div>
                )}

                {/* MPESA — phone input */}
                {paymentStatus === 'IDLE' && paymentMethod === 'MPESA' && (
                  <div className="w-full space-y-3">
                    <Label className="text-sm font-medium">Customer M-Pesa Number</Label>
                    <PhoneInput
                      placeholder="e.g. 0712345678"
                      value={customer.phone_number}
                      onChange={value => setCustomer({ ...customer, phone_number: value || '' })}
                      defaultCountry="KE"
                      inputComponent={Input}
                      className="rounded-xl overflow-hidden"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">
                      An STK push will be sent to this number. The customer must enter their PIN to complete payment.
                    </p>
                  </div>
                )}

                {/* CARD — info */}
                {paymentStatus === 'IDLE' && paymentMethod === 'CARD' && (
                  <div className="text-center space-y-2 py-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-2">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-bold text-blue-700">Paystack Card Payment</p>
                    <p className="text-xs text-muted-foreground">
                      Click "Confirm Sale" to open the Paystack payment window.
                    </p>
                  </div>
                )}

                {/* MPESA — pending (waiting for SweetAlert2) */}
                {paymentStatus === 'PENDING' && paymentMethod === 'MPESA' && (
                  <div className="text-center animate-pulse py-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-bold text-primary text-lg">STK Push Sent!</p>
                    <p className="text-xs text-muted-foreground">Waiting for PIN entry on customer's phone…</p>
                  </div>
                )}

                {/* SUCCESS */}
                {paymentStatus === 'SUCCESS' && (
                  <div className="w-full bg-white dark:bg-zinc-950 py-4">
                    <OrderSuccessSplash
                      orderNumber={successOrder?.orderNumber}
                      isPos={true}
                      onContinue={async () => {
                        if (onPaymentSuccess) await onPaymentSuccess();
                        onClose();
                      }}
                    />
                  </div>
                )}

                {/* FAILED */}
                {paymentStatus === 'FAILED' && (
                  <div className="text-center py-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2">
                      <Info className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="font-bold text-red-600">Transaction Failed</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary underline"
                      onClick={() => setPaymentStatus('IDLE')}
                    >
                      Try again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Customer Tab ── */}
            <TabsContent value="customer" className="space-y-4">
              <div className="space-y-3 relative">
                <Label className="font-semibold">Search Existing Profile</Label>
                <div className="relative" ref={dropdownRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, phone or email..."
                    className="pl-9 rounded-xl"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
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
                    onChange={e => setCustomer({ ...customer, full_name: e.target.value })}
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
                      onChange={val => setCustomer({ ...customer, phone_number: val || '' })}
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
                      onChange={e => setCustomer({ ...customer, email: e.target.value })}
                      readOnly={!!selectedCustomer}
                      className={cn("rounded-xl", selectedCustomer && "bg-muted font-medium")}
                    />
                  </div>
                </div>
              </div>

              {selectedCustomer && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground h-8"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomer({ full_name: '', email: '', phone_number: '' });
                  }}
                >
                  Switch to another customer
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {paymentStatus !== 'SUCCESS' && (
          <DialogFooter className="p-6 bg-secondary/10 border-t flex sm:justify-between items-center gap-4">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
              Discard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isCashSufficient || paymentStatus === 'PENDING' || loading}
              className="rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-none"
            >
              {loading
                ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                : <CheckCircle className="mr-2 h-5 w-5" />}
              {paymentMethod === 'MPESA' ? 'Send STK Push' : paymentMethod === 'CARD' ? 'Pay with Card' : 'Confirm Sale'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
