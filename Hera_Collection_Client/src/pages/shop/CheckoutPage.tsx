import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Truck, User, ArrowLeft, Loader2, CheckCircle2, Search, Check, Info, MapPin, Navigation, AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import PaymentService from "@/api/payment.service";
import orderService from "@/api/order.service";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { toast } from "sonner";
import Swal from "sweetalert2";

// ── SweetAlert2 M-Pesa helpers ──────────────────────────────────────────────
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
    didOpen: () => { /* loader is shown via CSS */ },
  });
}

function closeMpesaLoader() {
  Swal.close();
}
// ─────────────────────────────────────────────────────────────────────────────
import 'react-phone-number-input/style.css';
import '@/components/ui/phone-input.css';
import PhoneInput from 'react-phone-number-input';
import customerService from "@/api/customer.service";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { OrderSuccessSplash } from "@/components/shared/OrderSuccessSplash";
import { motion, AnimatePresence } from "framer-motion";
import ShippingService from "@/api/shipping.service";
import { usePaystackPayment } from 'react-paystack';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, total, cartCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "FAILED">("IDLE");
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CARD" | "BANK">("MPESA");

  // Admin Search State
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'ADMIN';
  const [locationLoading, setLocationLoading] = useState(false);
  const [shippingRegions, setShippingRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [openShipping, setOpenShipping] = useState(false);
  const [paystackKey, setPaystackKey] = useState<string>("");

  const calculatedTotal = items.reduce((sum: number, item: any) => {
    const price = item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || "0");
    return sum + (price * item.quantity);
  }, 0);

  const displayTotal = calculatedTotal || total;

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    governorate: "Nairobi", // Default
    notes: "",
  });

  // Fetch Paystack configuration
  useEffect(() => {
    const fetchPaystackConfig = async () => {
      try {
        const config = await PaymentService.getPaystackConfig();
        if (config.success && config.publicKey) {
          setPaystackKey(config.publicKey);
        }
      } catch (error) {
        console.error("Failed to fetch Paystack config", error);
      }
    };
    fetchPaystackConfig();
  }, []);

  // Scroll to top on success
  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [paymentStatus]);

  useEffect(() => {
    const fetchShippingRegions = async () => {
      try {
        const data = await ShippingService.getAllRegions({ isActive: true });
        setShippingRegions(data);
        if (data.length > 0) {
          // If city matches an existing region, auto-select it?
          // For now just keep it empty to force choice
        }
      } catch (error) {
        console.error("Failed to fetch shipping regions", error);
      }
    };
    fetchShippingRegions();
  }, []);

  const FREE_SHIPPING_THRESHOLD = 5500;
  const isFreeShipping = displayTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = (selectedRegion && !isFreeShipping) ? parseFloat(selectedRegion.fee) : 0;
  const grandTotal = displayTotal + shippingFee;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - displayTotal;
  const freeShippingProgress = Math.min((displayTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const initializePayment = usePaystackPayment({
    reference: new Date().getTime().toString(),
    email: formData.email || user?.email || "customer@example.com",
    amount: grandTotal * 100, // Amount in KES cents
    publicKey: paystackKey || 'pk_test_d3e20e8d91c12e2c4cb71c841e0ff05e19bd8ff9', // Fallback to test key if not loaded yet
    currency: 'KES',
    firstname: formData.firstName,
    lastname: formData.lastName,
    phone: formData.phone
  });


  const onPaystackSuccess = async (reference: any) => {
    await submitOrder("CARD", reference.reference);
  };

  const onPaystackClose = () => {
    setLoading(false);
    setPaymentStatus("IDLE");
    mpesaSwal.fire({
      icon: 'warning',
      title: '<span style="color:#facc15">Payment Cancelled</span>',
      html: '<p style="color:#94a3b8">You closed the payment window.<br/>Your order has not been placed.</p>',
      confirmButtonText: 'Try Again',
    });
  };

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
        const items = Array.isArray(res) ? res : (res.items || res.data || []);
        setSearchResults(items);
        setNoResults(items.length === 0);
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
      setNoResults(false);
    }
  }, [customerSearch, searchCustomers]);

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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Using Nominatim for a free reverse geocoding service
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data) {
            const addr = data.address || {};
            const road = addr.road || "";
            const house = addr.house_number || "";
            const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || "";
            const city = addr.city || addr.town || addr.village || "";
            const state = addr.state || addr.region || "";
            
            // Construct a cleaner detailed address string
            const shortAddress = [house, road, neighborhood].filter(Boolean).join(", ");
            
            setFormData(prev => ({
              ...prev,
              address: shortAddress || data.display_name,
              city: city || prev.city,
              governorate: state || prev.governorate
            }));
            toast.success("Location updated!");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Failed to retrieve detailed address");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        console.error("Geolocation error:", error);
        toast.error("Could not access your location");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    
    let fName = c.firstName || '';
    let lName = c.lastName || '';
    
    if (!fName && c.name) {
      const parts = c.name.split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    setFormData({
      ...formData,
      firstName: fName,
      lastName: lName,
      email: c.email || '',
      phone: c.phone || ''
    });
    setCustomerSearch('');
    setSearchResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require phone for M-Pesa STK Push
    if (paymentMethod === "MPESA" && !formData.phone) {
      mpesaSwal.fire({
        icon: 'warning',
        title: 'Phone Number Required',
        text: 'Please enter your M-Pesa phone number to proceed.',
        confirmButtonText: 'Got it',
      });
      return;
    }

    // Only require selecting a region if free shipping hasn't been unlocked
    if (!selectedRegion && !isFreeShipping) {
      toast.error("Please select a shipping plan for delivery.");
      const element = document.getElementById("shipping-destination");
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setPaymentStatus("PENDING");

    if (paymentMethod === "CARD") {
      initializePayment({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
    } else {
      await submitOrder("MPESA");
    }
  };

  const submitOrder = async (method: "MPESA" | "CARD", paymentRef?: string) => {
    try {
      // Format phone: remove + if present
      const formattedPhone = formData.phone ? formData.phone.replace('+', '') : '';

      // 1. Initiate M-Pesa STK Push
      if (method === "MPESA") {
        const paymentData = {
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || "0")
          })),
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formattedPhone
          },
          shipping: {
            address: formData.address,
            city: formData.city,
            governorate: formData.governorate,
            notes: formData.notes
          },
          payment: {
              method: "MPESA",
              phone: formattedPhone
          },
          amounts: {
              subtotal: displayTotal,
              shipping: shippingFee,
              total: grandTotal
          }
        };

        const response = await PaymentService.startMpesaPayment(paymentData);
        
        if (response.success) {
          setCheckoutId(response.data.checkoutRequestId);
          // Show the animated SweetAlert2 loader
          const displayPhone = formData.phone || formattedPhone;
          showMpesaLoader(displayPhone);
          
          // 2. Start polling for payment status
          pollPaymentStatus(response.data.checkoutRequestId);
          return; // Exit and wait for polling
        } else {
          throw new Error(response.message || "Failed to initiate payment");
        }
      }
      
      // 3. Card Payment Logic (Called after Paystack success)
       const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || "0")
        })),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formattedPhone
        },
        shipping: {
          address: formData.address,
          city: formData.city,
          governorate: formData.governorate,
          notes: formData.notes
        },
        payment: {
            method: method,
            paystackReference: paymentRef,
            phone: formattedPhone
        },
        amounts: {
            subtotal: displayTotal,
            shipping: shippingFee,
            total: grandTotal
        }
      };
      
      const response = await orderService.createOrder(orderData);
      
      if (response && response.success) {
          setSuccessOrder(response.order);
          setPaymentStatus("SUCCESS");
          setLoading(false);
          clearCart();
          // Show the same quality success modal as M-Pesa
          await mpesaSwal.fire({
            icon: 'success',
            title: '<span style="color:#4ade80">Payment Successful! 🎉</span>',
            html: `<p style="color:#94a3b8">Your card payment was confirmed by Paystack.<br/>Your order has been placed successfully.</p>`,
            confirmButtonText: 'View My Order',
            showConfirmButton: true,
            timer: 4000,
            timerProgressBar: true,
          });
      } else {
          throw new Error(response.message || "Failed to create order");
      }

    } catch (error: any) {
      console.error("Checkout failed:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
      setLoading(false);
      setPaymentStatus("FAILED");
    }
  };

  const pollPaymentStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 24; // ~2 minutes total (5s intervals)
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await PaymentService.checkPaymentStatus(id);
        if (response.success && response.data.status === "SUCCESS") {
          clearInterval(interval);
          closeMpesaLoader();
          setSuccessOrder(response.data.order);
          setPaymentStatus("SUCCESS");
          setLoading(false);
          clearCart();
          // Success modal
          await mpesaSwal.fire({
            icon: 'success',
            title: '<span style="color:#4ade80">Payment Successful! 🎉</span>',
            html: `<p style="color:#94a3b8">Your M-Pesa payment was confirmed.<br/>Your order has been placed successfully.</p>`,
            confirmButtonText: 'View My Order',
            showConfirmButton: true,
            timer: 4000,
            timerProgressBar: true,
          });
        } else if (response.data.status === "FAILED") {
          clearInterval(interval);
          closeMpesaLoader();
          setPaymentStatus("FAILED");
          setLoading(false);
          const reason = response.data.failureReason || 'Payment was declined or cancelled.';
          // Check if user cancelled vs actual failure
          const isCancelled = reason.toLowerCase().includes('cancel') || reason.toLowerCase().includes('user');
          mpesaSwal.fire({
            icon: isCancelled ? 'warning' : 'error',
            title: isCancelled
              ? '<span style="color:#facc15">Payment Cancelled</span>'
              : '<span style="color:#f87171">Payment Failed</span>',
            html: `<p style="color:#94a3b8">${reason}</p><p style="font-size:13px;color:#64748b;margin-top:8px">You can try again from the checkout page.</p>`,
            confirmButtonText: 'Try Again',
            showCancelButton: true,
            cancelButtonText: 'Go Back',
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          closeMpesaLoader();
          setPaymentStatus("FAILED");
          setLoading(false);
          mpesaSwal.fire({
            icon: 'error',
            title: '<span style="color:#f87171">Payment Timed Out</span>',
            html: `<p style="color:#94a3b8">We did not receive a confirmation from M-Pesa.<br/>Please check your M-Pesa messages and try again.</p>`,
            confirmButtonText: 'Try Again',
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000); // Poll every 5 seconds (24 attempts = ~2 minutes)
  };

  if (paymentStatus === "SUCCESS") {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="py-20">
              <OrderSuccessSplash 
                orderNumber={successOrder?.orderNumber} 
              />
            </div>
            <Footer />
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 lg:py-16">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
          
          {/* Main Checkout Form */}
          <div className="flex-1">
            <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to cart
            </Link>
            
            <h1 className="text-3xl font-light mb-8">Secure <span className="font-semibold">Checkout</span></h1>
            
            {/* Admin Customer Search */}
            {isAdmin && (
               <div className="mb-10 bg-primary/5 rounded-3xl p-8 border border-primary/10 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Order for Customer</h2>
                      <p className="text-xs text-muted-foreground">Search and select a customer to populate their details.</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative flex-1" ref={dropdownRef}>
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Search by name, phone or email..." 
                        className="pl-12 py-7 rounded-2xl bg-transparent border-primary/20 focus:border-primary shadow-sm"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      {searching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
                      )}

                      {/* Search Results Dropdown */}
                      {(searchResults.length > 0 || noResults) && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white dark:bg-zinc-950 border rounded-2xl shadow-2xl max-h-80 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-200">
                          {searchResults.length > 0 ? (
                            searchResults.map(c => (
                              <div 
                                key={c.id} 
                                className="p-4 hover:bg-muted cursor-pointer border-b last:border-0 flex items-center justify-between group transition-colors"
                                onClick={() => handleSelectCustomer(c)}
                              >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                      {(c.name || c.firstName)?.[0] || 'U'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-base tracking-tight">{c.name || `${c.firstName} ${c.lastName}`}</div>
                                      <div className="text-xs text-muted-foreground">{c.phone} | {c.email}</div>
                                    </div>
                                </div>
                                <Check className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100" />
                              </div>
                            ))
                          ) : noResults && (
                            <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
                               <Info className="h-10 w-10 opacity-20" />
                               <p className="text-base font-medium">No customers found for "<span className="text-foreground">{customerSearch}</span>"</p>
                               <p className="text-xs">You can still enter their details manually below.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedCustomer && (
                      <div className="mt-4 flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-left-2">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Selected: <span className="font-bold">{selectedCustomer.name || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}</span></span>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setFormData({
                                ...formData,
                                firstName: user?.name?.split(" ")[0] || "",
                                lastName: user?.name?.split(" ").slice(1).join(" ") || "",
                                email: user?.email || "",
                                phone: user?.phone || "",
                              });
                            }}
                          >
                            Clear
                         </Button>
                      </div>
                    )}
                  </div>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Shipping Address */}
              <section className="bg-background rounded-3xl p-8 shadow-sm border border-border/40">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} required className="rounded-xl" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="address">Detailed Address</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleGetCurrentLocation}
                        disabled={locationLoading}
                        className="text-xs text-primary h-7 gap-1.5 rounded-full hover:bg-primary/10"
                      >
                        {locationLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Navigation className="w-3 h-3" />
                        )}
                        Use Current Location
                      </Button>
                    </div>
                    <div className="relative">
                      <Input 
                        id="address" 
                        placeholder="Street name, Building, Apartment No." 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        required 
                        className="rounded-xl pr-10" 
                      />
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City / Area</Label>
                    <Input id="city" value={formData.city} onChange={handleInputChange} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="governorate">County</Label>
                    <Input id="governorate" value={formData.governorate} onChange={handleInputChange} required className="rounded-xl" />
                  </div>

                  <div id="shipping-destination" className="md:col-span-2 space-y-4 pt-4 border-t border-border/40 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <Label className="text-lg font-semibold">Shipping Destination</Label>
                    </div>

                    <Popover open={openShipping} onOpenChange={setOpenShipping}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={openShipping}
                          className="w-full justify-between h-auto py-5 px-6 rounded-2xl border-2 bg-transparent transition-all shadow-sm group"
                        >
                          {selectedRegion ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-bold text-base tracking-tight">{selectedRegion.name}</span>
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[10px] text-black dark:text-white font-bold uppercase tracking-wider">{selectedRegion.estimatedDays || "Standard delivery time"}</span>
                                {selectedRegion.description && (
                                  <span className="text-[10px] text-muted-foreground font-medium leading-relaxed">{selectedRegion.description}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground italic">
                              <Search className="w-4 h-4 opacity-50" />
                              <span>Search your city or area...</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            {selectedRegion && (
                               <div className="flex flex-col items-end">
                                 <Badge variant="secondary" className={cn(
                                   "border-none font-bold py-1 px-3 rounded-lg text-sm",
                                   isFreeShipping ? "line-through opacity-40 text-muted-foreground" : "text-primary bg-primary/10"
                                 )}>
                                   {formatPrice(Number(selectedRegion.fee))}
                                 </Badge>
                                 {isFreeShipping && (
                                   <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">Free Unlocked</span>
                                 )}
                               </div>
                            )}
                            <ChevronDown className={cn("h-5 w-5 shrink-0 opacity-50 transition-transform duration-200", openShipping && "rotate-180")} />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl shadow-2xl border-border/60 overflow-hidden" align="start">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search (e.g. Nairobi, Mombasa, Kisumu...)" className="h-14 text-base" />
                          <CommandList className="max-h-80 no-scrollbar">
                            <CommandEmpty className="py-12 text-center flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                                <MapPin className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-base font-semibold">No area found.</p>
                                <p className="text-xs text-muted-foreground">Try searching with a different name.</p>
                              </div>
                            </CommandEmpty>
                            <CommandGroup heading="Popular Destinations" className="p-2">
                              {shippingRegions.map((region) => (
                                <CommandItem
                                  key={region.id}
                                  value={`${region.name} ${region.description || ""}`}
                                  onSelect={() => {
                                    setSelectedRegion(region);
                                    setOpenShipping(false);
                                  }}
                                  className="flex items-center justify-between p-4 my-1 rounded-xl cursor-pointer aria-selected:bg-primary transition-colors group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                       "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                       selectedRegion?.id === region.id 
                                         ? 'text-primary scale-110 shadow-lg shadow-primary/5 bg-primary/10 group-aria-selected:text-white group-aria-selected:bg-white/20' 
                                         : 'text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary bg-secondary/30 group-aria-selected:text-white group-aria-selected:bg-white/10'
                                    )}>
                                      <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-foreground text-sm tracking-tight group-aria-selected:text-white">{region.name}</span>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-black dark:text-white font-bold uppercase tracking-wider group-aria-selected:text-white/90">{region.estimatedDays || "2-3 Working Days"}</span>
                                        {region.description && (
                                          <span className="text-[10px] text-muted-foreground group-aria-selected:text-white/70 font-medium leading-relaxed">{region.description}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold text-primary group-aria-selected:text-white">{formatPrice(Number(region.fee))}</span>
                                      {Number(region.fee) === 0 && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider group-aria-selected:text-white/80">Free Shipping</span>}
                                    </div>
                                    <div className={cn(
                                       "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                       selectedRegion?.id === region.id 
                                         ? "border-primary text-primary bg-primary/10 group-aria-selected:border-white group-aria-selected:text-white" 
                                         : "border-muted group-hover:border-primary/50 group-aria-selected:border-white/50"
                                    )}>
                                       {selectedRegion?.id === region.id && <Check className="h-3 w-3" />}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {!selectedRegion && !isFreeShipping && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-destructive flex items-center gap-1.5 px-2 font-medium"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Please select a delivery area to view your final total.
                      </motion.p>
                    )}

                    {selectedRegion && isFreeShipping && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3 text-green-600"
                       >
                         <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                           <Sparkles className="h-4 w-4" />
                         </div>
                         <p className="text-xs font-bold uppercase tracking-wider">Congratulations! Your order qualifies for Free Shipping.</p>
                       </motion.div>
                    )}
                  </div>
                </div>
              </section>

              {/* Contact Information & Payment */}
              <section className="bg-background rounded-3xl p-8 shadow-sm border border-border/40">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                
                <div className="space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                           onClick={() => setPaymentMethod("MPESA")}
                           className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "MPESA" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                           <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-8 object-contain" alt="M-Pesa" />
                           <span className="font-bold">M-Pesa</span>
                        </div>

                        <div 
                           onClick={() => setPaymentMethod("CARD")}
                           className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "CARD" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                           <img src="https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771364735/visa-mastercard-logos_pra3y7.jpg" className="h-8 object-contain" alt="Mastercard" />
                           <span className="font-bold">Credit / Debit Card</span>
                        </div>
                     </div>

                  {paymentMethod === "MPESA" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                        <Label htmlFor="phone">M-Pesa Phone Number (for STK Push)</Label>
                        <PhoneInput
                          placeholder="Enter phone number" 
                          value={formData.phone} 
                          onChange={(value) => setFormData({ ...formData, phone: value || '' })} 
                          defaultCountry="KE"
                          inputComponent={Input}
                        />
                        <p className="text-xs text-muted-foreground">Ensure this is your active M-Pesa line for the STK Push.</p>
                      </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Input id="notes" placeholder="Special delivery instructions" value={formData.notes} onChange={handleInputChange} className="rounded-xl" />
                  </div>
                </div>
              </section>

              <Button 
                type="submit" 
                disabled={loading || items.length === 0} 
                className="w-full py-8 rounded-full text-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Confirm Order`
                )}
              </Button>
            </form>
          </div>
          
          {/* Order Sidebar */}
          <aside className="lg:w-96">
            <div className="bg-background rounded-3xl p-8 shadow-xl border border-border/40 sticky top-32">
              <h2 className="text-xl font-semibold mb-6 flex items-center justify-between">
                Order Summary
                <span className="text-sm font-normal text-muted-foreground">{cartCount} items</span>
              </h2>
              
              <div className="space-y-6 max-h-[40vh] overflow-y-auto mb-6 pr-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary/20 flex-shrink-0">
                      <img 
                        src={item.product?.photos?.[0]?.url ? `${API_BASE_URL}${item.product.photos[0].url}` : "/placeholder-product.png"} 
                        alt={item.product?.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/100x100?text=Product';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product?.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice((item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || "0")) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="mb-6" />
              
               <div className="space-y-3">
                 <div className="flex justify-between text-sm text-muted-foreground">
                   <span>Subtotal</span>
                   <span>{formatPrice(displayTotal)}</span>
                 </div>
                 <div className="flex justify-between text-sm text-muted-foreground">
                   <span>Shipping ({selectedRegion?.name || 'Standard'})</span>
                   <div className="text-right">
                     {isFreeShipping ? (
                       <div className="flex flex-col items-end">
                         <span className="text-xs line-through opacity-50">{formatPrice(parseFloat(selectedRegion?.fee || "0"))}</span>
                         <span className="text-green-600 font-bold">Free</span>
                       </div>
                     ) : (
                       <span className="text-foreground">
                         {selectedRegion ? formatPrice(parseFloat(selectedRegion.fee)) : 'Calculated next'}
                       </span>
                     )}
                   </div>
                 </div>
                 <div className="flex justify-between text-xl font-bold pt-4 text-primary">
                   <span>Total</span>
                   <span>{formatPrice(grandTotal)}</span>
                 </div>
               </div>

               {/* Free Shipping Progress */}
               <div className="mt-8 p-6 bg-secondary/5 rounded-3xl border border-secondary/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                       <Truck className="h-4 w-4 text-primary" />
                       Free Shipping
                    </span>
                    {isFreeShipping ? (
                      <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Unlocked</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-bold">KES {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
                    )}
                  </div>
                  
                  <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${freeShippingProgress}%` }}
                      className={cn(
                        "h-full transition-all duration-1000",
                        isFreeShipping ? "bg-green-500" : "bg-primary"
                      )}
                    />
                  </div>

                  {!isFreeShipping ? (
                    <p className="text-[10px] text-muted-foreground">
                      Add <span className="text-foreground font-bold">{formatPrice(amountToFreeShipping)}</span> more to unlock <span className="text-primary font-bold underline">FREE SHIPPING</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-600 font-bold">
                      Your order qualifies for free delivery nationwide! 🇰🇪
                    </p>
                  )}
               </div>
               
               <div className="mt-6 p-4 bg-primary/5 rounded-2xl flex items-start gap-3">
                 <Truck className="w-5 h-5 text-primary mt-0.5" />
                 <div>
                   <p className="text-sm font-semibold">Estimated Delivery</p>
                   <p className="text-xs text-muted-foreground">
                     {selectedRegion?.estimatedDays || "2 working days"}
                   </p>
                 </div>
               </div>
            </div>
          </aside>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
