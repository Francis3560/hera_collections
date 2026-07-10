import * as shippingService from '../services/shippingService.js';

export const getAllRegions = async (req, res) => {
  try {
    const regions = await shippingService.getAllRegions(req.query);
    res.json(regions);
  } catch (error) {
    console.error('getAllRegions error:', error);
    res.status(500).json({ message: 'Failed to fetch shipping regions' });
  }
};

export const getRegionById = async (req, res) => {
  try {
    const region = await shippingService.getRegionById(req.params.id);
    if (!region) return res.status(404).json({ message: 'Region not found' });
    res.json(region);
  } catch (error) {
    console.error('getRegionById error:', error);
    res.status(500).json({ message: 'Failed to fetch shipping region' });
  }
};

export const createRegion = async (req, res) => {
  try {
    const region = await shippingService.createRegion(req.body);
    res.status(201).json(region);
  } catch (error) {
    console.error('createRegion error:', error);
    res.status(500).json({ message: 'Failed to create shipping region' });
  }
};

export const updateRegion = async (req, res) => {
  try {
    const region = await shippingService.updateRegion(req.params.id, req.body);
    res.json(region);
  } catch (error) {
    console.error('updateRegion error:', error);
    res.status(500).json({ message: 'Failed to update shipping region' });
  }
};

export const deleteRegion = async (req, res) => {
  try {
    await shippingService.deleteRegion(req.params.id);
    res.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('deleteRegion error:', error);
    res.status(500).json({ message: 'Failed to delete shipping region' });
  }
};
