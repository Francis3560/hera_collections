import axiosClient from '../utils/axiosClient';

const ReportService = {
  getSalesSummary: (params) => axiosClient.get('/reports/sales-summary', { params }).then(res => res.data),
  getExpensesReport: (params) => axiosClient.get('/reports/expenses', { params }).then(res => res.data),
  getInventoryValue: () => axiosClient.get('/reports/inventory-value').then(res => res.data),
  getProfitLoss: (params) => axiosClient.get('/reports/profit-loss', { params }).then(res => res.data),
};

export default ReportService;
