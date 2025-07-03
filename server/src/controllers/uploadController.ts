import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { ApiResponse } from '@/types';
import { createError } from '@/middleware/errorHandler';
import { getFileCategory } from '@/middleware/upload';

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const file = req.file;
    const category = getFileCategory(file.originalname);
    const fileUrl = `/uploads/${category}/${file.filename}`;

    const response: ApiResponse = {
      success: true,
      data: {
        file: {
          id: file.filename,
          originalName: file.originalname,
          filename: file.filename,
          url: fileUrl,
          category,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString()
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    const files = req.files.map(file => {
      const category = getFileCategory(file.originalname);
      return {
        id: file.filename,
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/${category}/${file.filename}`,
        category,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString()
      };
    });

    const response: ApiResponse = {
      success: true,
      data: { files }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    const { category } = req.query;
    
    if (!filename) {
      throw createError('Filename is required', 400);
    }

    let filePath: string | undefined;
    
    if (category && typeof category === 'string') {
      // If category is provided, use it directly
      filePath = path.join(__dirname, '../../uploads', category, filename);
    } else {
      // Try to find the file in all category directories
      const categories = ['images', 'videos', 'audios', 'others', 'merged'];
      let found = false;
      
      for (const cat of categories) {
        const testPath = path.join(__dirname, '../../uploads', cat, filename);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          found = true;
          break;
        }
      }
      
      // Also check the root uploads directory for legacy files
      if (!found) {
        const rootPath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(rootPath)) {
          filePath = rootPath;
          found = true;
        }
      }
      
      if (!found) {
        throw createError('File not found', 404);
      }
    }
    
    // Check if file exists
    if (!filePath || !fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    // Delete file
    fs.unlinkSync(filePath);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'File deleted successfully',
        filename
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getFileInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    const { category } = req.query;
    
    if (!filename) {
      throw createError('Filename is required', 400);
    }

    let filePath: string | undefined;
    let fileCategory: string | undefined;
    
    if (category && typeof category === 'string') {
      // If category is provided, use it directly
      filePath = path.join(process.cwd(), 'uploads', category, filename);
      fileCategory = category;
    } else {
      // Try to find the file in all category directories
      const categories = ['images', 'videos', 'audios', 'others', 'merged'];
      let found = false;
      
      for (const cat of categories) {
        const testPath = path.join(process.cwd(), 'uploads', cat, filename);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          fileCategory = cat;
          found = true;
          break;
        }
      }
      
      // Also check the root uploads directory for legacy files
      if (!found) {
        const rootPath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(rootPath)) {
          filePath = rootPath;
          fileCategory = 'root';
          found = true;
        }
      }
      
      if (!found) {
        throw createError('File not found', 404);
      }
    }
    
    // Check if file exists
    if (!filePath || !fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const fileUrl = fileCategory === 'root' ? `/uploads/${filename}` : `/uploads/${fileCategory}/${filename}`;

    const response: ApiResponse = {
      success: true,
      data: {
        file: {
          filename,
          url: fileUrl,
          category: fileCategory,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          extension: ext,
          type: getFileType(ext)
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getUploadStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const categories = ['images', 'videos', 'audios', 'others', 'merged'];
    
    const stats: any = {
      totalFiles: 0,
      totalSize: 0,
      categories: {}
    };

    // Check each category
    for (const category of categories) {
      const categoryDir = path.join(uploadsDir, category);
      let categoryFiles = 0;
      let categorySize = 0;

      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir);
        categoryFiles = files.length;
        
        // Calculate total size for this category
        for (const file of files) {
          const filePath = path.join(categoryDir, file);
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            categorySize += stat.size;
          }
        }
      }

      stats.categories[category] = {
        fileCount: categoryFiles,
        totalSize: categorySize,
        formattedSize: formatFileSize(categorySize)
      };

      stats.totalFiles += categoryFiles;
      stats.totalSize += categorySize;
    }

    // Check for legacy files in root uploads directory
    const rootFiles = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);

    if (rootFiles.length > 0) {
      let rootSize = 0;
      for (const file of rootFiles) {
        const filePath = path.join(uploadsDir, file);
        const stat = fs.statSync(filePath);
        rootSize += stat.size;
      }

      stats.categories.root = {
        fileCount: rootFiles.length,
        totalSize: rootSize,
        formattedSize: formatFileSize(rootSize)
      };

      stats.totalFiles += rootFiles.length;
      stats.totalSize += rootSize;
    }

    stats.formattedTotalSize = formatFileSize(stats.totalSize);

    const response: ApiResponse = {
      success: true,
      data: { stats }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const listFilesByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!category) {
      throw createError('Category is required', 400);
    }

    const validCategories = ['images', 'videos', 'audios', 'others', 'merged', 'root'];
    if (!validCategories.includes(category)) {
      throw createError(`Invalid category. Valid categories: ${validCategories.join(', ')}`, 400);
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const categoryDir = category === 'root' ? uploadsDir : path.join(uploadsDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      const response: ApiResponse = {
        success: true,
        data: {
          files: [],
          pagination: {
            total: 0,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: false
          }
        }
      };
      res.json(response);
      return;
    }

    let allFiles = fs.readdirSync(categoryDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);

    // For root category, exclude directories
    if (category === 'root') {
      const categories = ['images', 'videos', 'audios', 'others', 'merged'];
      allFiles = allFiles.filter(file => {
        const filePath = path.join(categoryDir, file);
        return fs.statSync(filePath).isFile();
      });
    }

    const total = allFiles.length;
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedFiles = allFiles.slice(startIndex, endIndex);

    // Get file details
    const files = paginatedFiles.map(filename => {
      const filePath = path.join(categoryDir, filename);
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const fileUrl = category === 'root' ? `/uploads/${filename}` : `/uploads/${category}/${filename}`;

      return {
        filename,
        url: fileUrl,
        category,
        size: stats.size,
        formattedSize: formatFileSize(stats.size),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: ext,
        type: getFileType(ext)
      };
    });

    const response: ApiResponse = {
      success: true,
      data: {
        files,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: endIndex < total
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(ext: string): string {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  const audioExts = ['.mp3', '.wav', '.flac', '.ogg'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'other';
}
