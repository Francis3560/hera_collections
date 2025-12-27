import Joi from 'joi';

export const signupValidator = (data) => {
  const schema = Joi.object({
    full_name: Joi.string().min(3).max(100),
    name: Joi.string().min(3).max(100),
    email: Joi.string().email().required(),
    phone_number: Joi.string()
      .pattern(/^(\+254|254)7\d{8}$/)
      .messages({ 'string.pattern.base': 'Phone must be +2547XXXXXXXX or 2547XXXXXXXX' }),
    phone: Joi.string()
      .pattern(/^(\+254|254)7\d{8}$/)
      .messages({ 'string.pattern.base': 'Phone must be +2547XXXXXXXX or 2547XXXXXXXX' }),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('ADMIN', 'USER').default('USER'),
  })
  .or('full_name', 'name') 
  .or('phone_number', 'phone') 
  .messages({
    'object.missing': 'Full name and phone number are required',
  });

  return schema.validate(data, { abortEarly: false });
};

export const loginValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data, { abortEarly: false });
};

export const googleTokenValidator = (data) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  return schema.validate(data);
};
export const verifyCodeValidator = (data) => {
  const schema = Joi.object({
    code: Joi.string().length(6).pattern(/^[0-9]+$/).required()
  });
  return schema.validate(data);
};

export const resendCodeValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });
  return schema.validate(data);
};
