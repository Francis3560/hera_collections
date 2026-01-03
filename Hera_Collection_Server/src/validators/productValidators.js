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
    sortBy: Joi.string().valid('createdAt', 'price', 'title', 'purchases').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    hasDiscount: Joi.boolean().optional(),
  }).prefs({ allowUnknown: false });

  return schema.validate(data, basePrefs);
};

export const createProductValidator = (data) => {
  const optionSchema = Joi.object({
    name: Joi.string().max(120).required(),
    values: Joi.array().items(Joi.string().max(120)).min(1).required(),
  });

  const variantSchema = Joi.object({
    sku: Joi.string().max(64).required(),
    price: Joi.number().positive().required(),
    costPrice: Joi.number().positive().optional().allow(null),
    stock: Joi.number().integer().min(0).default(0),
    image: Joi.string().uri().optional().allow('', null),
    optionMappings: Joi.object().pattern(Joi.string(), Joi.string()).required(), // e.g., { "Color": "Black", "Size": "XL" }
  });

  const schema = Joi.object({
    title: Joi.string().max(160).required(),
    description: Joi.string().max(5000).allow('', null),
    categoryId: Joi.number().integer().positive().optional().allow(null),
    isPublished: Joi.boolean().default(true),
    brand: Joi.string().max(120).optional().allow('', null),
    manufacturer: Joi.string().max(120).optional().allow('', null),
    options: Joi.array().items(optionSchema).min(1).required(),
    variants: Joi.array().items(variantSchema).min(1).required(),
  }).prefs({ allowUnknown: false });

  return schema.validate(data, basePrefs);
};

export const updateProductValidator = (data) => {
  const optionSchema = Joi.object({
    name: Joi.string().max(120).required(),
    values: Joi.array().items(Joi.string().max(120)).min(1).required(),
  });

  const variantSchema = Joi.object({
    id: Joi.number().optional(), // For updating existing variants
    sku: Joi.string().max(64),
    price: Joi.number().positive(),
    costPrice: Joi.number().positive().optional().allow(null),
    stock: Joi.number().integer().min(0),
    image: Joi.string().uri().optional().allow('', null),
    isActive: Joi.boolean(),
    optionMappings: Joi.object().pattern(Joi.string(), Joi.string()),
  });

  const schema = Joi.object({
    title: Joi.string().max(160),
    description: Joi.string().max(5000).allow('', null),
    categoryId: Joi.number().integer().positive().optional().allow(null),
    isPublished: Joi.boolean(),
    imagesAction: Joi.string().valid('append', 'replace').default('append'),
    removeImageUrls: Joi.array().items(Joi.string().uri()).optional(),
    brand: Joi.string().max(120).optional().allow('', null),
    manufacturer: Joi.string().max(120).optional().allow('', null),
    options: Joi.array().items(optionSchema).optional(),
    variants: Joi.array().items(variantSchema).optional(),
  })
    .min(1)
    .prefs({ allowUnknown: false });

  return schema.validate(data, basePrefs);
};