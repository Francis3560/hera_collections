import * as discountService from '../services/discountService.js';

export const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);
    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getAllDiscounts();
    res.status(200).json({ success: true, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDiscountById = async (req, res) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found' });
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDiscount = async (req, res) => {
  try {
    await discountService.deleteDiscount(req.params.id);
    res.status(200).json({ success: true, message: 'Discount deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
