import Joi from 'joi';

const createRegionSchema = Joi.object({
  name: Joi.string().max(120).required(),
  description: Joi.string().allow('', null).optional(),
  fee: Joi.number().min(0).required(),
  isActive: Joi.boolean().optional(),
  estimatedDays: Joi.string().max(50).allow('', null).optional(),
});

const updateRegionSchema = Joi.object({
  name: Joi.string().max(120).optional(),
  description: Joi.string().allow('', null).optional(),
  fee: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
  estimatedDays: Joi.string().max(50).allow('', null).optional(),
});

function validate(schema, req, res, next) {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shipping region data',
      errors: error.details.map((d) => ({ message: d.message, field: d.path.join('.') })),
    });
  }
  req.body = value;
  next();
}

export const validateCreateRegion = (req, res, next) => validate(createRegionSchema, req, res, next);
export const validateUpdateRegion = (req, res, next) => validate(updateRegionSchema, req, res, next);
