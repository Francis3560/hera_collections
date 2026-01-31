import axiosClient from '../utils/axiosClient';

class EmailService {
  /**
   * Send a contact email
   * @param {Object} contactData - The contact form data
   * @param {string} contactData.name - Sender name
   * @param {string} contactData.email - Sender email
   * @param {string} contactData.subject - Message subject
   * @param {string} contactData.message - Message content
   * @returns {Promise<Object>} The API response
   */
  async sendContactEmail(contactData) {
    try {
      const response = await axiosClient.post('/contact', contactData);
      return response.data;
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw error.response?.data || error.message;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
