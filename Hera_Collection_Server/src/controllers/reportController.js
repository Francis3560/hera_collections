import * as reportService from '../services/reportService.js';

export const getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getSalesSummaryData(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching sales summary report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getExpenseData(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching expenses report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getInventoryValue = async (req, res) => {
  try {
    const data = await reportService.getInventoryValueData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching inventory value report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getProfitLossData(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching P&L report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
