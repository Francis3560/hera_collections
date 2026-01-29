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
import { CreditCard, Truck, User, ArrowLeft, Loader2, CheckCircle2, Search, Check, Info, MapPin, Navigation, AlertCircle } from "lucide-react";
import PaymentService from "@/api/payment.service";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { toast } from "sonner";
import 'react-phone-number-input/style.css';
import '@/components/ui/phone-input.css';
import PhoneInput from 'react-phone-number-input';
import customerService from "@/api/customer.service";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { OrderSuccessSplash } from "@/components/shared/OrderSuccessSplash";
import ShippingService from "@/api/shipping.service";

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
    notes: ""
  });

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

  const shippingFee = selectedRegion ? parseFloat(selectedRegion.fee) : 0;
  const grandTotal = displayTotal + shippingFee;

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
    if (!formData.phone) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!selectedRegion) {
      toast.error("Please select a shipping plan");
      const element = document.getElementById("address");
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setPaymentStatus("PENDING");

    try {
      // Format phone: remove + if present
      const formattedPhone = formData.phone.replace('+', '');

      // 1. Initiate M-Pesa STK Push
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
        toast.info("STK Push sent! Please check your phone.");
        
        // 2. Start polling for payment status
        pollPaymentStatus(response.data.checkoutRequestId);
      } else {
        throw new Error(response.message || "Failed to initiate payment");
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
    const maxAttempts = 20; // ~10 minutes total (30s intervals)
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await PaymentService.checkPaymentStatus(id);
        if (response.success && response.data.status === "SUCCESS") {
          clearInterval(interval);
          setSuccessOrder(response.data.order);
          setPaymentStatus("SUCCESS");
          setLoading(false);
          toast.success("Payment successful! Order placed.");
          clearCart();
        } else if (response.data.status === "FAILED") {
          clearInterval(interval);
          setPaymentStatus("FAILED");
          setLoading(false);
          toast.error(`Payment failed: ${response.data.failureReason || "User cancelled"}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentStatus("FAILED");
          setLoading(false);
          toast.error("Payment timeout. Please try again.");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds
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
                        className="pl-12 py-7 rounded-2xl bg-background border-primary/20 focus:border-primary shadow-sm"
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
                    <Label htmlFor="governorate">Governorate / State</Label>
                    <Input id="governorate" value={formData.governorate} onChange={handleInputChange} required className="rounded-xl" />
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-border/40 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <Label className="text-lg font-semibold">Shipping Plan</Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {shippingRegions.map((region) => (
                        <div 
                           key={region.id}
                           onClick={() => setSelectedRegion(region)}
                           className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${selectedRegion?.id === region.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                           <div className="flex justify-between items-center">
                              <span className="font-bold">{region.name}</span>
                              <span className="text-primary font-bold">{formatPrice(Number(region.fee))}</span>
                           </div>
                           {region.estimatedDays && (
                             <span className="text-xs text-muted-foreground">Est. Delivery: {region.estimatedDays}</span>
                           )}
                           {region.description && (
                             <span className="text-[10px] text-muted-foreground line-clamp-1 mt-1">{region.description}</span>
                           )}
                        </div>
                      ))}
                      {shippingRegions.length === 0 && (
                        <div className="col-span-full py-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed">
                           <p className="text-muted-foreground text-sm">Loading shipping options...</p>
                        </div>
                      )}
                    </div>
                    {!selectedRegion && shippingRegions.length > 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Please select a shipping destination to continue.
                      </p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div 
                        onClick={() => setPaymentMethod("MPESA")}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "MPESA" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                     >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" className="h-8 object-contain" alt="M-Pesa" />
                        <span className="font-bold">M-Pesa</span>
                     </div>

                     <div className="p-6 rounded-2xl border-2 border-dashed border-muted bg-muted/20 opacity-60 flex flex-col items-center gap-3 relative">
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">Soon</div>
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground text-sm text-center">Credit Card</span>
                     </div>

                     <div className="p-6 rounded-2xl border-2 border-dashed border-muted bg-muted/20 opacity-60 flex flex-col items-center gap-3 relative">
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">Soon</div>
                        <Info className="h-8 w-8 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground text-sm text-center">Bank Transfer</span>
                     </div>
                  </div>

                  {paymentMethod === "MPESA" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="phone">M-Pesa Phone Number</Label>
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
                  `Pay ${formatPrice(displayTotal)} Now`
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
                  <span className={shippingFee > 0 ? "text-foreground" : "text-green-600"}>
                    {shippingFee > 0 ? formatPrice(shippingFee) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-4 text-primary">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-primary/5 rounded-2xl flex items-start gap-3">
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
