import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORMAT_EXTENSIONS = { webp: '.webp', jpeg: '.jpg', png: '.png' };

class ImageService {
  constructor() {
    this.baseUploadDir = process.env.NODE_ENV === 'production' 
      ? '/var/www/uploads'
      : path.join(process.cwd(), 'uploads');
  }

  async getUploadDir(subDir = 'products') {
    const uploadDir = path.join(this.baseUploadDir, subDir);
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }
    return uploadDir;
  }

  generateFilename(originalname, prefix = 'img', outputExtension = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const sourceExtension = path.extname(originalname).toLowerCase();
    const extension = outputExtension || sourceExtension;
    const baseName = path.basename(originalname, sourceExtension).replace(/[^a-zA-Z0-9]/g, '_');

    return `${prefix}_${baseName}_${timestamp}_${random}${extension}`;
  }

  async processAndSaveImage(file, subDir = 'products', options = {}) {
    const {
      width = 1200,
      height = 1200,
      quality = 80,
      format = 'webp',
      prefix = subDir.replace(/s$/, '') // simple plural to singular for prefix
    } = options;

    const uploadDir = await this.getUploadDir(subDir);

    try {
      await this.validateImage(file);
      // The "original" output is always re-encoded (default webp) regardless of the
      // uploaded file's format, so its filename must carry the OUTPUT format's
      // extension, not the source file's — otherwise the extension lies about the
      // actual content (and Express would serve it with the wrong Content-Type).
      const originalFilename = this.generateFilename(file.originalname, prefix, FORMAT_EXTENSIONS[format] || '.webp');
      const filepath = path.join(uploadDir, originalFilename);
      
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

      const thumbnailFilename = `thumb_${path.basename(originalFilename, path.extname(originalFilename))}.webp`;
      const thumbnailPath = path.join(uploadDir, thumbnailFilename);

      const mediumFilename = `medium_${path.basename(originalFilename, path.extname(originalFilename))}.webp`;
      const mediumPath = path.join(uploadDir, mediumFilename);

      const smallFilename = `small_${path.basename(originalFilename, path.extname(originalFilename))}.webp`;
      const smallPath = path.join(uploadDir, smallFilename);

      // Run all size variants concurrently — each is an independent encode, so
      // wall-clock time is bounded by the slowest one instead of their sum.
      await Promise.all([
        imageProcessor.toFile(filepath),
        sharp(file.buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
            withoutEnlargement: true
          })
          .webp({
            quality: 70,
            effort: 3
          })
          .toFile(thumbnailPath),
        sharp(file.buffer)
          .resize(800, 800, {
            fit: 'cover',
            withoutEnlargement: true
          })
          .webp({
            quality: 75,
            effort: 3
          })
          .toFile(mediumPath),
        sharp(file.buffer)
          .resize(300, 300, {
            fit: 'cover',
            withoutEnlargement: true
          })
          .webp({
            quality: 65,
            effort: 2
          })
          .toFile(smallPath),
      ]);

      const basePath = `/uploads/${subDir}`;

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

  async processMultipleImages(files, subDir = 'products', options = {}) {
    try {
      return await Promise.all(
        files.map((file) => this.processAndSaveImage(file, subDir, options))
      );
    } catch (error) {
      throw new Error(`Failed to process multiple images: ${error.message}`);
    }
  }

  async deleteImage(imageUrl) {
    try {
      if (!imageUrl) return;

      // Extract subDir and filename from URL
      // e.g., /uploads/products/product_name.webp -> products, product_name.webp
      const parts = imageUrl.split('/');
      const filename = parts.pop();
      const subDir = parts.pop();
      
      if (!subDir || subDir === 'uploads') {
         // Fallback if URL structure is different
         const uploadDir = path.join(this.baseUploadDir, 'products');
         await this._deleteFiles(uploadDir, filename);
      } else {
         const uploadDir = path.join(this.baseUploadDir, subDir);
         await this._deleteFiles(uploadDir, filename);
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  async _deleteFiles(uploadDir, filename) {
    const baseName = path.basename(filename, path.extname(filename));
    const filesToDelete = [
      filename,
      `thumb_${baseName}.webp`,
      `medium_${baseName}.webp`,
      `small_${baseName}.webp`
    ];

    for (const file of filesToDelete) {
      const filepath = path.join(uploadDir, file);
      try {
        await fs.unlink(filepath);
        console.log(`Deleted image: ${file}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Error deleting ${file}:`, error);
        }
      }
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

  async validateImage(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedMimes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB
      throw new Error('File size too large. Maximum size is 20MB.');
    }

    // Client-declared mimetype/extension can be spoofed — verify the actual file
    // content (magic bytes) matches one of the allowed image types.
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !allowedMimes.includes(detected.mime)) {
      throw new Error('File content does not match a supported image type.');
    }

    return true;
  }
}

export default new ImageService();
