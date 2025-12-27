import prisma from '../database.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          include: { photos: true },
          where: { isPublished: true },
          take: 10,
        }
      },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ 
        message: 'Category with this name or slug already exists' 
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, slug } = req.body;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    if (name || slug) {
      const existing = await prisma.category.findFirst({
        where: {
          id: { not: parseInt(id) },
          OR: [
            { name: name || category.name },
            { slug: slug || category.slug }
          ]
        }
      });

      if (existing) {
        return res.status(400).json({ 
          message: 'Category with this name or slug already exists' 
        });
      }
    }

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || category.name,
        slug: slug || category.slug,
        description: description !== undefined ? description : category.description,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          take: 1,
        }
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    if (category.products.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with products. Remove products first.' 
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};