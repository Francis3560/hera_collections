import Joi from 'joi';

const createDiscountSchema = Joi.object({
  name: Joi.string().max(120).required(),
  description: Joi.string().allow('', null).optional(),
  discountPercentage: Joi.number().min(0).max(100).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({ 'date.greater': 'endDate must be after startDate' }),
  isActive: Joi.boolean().optional(),
  productIds: Joi.array().items(Joi.number().integer()).optional(),
});

const updateDiscountSchema = Joi.object({
  name: Joi.string().max(120).optional(),
  description: Joi.string().allow('', null).optional(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().iso().greater(Joi.ref('startDate')),
  }).optional().messages({ 'date.greater': 'endDate must be after startDate' }),
  isActive: Joi.boolean().optional(),
  productIds: Joi.array().items(Joi.number().integer()).optional(),
});

function validate(schema, req, res, next) {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid discount data',
      errors: error.details.map((d) => ({ message: d.message, field: d.path.join('.') })),
    });
  }
  req.body = value;
  next();
}

export const validateCreateDiscount = (req, res, next) => validate(createDiscountSchema, req, res, next);
export const validateUpdateDiscount = (req, res, next) => validate(updateDiscountSchema, req, res, next);
