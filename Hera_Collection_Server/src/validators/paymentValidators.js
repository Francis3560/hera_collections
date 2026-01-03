import Joi from 'joi';

export const paymentRequestSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().precision(2).required(),
        variantName: Joi.string().optional().allow('', null),
        variantValue: Joi.string().optional().allow('', null),
      })
    )
    .min(1)
    .required(),

  customer: Joi.object({
    firstName: Joi.string().max(120).optional().allow('', null),
    lastName: Joi.string().max(120).optional().allow('', null),
    name: Joi.string().max(255).optional().allow('', null),
    phone: Joi.string().max(32).required(),
    email: Joi.string().email().max(191).required(),
  }).required(),

  payment: Joi.object({
    method: Joi.string().valid('MPESA').required(), // For now, only MPESA
    phone: Joi.string()
      .pattern(/^(?:254|\+254|0)?([17]\d{8})$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid Kenyan number'
      }),
  }).required(),

  shipping: Joi.object({
    address: Joi.string().optional().allow('', null),
    city: Joi.string().max(120).optional().allow('', null),
    country: Joi.string().max(120).optional().allow('', null),
    notes: Joi.string().optional().allow('', null),
  }).optional(),

  amounts: Joi.object({
    subtotal: Joi.number().precision(2).min(1).required(),
    total: Joi.number().precision(2).min(1).required(),
  }).required(),
});

// Validation for M-Pesa callback
export const mpesaCallbackSchema = Joi.object({
  Body: Joi.object({
    stkCallback: Joi.object({
      MerchantRequestID: Joi.string().required(),
      CheckoutRequestID: Joi.string().required(),
      ResultCode: Joi.number().required(),
      ResultDesc: Joi.string().required(),
      CallbackMetadata: Joi.object({
        Item: Joi.array().items(
          Joi.object({
            Name: Joi.string().required(),
            Value: Joi.alternatives().try(
              Joi.string(),
              Joi.number()
            ).required()
          })
        ).optional()
      }).optional()
    }).required()
  }).required()
});

// Validation for payment status check
export const paymentStatusSchema = Joi.object({
  checkoutId: Joi.string().required()
});

// Validation for payment intents query
export const paymentIntentsQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'SUCCESS', 'FAILED').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Validation for retry payment
export const retryPaymentSchema = Joi.object({
  paymentIntentId: Joi.number().integer().required()
});

// Validation middleware functions
export function validatePaymentRequest(req, res, next) {
  const { error, value } = paymentRequestSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment request",
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.')
      }))
    });
  }
  
  // Normalize phone number
  if (value.payment.phone) {
    let phone = value.payment.phone;
    
    // Remove any spaces or special characters
    phone = phone.replace(/\s+/g, '');
    
    // Convert to 254 format
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (phone.startsWith('+254')) {
      phone = phone.substring(1);
    } else if (phone.startsWith('254')) {
      // Already in correct format
    } else if (phone.length === 9 && phone.startsWith('7')) {
      phone = '254' + phone;
    }
    
    value.payment.phone = phone;
  }
  
  req.body = value;
  next();
}

export function validateMpesaCallback(req, res, next) {
  const { error } = mpesaCallbackSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    console.warn("Invalid MPESA callback format:", error.details);
    return res.status(400).json({
      ResultCode: 1,
      ResultDesc: "Invalid callback format"
    });
  }
  
  next();
}

export function validatePaymentStatus(req, res, next) {
  const { error } = paymentStatusSchema.validate(req.params, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid request parameters",
      errors: error.details.map(d => d.message)
    });
  }
  
  next();
}

export function validatePaymentIntentsQuery(req, res, next) {
  const { error } = paymentIntentsQuerySchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: error.details.map(d => d.message)
    });
  }
  
  next();
}

export function validateRetryPayment(req, res, next) {
  const { error } = retryPaymentSchema.validate(req.params, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment intent ID",
      errors: error.details.map(d => d.message)
    });
  }
  
  next();
}