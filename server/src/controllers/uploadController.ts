import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { ApiResponse } from '@/types';
import { createError } from '@/middleware/errorHandler';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;

    const response: ApiResponse = {
      success: true,
      data: {
        file: {
          id: file.filename,
          originalName: file.originalname,
          filename: file.filename,
          url: fileUrl,
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

export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    const files = req.files.map(file => ({
      id: file.filename,
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString()
    }));

    const response: ApiResponse = {
      success: true,
      data: { files }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      throw createError('Filename is required', 400);
    }

    const filePath = path.join(__dirname, '../../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
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

export const getFileInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      throw createError('Filename is required', 400);
    }

    const filePath = path.join(__dirname, '../../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();

    const response: ApiResponse = {
      success: true,
      data: {
        file: {
          filename,
          url: `/uploads/${filename}`,
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

function getFileType(ext: string): string {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  const audioExts = ['.mp3', '.wav', '.flac', '.ogg'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'other';
}
