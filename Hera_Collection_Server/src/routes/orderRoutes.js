import express from 'express';
import { 
  protect, 
  requireRoles,
  protectAdmin 
} from '../middlewares/authMiddleware.js';
import { 
  validateCreateOrder, 
  validateUpdateOrderStatus, 
  validateUpdateOrderDetails,
  validateOrderQuery
} from '../validators/orderValidator.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();
router.use(protect);
router.post('/', requireRoles('ADMIN', 'USER'), validateCreateOrder, orderController.createOrder);
router.get('/', requireRoles('ADMIN', 'USER'), orderController.listOrders);
router.get('/stats', requireRoles('ADMIN', 'USER'), orderController.orderStats);
router.get('/:id', requireRoles('ADMIN', 'USER'), orderController.getOrder);
router.get('/admin/all', protectAdmin, validateOrderQuery, orderController.listAllOrders);
router.get('/admin/items', protectAdmin, orderController.listOrderItems);
router.post('/admin/cash', protectAdmin, validateCreateOrder, orderController.createCashOrder);
router.get('/admin/analytics/sales', protectAdmin, orderController.salesAnalytics);
router.get('/admin/analytics/trends', protectAdmin, orderController.salesTrends);
router.put('/admin/:id/status', protectAdmin, validateUpdateOrderStatus, orderController.updateOrderStatus);
router.put('/admin/:id/details', protectAdmin, validateUpdateOrderDetails, orderController.updateOrderDetails);
router.delete('/admin/:id', protectAdmin, orderController.deleteOrder);
router.post('/admin/send-email', protectAdmin, orderController.sendOrderUpdateEmail);

export default router;