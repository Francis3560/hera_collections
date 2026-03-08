import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().optional().allow(null),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().precision(2).required(),
        variantId: Joi.number().integer().optional().allow(null),
        variantName: Joi.string().optional().allow('', null),
        variantValue: Joi.string().optional().allow('', null),
      })
    )
    .min(1)
    .required(),

  customer: Joi.object({
    firstName: Joi.string().max(120).optional().allow('', null),
    lastName: Joi.string().max(120).optional().allow('', null),
    full_name: Joi.string().max(255).optional().allow('', null),
    name: Joi.string().max(255).optional().allow('', null),
    phone: Joi.string().max(32).optional().allow('', null),
    phone_number: Joi.string().max(32).optional().allow('', null),
    email: Joi.string().email().max(191).optional().allow('', null),
    userId: Joi.number().integer().optional().allow(null),
  }).required(),

  payment: Joi.object({
    method: Joi.string().valid('MPESA', 'CARD', 'CASH', 'OTHER', 'MPESA_MANUAL').required(),
    phone: Joi.string().optional().allow(null, ''),
    mpesaReference: Joi.string().optional().allow('', null),
    paystackReference: Joi.string().optional().allow('', null),
  }).required(),

  shipping: Joi.object({
    address: Joi.string().optional().allow('', null),
    city: Joi.string().max(120).optional().allow('', null),
    governorate: Joi.string().optional().allow('', null),
    country: Joi.string().max(120).optional().allow('', null),
    notes: Joi.string().optional().allow('', null),
  }).optional(),

  amounts: Joi.object({
    subtotal: Joi.number().precision(2).required(),
    shipping: Joi.number().precision(2).optional().default(0),
    total: Joi.number().precision(2).required(),
  }).required(),

  isPos: Joi.boolean().optional(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PAID', 'PROCESSING', 'FULFILLED', 'COMPLETED', 'SHIPPED', 'CANCELLED').required(),
  trackingNumber: Joi.string().optional().allow('', null),
  estimatedDelivery: Joi.date().optional().allow(null),
  mpesaReference: Joi.string().optional().allow('', null),
});

export const updateOrderDetailsSchema = Joi.object({
  paymentMethod: Joi.string().valid('MPESA', 'CARD', 'CASH', 'OTHER').optional(),
  phone: Joi.string().max(32).optional(),
  shippingAddress: Joi.string().optional(),
  shippingCity: Joi.string().max(120).optional(),
  shippingCountry: Joi.string().max(120).optional(),
  notes: Joi.string().optional(),
  customerFirstName: Joi.string().max(120).optional(),
  customerLastName: Joi.string().max(120).optional(),
  customerEmail: Joi.string().email().max(191).optional(),
}).min(1);

export const orderQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PAID', 'PROCESSING', 'FULFILLED', 'COMPLETED', 'SHIPPED', 'CANCELLED').optional(),
  paymentMethod: Joi.string().valid('MPESA', 'CARD', 'CASH', 'OTHER').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'totalAmount', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
export function validateCreateOrder(req, res, next) {
  const { error } = createOrderSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Invalid order payload',
      details: error.details.map((d) => d.message),
    });
  }
  return next();
}

export function validateUpdateOrderStatus(req, res, next) {
  const { error } = updateOrderStatusSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Invalid status payload',
      details: error.details.map((d) => d.message),
    });
  }
  return next();
}

export function validateUpdateOrderDetails(req, res, next) {
  const { error } = updateOrderDetailsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Invalid details payload',
      details: error.details.map((d) => d.message),
    });
  }
  return next();
}

export function validateOrderQuery(req, res, next) {
  const { error } = orderQuerySchema.validate(req.query, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Invalid query parameters',
      details: error.details.map((d) => d.message),
    });
  }
  return next();
}