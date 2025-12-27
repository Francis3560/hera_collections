// validators/expenseCategoryValidators.js
import Joi from 'joi';

// Validation for creating expense category
export const createCategorySchema = Joi.object({
  name: Joi.string().max(120).required(),
  description: Joi.string().max(500).optional().allow('', null),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)',
    }),
  icon: Joi.string().max(50).optional().allow('', null),
});

// Validation for updating expense category
export const updateCategorySchema = Joi.object({
  name: Joi.string().max(120).optional(),
  description: Joi.string().max(500).optional().allow('', null),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)',
    }),
  icon: Joi.string().max(50).optional().allow('', null),
}).min(1);

// Validation for category query parameters
export const categoryQuerySchema = Joi.object({
  search: Joi.string().optional(),
  includeExpenses: Joi.boolean().default(false),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Validation middleware functions
export function validateCreateCategory(req, res, next) {
  const { error, value } = createCategorySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateUpdateCategory(req, res, next) {
  const { error, value } = updateCategorySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category update data',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.path.join('.'),
      })),
    });
  }

  req.body = value;
  next();
}

export function validateCategoryQuery(req, res, next) {
  const { error } = categoryQuerySchema.validate(req.query, {
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