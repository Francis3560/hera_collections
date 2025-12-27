import Joi from 'joi';

const basePrefs = { abortEarly: false };

export const queryProductsValidator = (data) => {
  const schema = Joi.object({
    categoryId: Joi.number().integer().positive().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().when('minPrice', {
      is: Joi.number().positive(),
      then: Joi.number().min(Joi.ref('minPrice')),
    }),
    q: Joi.string().max(160).optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    includePhotos: Joi.boolean().default(true),
    isPublished: Joi.boolean().default(true),
  }).prefs({ allowUnknown: false });

  return schema.validate(data, basePrefs);
};

export const createProductValidator = (data) => {
  const variantSchema = Joi.object({
    name: Joi.string().max(120).required(),
    value: Joi.string().max(120).required(),
    price: Joi.number().positive().optional(),
    quantity: Joi.number().integer().min(0).default(0),
  });

  const schema = Joi.object({
    title: Joi.string().max(160).required(),
    description: Joi.string().max(5000).allow('', null),
    price: Joi.number().positive().required(),
    oldPrice: Joi.number().positive().optional().allow(null),
    sku: Joi.string().max(64).optional().allow('', null),
    quantity: Joi.number().integer().min(0).default(1),
    categoryId: Joi.number().integer().positive().optional().allow(null),
    isPublished: Joi.boolean().default(true),
    variants: Joi.array().items(variantSchema).optional(),
  }).prefs({ allowUnknown: false });

  return schema.validate(data, basePrefs);
};

export const updateProductValidator = (data) => {
  const variantSchema = Joi.object({
    name: Joi.string().max(120).required(),
    value: Joi.string().max(120).required(),
    price: Joi.number().positive().optional(),
    quantity: Joi.number().integer().min(0).default(0),
  });

  const schema = Joi.object({
    title: Joi.string().max(160),
    description: Joi.string().max(5000).allow('', null),
    price: Joi.number().positive(),
    oldPrice: Joi.number().positive().optional().allow(null),
    sku: Joi.string().max(64).optional().allow('', null),
    quantity: Joi.number().integer().min(0),
    categoryId: Joi.number().integer().positive().optional().allow(null),
    isPublished: Joi.boolean(),
    imagesAction: Joi.string().valid('append', 'replace').default('append'),
    removeImageUrls: Joi.array().items(Joi.string().uri()).optional(),
    variants: Joi.array().items(variantSchema).optional(),
  })
    .min(1)
    .prefs({ allowUnknown: false });

  return schema.validate(data, basePrefs);
};