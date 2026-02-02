import multer from 'multer';
import prisma from '../database.js';
import imageService from '../services/images/imageService.js';

const storage = multer.memoryStorage();
const fileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter,
});

export const getAllSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const where = categoryId ? { categoryId: parseInt(categoryId) } : {};
    
    const subCategories = await prisma.subCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    res.status(200).json(subCategories);
  } catch (error) {
    console.error('Failed to fetch sub-categories:', error);
    res.status(500).json({ message: 'Failed to fetch sub-categories' });
  }
};

export const getSubCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const subCategory = await prisma.subCategory.findUnique({
      where: { slug },
      include: {
        category: true,
        products: {
          where: { isPublished: true },
          include: { photos: true, variants: true }
        }
      }
    });

    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }

    res.status(200).json(subCategory);
  } catch (error) {
    console.error('Failed to fetch sub-category:', error);
    res.status(500).json({ message: 'Failed to fetch sub-category' });
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const { name, description, slug, categoryId } = req.body;
    
    if (!name || !slug || !categoryId) {
      return res.status(400).json({ message: 'Name, slug and categoryId are required' });
    }

    const existing = await prisma.subCategory.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ message: 'Sub-category with this slug already exists' });
    }

    let coverPhoto = null;
    if (req.file) {
      const processed = await imageService.processAndSaveImage(req.file, 'sub-categories');
      coverPhoto = processed.original;
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        coverPhoto,
        categoryId: parseInt(categoryId),
      }
    });

    res.status(201).json(subCategory);
  } catch (error) {
    console.error('Failed to create sub-category:', error);
    res.status(500).json({ message: 'Failed to create sub-category' });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, slug, categoryId, isActive } = req.body;

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }

    let coverPhoto = subCategory.coverPhoto;
    if (req.file) {
      if (subCategory.coverPhoto) {
        try { await imageService.deleteImage(subCategory.coverPhoto); } catch (e) {}
      }
      const processed = await imageService.processAndSaveImage(req.file, 'sub-categories');
      coverPhoto = processed.original;
    }

    const updated = await prisma.subCategory.update({
      where: { id: parseInt(id) },
      data: {
        name: name || subCategory.name,
        slug: slug || subCategory.slug,
        description: description !== undefined ? description : subCategory.description,
        coverPhoto,
        categoryId: categoryId ? parseInt(categoryId) : subCategory.categoryId,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : subCategory.isActive
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Failed to update sub-category:', error);
    res.status(500).json({ message: 'Failed to update sub-category' });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { products: true } } }
    });

    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }

    if (subCategory._count.products > 0) {
      return res.status(400).json({ message: 'Cannot delete sub-category with products' });
    }

    if (subCategory.coverPhoto) {
      try { await imageService.deleteImage(subCategory.coverPhoto); } catch (e) {}
    }

    await prisma.subCategory.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Sub-category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete sub-category:', error);
    res.status(500).json({ message: 'Failed to delete sub-category' });
  }
};
