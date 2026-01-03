import multer from 'multer';
import imageService from '../services/images/imageService.js';
import {
  searchProducts,
  getProduct as publicGetProduct,
  getProductBySlug,
  adminGetProduct,
  createProduct as svcCreateProduct,
  updateProduct as svcUpdateProduct,
  deleteProduct as svcDeleteProduct,
  getProductsBySeller,
  getProductsByCategory,
} from '../services/productService.js';
import {
  queryProductsValidator,
  createProductValidator,
  updateProductValidator,
} from '../validators/productValidators.js';

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter,
});

/**
 * PUBLIC: GET /products
 */
export const getProductsController = async (req, res) => {
  const { error, value } = queryProductsValidator(req.query);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const data = await searchProducts(value);
    res.status(200).json(data);
  } catch (e) {
    console.error('Failed to fetch products:', e);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

/**
 * PUBLIC: GET /products/:id
 */
export const getProductController = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await publicGetProduct(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (e) {
    console.error('Failed to fetch product:', e);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

/**
 * PUBLIC: GET /products/slug/:slug
 */
export const getProductBySlugController = async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (e) {
    console.error('Failed to fetch product by slug:', e);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

/**
 * GET /products/seller/:sellerId
 */
export const getProductsBySellerController = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const products = await getProductsBySeller(parseInt(sellerId));
    res.status(200).json(products);
  } catch (e) {
    console.error('Failed to fetch seller products:', e);
    res.status(500).json({ message: 'Failed to fetch seller products' });
  }
};

/**
 * GET /products/category/:categoryId
 */
export const getProductsByCategoryController = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const products = await getProductsByCategory(parseInt(categoryId));
    res.status(200).json(products);
  } catch (e) {
    console.error('Failed to fetch category products:', e);
    res.status(500).json({ message: 'Failed to fetch category products' });
  }
};

/**
 * ADMIN/SELLER: POST /products
 */
export const createProductController = [
  upload.array('images', 10),
  async (req, res) => {
    try {
      // Parse JSON fields if they are strings (typical for multipart/form-data)
      const body = { ...req.body };
      if (typeof body.options === 'string') body.options = JSON.parse(body.options);
      if (typeof body.variants === 'string') body.variants = JSON.parse(body.variants);

      const { error, value } = createProductValidator(body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      let processedImages = [];
      if (req.files?.length) {
        processedImages = await imageService.processMultipleImages(req.files);
      }

      const created = await svcCreateProduct(
        value,
        req.user.id,
        processedImages
      );

      res.status(201).json(created);
    } catch (e) {
      console.error('Failed to create product:', e);
      res.status(500).json({ 
        message: e.message || 'Failed to create product' 
      });
    }
  },
];

/**
 * ADMIN/SELLER: PUT /products/:id
 */
export const updateProductController = [
  upload.array('images', 10),
  async (req, res) => {
    try {
      // Normalize arrays if they're JSON strings
      if (typeof req.body.removeImageUrls === "string") {
        try {
          req.body.removeImageUrls = JSON.parse(req.body.removeImageUrls);
        } catch {
          req.body.removeImageUrls = [];
        }
      }

      // Explicitly parse JSON fields for options and variants if they are strings
      if (typeof req.body.options === 'string') {
        try { 
          req.body.options = JSON.parse(req.body.options); 
        } catch (e) {
          // If parsing fails, leave it as is, validation will likely catch it
        }
      }
      if (typeof req.body.variants === 'string') {
        try {
          req.body.variants = JSON.parse(req.body.variants);
        } catch(e) {}
      }

      const { error, value } = updateProductValidator(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const { id } = req.params;

      let processedImages = [];

      if (req.files?.length) {
        processedImages = await imageService.processMultipleImages(req.files);
      }

      // Update product with new images
      const updated = await svcUpdateProduct(
        id,
        value,
        processedImages
      );

      res.status(200).json(updated);
    } catch (e) {
      console.error('Failed to update product:', e);
      res.status(500).json({ message: 'Failed to update product' });
    }
  },
];

/**
 * ADMIN/SELLER: DELETE /products/:id
 */
export const deleteProductController = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await svcDeleteProduct(id);
    res.status(200).json(result);
  } catch (e) {
    console.error('Failed to delete product:', e);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};