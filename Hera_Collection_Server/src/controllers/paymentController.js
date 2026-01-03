import { initiateStkPush } from "../services/paymentService.js";
import prisma from "../database.js";
import * as orderService from "../services/orderService.js";
import { 
  sendPaymentSuccessEmail, 
  sendPaymentFailedEmail 
} from "../services/emails/emailService.js";
import { validatePaymentRequest, validateMpesaCallback } from "../validators/paymentValidators.js";
import NotificationService from "../services/notification.service.js";

export async function startMpesaPayment(req, res) {
  try {
    const { items, customer, payment, amounts, shipping } = req.body;

    // Validate that all products exist and are in stock
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds }, 
        isPublished: true 
      },
      select: {
        id: true,
        title: true,
        sellerId: true,
        variants: {
          select: {
            id: true,
            price: true,
            stock: true,
            sku: true
          }
        }
      }
    });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Some products are invalid or unavailable"
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found or unavailable`
        });
      }

      // Find specific variant if variantId is provided, otherwise first variant
      const variant = item.variantId 
        ? product.variants.find(v => v.id === item.variantId)
        : product.variants[0];

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Product variant not found for "${product.title}"`
        });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Available: ${variant.stock}, Requested: ${item.quantity}`
        });
      }
    }

    // Generate order reference
    const orderReference = `VZG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initiate M-Pesa STK Push
    const response = await initiateStkPush({
      amount: amounts.total,
      phone: payment.phone,
      accountReference: orderReference,
      transactionDesc: "VizX Global Purchase",
    });

    // Check if STK Push was initiated successfully
    if (response.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message: response.ResponseDescription || "Failed to initiate payment",
        response
      });
    }

    // Create payment intent with order data
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        buyerId: req.auth.userId,
        mpesaCheckoutRequestId: response.CheckoutRequestID,
        mpesaMerchantRequestId: response.MerchantRequestID,
        phone: payment.phone,
        amount: amounts.total,
        payload: JSON.stringify({ 
          items, 
          customer, 
          payment, 
          amounts,
          shipping,
          orderReference 
        }),
        status: "PENDING",
        method: "MPESA",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment request initiated successfully",
      data: {
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        paymentIntentId: paymentIntent.id,
        responseDescription: response.ResponseDescription,
        orderReference,
        instructions: "Enter your M-Pesa PIN on your phone to complete the payment"
      }
    });

  } catch (err) {
    console.error("startMpesaPayment error:", err.message || err);
    
    // Handle specific error types
    if (err.message.includes("MPESA authentication failed")) {
      return res.status(503).json({
        success: false,
        message: "Payment service is temporarily unavailable. Please try again later."
      });
    }

    if (err.message.includes("STK Push")) {
      return res.status(400).json({
        success: false,
        message: "Failed to initiate payment request. Please check your phone number and try again."
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again."
    });
  }
}

export async function mpesaCallback(req, res) {
  try {
    // Validate callback authenticity (basic check)
    if (!req.body || !req.body.Body) {
      console.warn("Invalid callback structure received");
      return res.json({ ResultCode: 0, ResultDesc: "Invalid callback" });
    }

    const stkCallback = req.body.Body.stkCallback;
    const resultCode = parseInt(stkCallback?.ResultCode);
    const resultDesc = stkCallback?.ResultDesc;
    const checkoutId = stkCallback?.CheckoutRequestID;
    const callbackMetadata = stkCallback?.CallbackMetadata?.Item || [];

    // Extract transaction details from metadata
    let transactionData = {};
    if (Array.isArray(callbackMetadata)) {
      callbackMetadata.forEach(item => {
        if (item.Name && item.Value !== undefined) {
          transactionData[item.Name] = item.Value;
        }
      });
    }

    console.log("MPESA Callback received:", {
      checkoutId,
      resultCode,
      resultDesc,
      transactionData,
      timestamp: new Date().toISOString()
    });

    if (!checkoutId) {
      console.warn("Callback missing CheckoutRequestID");
      return res.json({ ResultCode: 0, ResultDesc: "Missing CheckoutRequestID" });
    }

    // Find the payment intent
    const intent = await prisma.paymentIntent.findUnique({
      where: { mpesaCheckoutRequestId: checkoutId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!intent) {
      console.warn("Callback for unknown checkoutId:", checkoutId);
      return res.json({ ResultCode: 0, ResultDesc: "Payment intent not found" });
    }

    // Don't process if already completed
    if (intent.status !== "PENDING") {
      console.log(`Payment intent ${intent.id} already in status: ${intent.status}`);
      return res.json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    if (resultCode === 0) {
      // Payment successful
      console.log(`Payment successful for intent ${intent.id}`);
      
      try {
        const payload = JSON.parse(intent.payload);
        
        // Create order
        const order = await orderService.createOrder(
          intent.buyerId,
          payload,
          intent.id
        );

        // Update payment intent with success and connect to order
        await prisma.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: "SUCCESS",
            order: { connect: { id: order.id } },
            payload: JSON.stringify({
              ...payload,
              mpesaTransaction: {
                ...transactionData,
                resultCode,
                resultDesc,
                processedAt: new Date().toISOString()
              }
            }),
          },
        });

        console.log(`Order ${order.id} created successfully for payment ${intent.id}`);

        // Send payment success notification
        try {
          await sendPaymentSuccessEmail(intent, order, intent.buyer);
        } catch (emailError) {
          console.error("Failed to send payment success email:", emailError);
        }

        // 🏆 ADDED: Real-time Notification for Payment Success
        await NotificationService.createNotification({
          userId: intent.buyerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Successful',
          message: `Your payment of ${intent.amount} for order ${order.orderNumber} has been received.`,
          link: `/profile/orders/${order.id}`,
          entityId: intent.id,
          entityType: 'PAYMENT'
        });

      } catch (orderError) {
        console.error("Order creation failed after payment:", orderError);
        
        // Update payment intent as failed due to order creation error
        await prisma.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: "FAILED",
            payload: JSON.stringify({
              ...JSON.parse(intent.payload),
              failureReason: "Order creation failed",
              error: orderError.message,
              mpesaTransaction: transactionData
            }),
          },
        });

        // Send failure notification
        try {
          await sendPaymentFailedEmail(intent, intent.buyer, "Order creation failed");
        } catch (emailError) {
          console.error("Failed to send payment failure email:", emailError);
        }
      }

    } else {
      // Payment failed
      console.log(`Payment failed for intent ${intent.id}: ${resultDesc}`);
      
      let payload = {};
      try {
        payload = JSON.parse(intent.payload);
      } catch {}

      // Update payment intent as failed
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          payload: JSON.stringify({
            ...payload,
            failureReason: resultDesc,
            mpesaTransaction: transactionData,
            resultCode,
            failedAt: new Date().toISOString()
          }),
        },
      });

      // Send payment failure notification
        try {
          await sendPaymentFailedEmail(intent, intent.buyer, resultDesc);
        } catch (emailError) {
          console.error("Failed to send payment failure email:", emailError);
        }

        // 🏆 ADDED: Real-time Notification for Payment Failure
        await NotificationService.createNotification({
          userId: intent.buyerId,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: `Your payment of ${intent.amount} failed: ${resultDesc}.`,
          entityId: intent.id,
          entityType: 'PAYMENT'
        });
    }

    return res.json({ ResultCode: 0, ResultDesc: "Callback processed successfully" });

  } catch (err) {
    console.error("mpesaCallback error:", err.message || err, err.stack);
    
    // Try to log the failing callback data for debugging
    console.error("Failed callback data:", JSON.stringify(req.body, null, 2));
    
    return res.json({ 
      ResultCode: 1, 
      ResultDesc: "Error processing callback" 
    });
  }
}

export async function checkPaymentStatus(req, res) {
  try {
    const { checkoutId } = req.params;

    if (!checkoutId) {
      return res.status(400).json({ 
        success: false,
        message: "Checkout ID is required" 
      });
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { mpesaCheckoutRequestId: checkoutId },
      include: { 
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        buyer: {
          select: {
            name: true,
            email: true
          }
        }
      },
    });

    if (!intent) {
      return res.status(404).json({ 
        success: false,
        message: "Payment request not found" 
      });
    }

    // Parse additional info from payload
    let additionalInfo = {};
    let failureReason = null;
    
    try {
      const parsed = JSON.parse(intent.payload || "{}");
      if (parsed.failureReason) failureReason = parsed.failureReason;
      
      // Extract transaction details if available
      if (parsed.mpesaTransaction) {
        additionalInfo.transaction = parsed.mpesaTransaction;
      }
      
      if (parsed.orderReference) {
        additionalInfo.orderReference = parsed.orderReference;
      }
    } catch {}

    const response = {
      success: intent.status === "SUCCESS",
      data: {
        paymentId: intent.id,
        status: intent.status,
        amount: intent.amount,
        phone: intent.phone,
        createdAt: intent.createdAt,
        updatedAt: intent.updatedAt,
        order: intent.order ? {
          id: intent.order.id,
          orderNumber: intent.order.orderNumber,
          status: intent.order.status,
          totalAmount: intent.order.totalAmount,
          createdAt: intent.order.createdAt
        } : null,
        failureReason,
        ...additionalInfo
      }
    };

    // If payment is still pending, suggest retry after delay
    if (intent.status === "PENDING") {
      const createdTime = new Date(intent.createdAt).getTime();
      const currentTime = Date.now();
      const minutesElapsed = Math.floor((currentTime - createdTime) / (1000 * 60));
      
      if (minutesElapsed > 5) {
        response.message = "Payment request has expired. Please initiate a new payment.";
        response.expired = true;
      } else {
        response.message = "Payment request is still pending. Please check your phone.";
        response.retryAfter = 30; // seconds
      }
    }

    return res.json(response);

  } catch (err) {
    console.error("checkPaymentStatus error:", err.message || err);
    return res.status(500).json({ 
      success: false,
      message: "Failed to check payment status" 
    });
  }
}

export async function getPaymentIntents(req, res) {
  try {
    if (req.auth.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all payment intents"
      });
    }

    const { 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [intents, total] = await Promise.all([
      prisma.paymentIntent.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.paymentIntent.count({ where })
    ]);

    return res.json({
      success: true,
      data: intents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("getPaymentIntents error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment intents"
    });
  }
}

export async function retryPayment(req, res) {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required"
      });
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { id: parseInt(paymentIntentId) },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: "Payment intent not found"
      });
    }

    // Check if payment can be retried
    if (intent.status === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed successfully"
      });
    }

    if (intent.status === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Payment request is still pending"
      });
    }

    // Parse original payload
    let originalPayload;
    try {
      originalPayload = JSON.parse(intent.payload);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid payment intent data"
      });
    }

    // Check if user is authorized to retry
    if (req.auth.userId !== intent.buyerId && req.auth.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to retry this payment"
      });
    }

    // Generate new order reference
    const newOrderReference = `VZG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update original payload with new reference
    const updatedPayload = {
      ...originalPayload,
      orderReference: newOrderReference,
      retryOf: intent.id
    };

    // Initiate new STK Push
    const response = await initiateStkPush({
      amount: intent.amount,
      phone: intent.phone,
      accountReference: newOrderReference,
      transactionDesc: "VizX Global Payment Retry",
    });

    // Create new payment intent
    const newIntent = await prisma.paymentIntent.create({
      data: {
        buyerId: intent.buyerId,
        mpesaCheckoutRequestId: response.CheckoutRequestID,
        mpesaMerchantRequestId: response.MerchantRequestID,
        phone: intent.phone,
        amount: intent.amount,
        payload: JSON.stringify(updatedPayload),
        status: "PENDING",
        method: "MPESA",
      },
    });

    // Update old intent to mark as retried
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        payload: JSON.stringify({
          ...originalPayload,
          retried: true,
          retriedAt: new Date().toISOString(),
          retriedTo: newIntent.id
        })
      }
    });

    return res.status(200).json({
      success: true,
      message: "New payment request initiated",
      data: {
        newPaymentIntentId: newIntent.id,
        checkoutRequestId: response.CheckoutRequestID,
        orderReference: newOrderReference,
        instructions: "Enter your M-Pesa PIN on your phone to complete the payment"
      }
    });

  } catch (err) {
    console.error("retryPayment error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to retry payment"
    });
  }
}