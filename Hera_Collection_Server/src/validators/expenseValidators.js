import Joi from 'joi';
export const createExpenseSchema = Joi.object({
  title: Joi.string().max(160).required(),
  description: Joi.string().max(1000).optional().allow('', null),
  amount: Joi.number().precision(2).min(0.01).required(),
  date: Joi.date().optional(),
  categoryId: Joi.number().integer().positive().optional().allow(null),
  paymentMethod: Joi.string().valid('MPESA', 'CARD', 'CASH', 'OTHER').default('CASH'),
  referenceNumber: Joi.string().max(64).optional().allow('', null),
  receiptUrl: Joi.string().uri().max(512).optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'CANCELLED').default('ACTIVE'),
});
export const updateExpenseSchema = Joi.object({
  title: Joi.string().max(160).optional(),
  description: Joi.string().max(1000).optional().allow('', null),
  amount: Joi.number().precision(2).min(0.01).optional(),
  date: Joi.date().optional(),
  categoryId: Joi.number().integer().positive().optional().allow(null),
  paymentMethod: Joi.string().valid('MPESA', 'CARD', 'CASH', 'OTHER').optional(),
  referenceNumber: Joi.string().max(64).optional().allow('', null),
  receiptUrl: Joi.string().uri().max(512).optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'CANCELLED').optional(),
}).min(1);

export const expenseQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  createdById: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('ACTIVE', 'CANCELLED').default('ACTIVE'),
  minAmount: Joi.number().precision(2).min(0).optional(),
  maxAmount: Joi.number().precision(2).min(0).optional(),
  search: Joi.string().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('date', 'amount', 'title').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const analyticsQuerySchema = Joi.object({
  timeframe: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'month', 'yearly', 'last-month')
    .default('monthly'),
});

export const exportQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  format: Joi.string().valid('json', 'csv').default('json'),
});

export function validateCreateExpense(req, res, next) {
  const { error, value } = createExpenseSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateUpdateExpense(req, res, next) {
  const { error, value } = updateExpenseSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense update data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateExpenseQuery(req, res, next) {
  const { error } = expenseQuerySchema.validate(req.query, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: error.details.map(d => d.message),
    });
  }

  next();
}

export function validateAnalyticsQuery(req, res, next) {
  const { error } = analyticsQuerySchema.validate(req.query, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid analytics query parameters',
      errors: error.details.map(d => d.message),
    });
  }

  next();
}

export function validateExportQuery(req, res, next) {
  const { error } = exportQuerySchema.validate(req.query, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid export query parameters',
      errors: error.details.map(d => d.message),
    });
  }

  next();
}