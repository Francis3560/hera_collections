import * as reportService from '../services/reportService.js';
import { getDatesFromTimeframe } from '../utils/dateUtils.js';

export const getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate, timeframe } = req.query;
    const dates = timeframe ? getDatesFromTimeframe(timeframe) : {};
    const data = await reportService.getSalesSummaryData(
      startDate || dates.startDate, 
      endDate || dates.endDate
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching sales summary report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate, timeframe } = req.query;
    const dates = timeframe ? getDatesFromTimeframe(timeframe) : {};
    const data = await reportService.getExpenseData(
      startDate || dates.startDate, 
      endDate || dates.endDate
    );
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
    const { startDate, endDate, timeframe } = req.query;
    const dates = timeframe ? getDatesFromTimeframe(timeframe) : {};
    const data = await reportService.getProfitLossData(
      startDate || dates.startDate, 
      endDate || dates.endDate
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching P&L report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getGrowthMetrics = async (req, res) => {
  try {
    const { startDate, endDate, timeframe } = req.query;
    const dates = timeframe ? getDatesFromTimeframe(timeframe) : {};
    const data = await reportService.getGrowthMetricsData(
      startDate || dates.startDate, 
      endDate || dates.endDate,
      timeframe
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching growth metrics report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
