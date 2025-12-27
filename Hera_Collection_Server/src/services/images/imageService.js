import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageService {
  constructor() {
    this.uploadDir = process.env.NODE_ENV === 'production' 
      ? '/var/www/uploads/products'
      : path.join(process.cwd(), 'uploads', 'products');
    
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log(`Created upload directory: ${this.uploadDir}`);
    }
  }
  generateFilename(originalname, prefix = 'product') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalname).toLowerCase();
    const baseName = path.basename(originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${prefix}_${baseName}_${timestamp}_${random}${extension}`;
  }
  async processAndSaveImage(file, options = {}) {
    const {
      width = 1200,
      height = 1200,
      quality = 80,
      format = 'webp'
    } = options;

    try {
      this.validateImage(file);
      const originalFilename = this.generateFilename(file.originalname);
      const filepath = path.join(this.uploadDir, originalFilename);
      let imageProcessor = sharp(file.buffer);
      const metadata = await imageProcessor.metadata();
      imageProcessor = imageProcessor.resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      });
      switch (format) {
        case 'webp':
          imageProcessor = imageProcessor.webp({ quality, effort: 4 });
          break;
        case 'jpeg':
          imageProcessor = imageProcessor.jpeg({ quality, mozjpeg: true });
          break;
        case 'png':
          imageProcessor = imageProcessor.png({ compressionLevel: 9, quality });
          break;
        default:
          imageProcessor = imageProcessor.webp({ quality });
      }
      await imageProcessor.toFile(filepath);
      const thumbnailFilename = `thumb_${path.basename(originalFilename, path.extname(originalFilename))}.webp`;
      const thumbnailPath = path.join(this.uploadDir, thumbnailFilename);
      
      await sharp(file.buffer)
        .resize(400, 400, { 
          fit: 'cover', 
          position: 'center',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 70,
          effort: 3 
        })
        .toFile(thumbnailPath);
      const mediumFilename = `medium_${path.basename(originalFilename, path.extname(originalFilename))}.webp`;
      const mediumPath = path.join(this.uploadDir, mediumFilename);
      
      await sharp(file.buffer)
        .resize(800, 800, { 
          fit: 'cover',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 75,
          effort: 3 
        })
        .toFile(mediumPath);
      const smallFilename = `small_${path.basename(originalFilename, path.extname(originalFilename))}.webp`;
      const smallPath = path.join(this.uploadDir, smallFilename);
      
      await sharp(file.buffer)
        .resize(300, 300, { 
          fit: 'cover',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 65,
          effort: 2 
        })
        .toFile(smallPath);

      const basePath = process.env.NODE_ENV === 'production' 
        ? '/uploads/products'
        : '/uploads/products';

      return {
        original: `${basePath}/${originalFilename}`,
        thumbnail: `${basePath}/${thumbnailFilename}`,
        medium: `${basePath}/${mediumFilename}`,
        small: `${basePath}/${smallFilename}`,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: file.size
        }
      };

    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }
  async processMultipleImages(files, options = {}) {
    try {
      const results = [];
      for (const file of files) {
        const result = await this.processAndSaveImage(file, options);
        results.push(result);
      }
      return results;
    } catch (error) {
      throw new Error(`Failed to process multiple images: ${error.message}`);
    }
  }
  async deleteImage(imageUrl) {
    try {
      if (!imageUrl) return;

      const filename = path.basename(imageUrl);
      const baseName = path.basename(filename, path.extname(filename));
      const filesToDelete = [
        filename,
        `thumb_${baseName}.webp`,
        `medium_${baseName}.webp`,
        `small_${baseName}.webp`
      ];
      for (const file of filesToDelete) {
        const filepath = path.join(this.uploadDir, file);
        try {
          await fs.unlink(filepath);
          console.log(`Deleted image: ${file}`);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error(`Error deleting ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
  async deleteMultipleImages(imageUrls) {
    try {
      const deletions = imageUrls.map(url => this.deleteImage(url));
      await Promise.all(deletions);
    } catch (error) {
      throw new Error(`Failed to delete multiple images: ${error.message}`);
    }
  }
  validateImage(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedMimes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
  }
}

export default new ImageService();