// validators/stockValidators.js
import Joi from 'joi';

// Stock movement types enum
const STOCK_MOVEMENT_TYPES = [
  'ADDITION',
  'ADJUSTMENT',
  'SALE',
  'RETURN',
  'DAMAGE',
  'LOSS',
  'TRANSFER',
  'CORRECTION'
];

// Validation for adding stock
export const addStockSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
  reason: Joi.string().max(500).optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  costPrice: Joi.number().precision(2).min(0).optional().allow(null),
  location: Joi.string().max(120).optional().allow('', null),
});

// Validation for adjusting stock
export const adjustStockSchema = Joi.object({
  quantity: Joi.number().integer().required().not(0),
  reason: Joi.string().max(500).optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  location: Joi.string().max(120).optional().allow('', null),
});

// Validation for bulk stock update
export const bulkStockUpdateSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      quantity: Joi.number().integer().required().not(0),
      movementType: Joi.string().valid(...STOCK_MOVEMENT_TYPES).optional(),
      reason: Joi.string().max(500).optional().allow('', null),
      notes: Joi.string().max(1000).optional().allow('', null),
    })
  ).min(1).required(),
});

// Validation for stock movements query
export const stockMovementsQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  movementType: Joi.string().valid(...STOCK_MOVEMENT_TYPES).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Validation for low stock query
export const lowStockQuerySchema = Joi.object({
  threshold: Joi.number().integer().min(1).default(10),
});

// Validation for stock alert
export const stockAlertSchema = Joi.object({
  threshold: Joi.number().integer().min(1).required(),
});

// Validation for stock alert query
export const stockAlertQuerySchema = Joi.object({
  productId: Joi.number().integer().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  resolved: Joi.string().valid('true', 'false').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Stock take validations
export const createStockTakeSchema = Joi.object({
  title: Joi.string().max(160).required(),
  description: Joi.string().max(500).optional().allow('', null),
  startDate: Joi.date().optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

export const addStockTakeItemsSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      countedQuantity: Joi.number().integer().min(0).required(),
      notes: Joi.string().max(500).optional().allow('', null),
    })
  ).min(1).required(),
});

export const completeStockTakeSchema = Joi.object({
  autoAdjust: Joi.boolean().default(false),
  notes: Joi.string().max(1000).optional().allow('', null),
});

export const stockTakeQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Validation middleware functions
export function validateAddStock(req, res, next) {
  const { error, value } = addStockSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock addition data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateAdjustStock(req, res, next) {
  const { error, value } = adjustStockSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock adjustment data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateBulkStockUpdate(req, res, next) {
  const { error, value } = bulkStockUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid bulk stock update data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateStockMovementsQuery(req, res, next) {
  const { error } = stockMovementsQuerySchema.validate(req.query, {
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

export function validateLowStockQuery(req, res, next) {
  const { error } = lowStockQuerySchema.validate(req.query, {
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

export function validateStockAlert(req, res, next) {
  const { error, value } = stockAlertSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock alert data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateStockAlertQuery(req, res, next) {
  const { error } = stockAlertQuerySchema.validate(req.query, {
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

export function validateCreateStockTake(req, res, next) {
  const { error, value } = createStockTakeSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock take data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateAddStockTakeItems(req, res, next) {
  const { error, value } = addStockTakeItemsSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock take items data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateCompleteStockTake(req, res, next) {
  const { error, value } = completeStockTakeSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock take completion data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateStockTakeQuery(req, res, next) {
  const { error } = stockTakeQuerySchema.validate(req.query, {
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