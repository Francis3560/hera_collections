import Joi from 'joi';

export const notificationFilterValidator = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().default(false),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  type: Joi.string().max(100),
  startDate: Joi.date(),
  endDate: Joi.date()
});

export const createNotificationValidator = Joi.object({
  userId: Joi.number().integer().required(),
  type: Joi.string().max(100).required(),
  title: Joi.string().max(255).required(),
  message: Joi.string().required(),
  data: Joi.object().optional(),
  relatedEntity: Joi.string().max(50).optional(),
  relatedEntityId: Joi.number().integer().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
  expiresAt: Joi.date().optional()
});

export const markAsReadValidator = Joi.object({
  notificationIds: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.array().items(Joi.number().integer())
  ).required()
});

export const deleteNotificationValidator = Joi.object({
  notificationIds: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.array().items(Joi.number().integer())
  ).required()
});