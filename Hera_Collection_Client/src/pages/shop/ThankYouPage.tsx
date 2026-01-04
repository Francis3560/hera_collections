import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { OrderSuccessSplash } from "@/components/shared/OrderSuccessSplash";
import paymentService from "@/api/payment.service";
import { Loader2 } from "lucide-react";
import { useCart } from "@/context/CartProvider";

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const checkoutId = searchParams.get("checkoutId");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    // If we have an order number, it's already a success (M-Pesa confirmed)
    if (orderNumber) {
      setStatus("success");
      clearCart();
      return;
    }

    // If we only have checkoutId, poll for final status
    if (checkoutId) {
      const poll = async () => {
        try {
          const res = await paymentService.checkPaymentStatus(checkoutId);
          if (res.success && res.data.status === "SUCCESS") {
            setOrderDetails(res.data.order);
            setStatus("success");
            clearCart();
          } else if (res.data.status === "FAILED") {
            setStatus("failed");
          } else {
            // Keep loading/pending
            setTimeout(poll, 3000);
          }
        } catch (err) {
          console.error(err);
          setStatus("failed");
        }
      };
      poll();
    } else {
      setStatus("failed");
    }
  }, [orderNumber, checkoutId, clearCart]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {status === "loading" && (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Verifying your payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your transaction with M-Pesa.</p>
          </div>
        )}

        {status === "success" && (
          <div className="w-full max-w-4xl py-12">
            <OrderSuccessSplash orderNumber={orderNumber || orderDetails?.orderNumber} />
          </div>
        )}

        {status === "failed" && (
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl text-red-600">!</span>
            </div>
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              We couldn't confirm your payment or find your order details. If you've been charged, please contact our support.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/checkout" className="bg-primary text-white px-6 py-2 rounded-full font-medium">
                Try Checkout Again
              </Link>
              <Link to="/" className="text-primary hover:underline px-6 py-2">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
