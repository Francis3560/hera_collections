import axiosClient  from '@/utils/axiosClient';

class CustomerService {
  async getCustomers(params = {}) {
    // Customers are users with role 'USER'
    const response = await axiosClient.get('/users', { 
        params: { ...params, role: 'USER' } 
    });
    return response.data;
  }

  async getCustomerById(id) {
    // Backend route: /users/users/:id
    const response = await axiosClient.get(`/users/users/${id}`);
    return response.data;
  }

  async createCustomer(data) {
    // Backend route: /users/ (create user)
    const response = await axiosClient.post('/users', { ...data, role: 'USER' });
    return response.data;
  }

  async updateCustomer(id, data) {
    // Backend route: /users/users/:id
    const response = await axiosClient.put(`/users/users/${id}`, data);
    return response.data;
  }

  async deleteCustomer(id) {
    // Backend route: /users/users/:id
    const response = await axiosClient.delete(`/users/users/${id}`);
    return response.data;
  }

  async sendEmail(id, emailData) {
     // Backend route: /users/users/:id/email
     const response = await axiosClient.post(`/users/users/${id}/email`, emailData);
     return response.data;
  }

  // Note: There isn't a direct endpoint for customer specific orders in user routes
  // We should likely use the order service to filter by buyerId instead.
  // But keeping this here if needed, linking to generic user orders if/when implemented
  async getCustomerOrders(id) {
    // This route might not exist on backend yet specifically for "customer orders" 
    // mapped to /users/:id/orders. 
    // Currently getOrderByIdAdmin gets full details. 
    // To get list of orders for a user, we should use getAllOrders({ buyerId: id }) from order service.
    // For now, I'll comment this out or map it to the order service if possible, 
    // but circular dependency might occur. Best to use order service directly in the component.
     throw new Error("Use OrderService.getAllOrders({ userId: id }) instead");
  }
}

export default new CustomerService();
