import Joi from 'joi';

const contactSchema = Joi.object({
  name: Joi.string().max(120).required(),
  email: Joi.string().email().max(191).required(),
  subject: Joi.string().max(160).required(),
  message: Joi.string().max(5000).required(),
});

export function validateContactForm(req, res, next) {
  const { error, value } = contactSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact form data',
      errors: error.details.map((d) => ({ message: d.message, field: d.path.join('.') })),
    });
  }
  req.body = value;
  next();
}
