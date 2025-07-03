import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { logger } from '@/utils/logger';
import { connectDatabase } from '@/config/database';

// Routes
import authRoutes from '@/routes/auth';
import uploadRoutes from '@/routes/upload';
import aiRoutes from '@/routes/ai';
import projectRoutes from '@/routes/projects';
import mergeRoutes from '@/routes/mergeRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
// app.use(rateLimiter);

// Handle preflight requests for uploads
app.options('/uploads/*', cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Range', 'Content-Range', 'Accept', 'Accept-Encoding', 'User-Agent'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

// Serve uploaded files with CORS headers - support categorized folders
app.use('/uploads', cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Range', 'Content-Range', 'Accept', 'Accept-Encoding', 'User-Agent'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}), express.static(path.join(__dirname, '../uploads')));

// Handle CORS for API endpoints
app.use('/api', cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    environment: process.env.NODE_ENV,
    database: 'Connected'
  });
});

// API Routes
import systemInstructionRoutes from './routes/systemInstructionRoutes';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);
app.use(`/api/${API_VERSION}/projects`, projectRoutes);
app.use(`/api/${API_VERSION}/system-instructions`, systemInstructionRoutes);
app.use(`/api/${API_VERSION}/merge`, mergeRoutes);
app.use(`/api/media`, mergeRoutes);

app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    message: 'VDO Maker API Server',
    version: API_VERSION,
    status: 'Running',
    endpoints: {
      health: '/health',
      auth: `/api/${API_VERSION}/auth`,
      projects: `/api/${API_VERSION}/projects`,
      ai: `/api/${API_VERSION}/ai`,
      upload: `/api/${API_VERSION}/upload`,
      systemInstructions: `/api/${API_VERSION}/system-instructions`,
      merge: `/api/${API_VERSION}/merge`
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method
    }
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Create uploads directory structure
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      logger.info('Created uploads directory');
    }

    // Create categorized upload directories
    const categories = ['images', 'videos', 'audios', 'others'];
    categories.forEach(category => {
      const categoryDir = path.join(uploadsDir, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
        logger.info(`Created uploads/${category} directory`);
      }
    });

    // Create merged videos directory
    const mergedDir = path.join(__dirname, '../uploads/merged');
    if (!fs.existsSync(mergedDir)) {
      fs.mkdirSync(mergedDir, { recursive: true });
      logger.info('Created merged videos directory');
    }

    // Create temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      logger.info('Created temp directory');
    }

    // Create logs directory
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info('Created logs directory');
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📁 Uploads: ${uploadsDir}`);
      logger.info(`🗄️ Database: PostgreSQL connected`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
