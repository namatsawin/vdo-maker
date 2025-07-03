#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/utils/logger';

/**
 * Migration script to organize existing uploads into categorized folders
 * This script moves files from the root uploads directory to organized subdirectories
 */

// Helper function to determine file category based on extension
const getFileCategory = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  const audioExts = ['.mp3', '.wav', '.flac', '.ogg'];
  
  if (imageExts.includes(ext)) return 'images';
  if (videoExts.includes(ext)) return 'videos';
  if (audioExts.includes(ext)) return 'audios';
  return 'others';
};

// Helper function to ensure directory exists
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

async function migrateUploads() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      logger.error('Uploads directory does not exist');
      return;
    }

    // Create category directories
    const categories = ['images', 'videos', 'audios', 'others'];
    categories.forEach(category => {
      const categoryDir = path.join(uploadsDir, category);
      ensureDirectoryExists(categoryDir);
    });

    // Get all files in the root uploads directory
    const files = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);

    if (files.length === 0) {
      logger.info('No files found in uploads directory to migrate');
      return;
    }

    logger.info(`Found ${files.length} files to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each file
    for (const filename of files) {
      try {
        const sourcePath = path.join(uploadsDir, filename);
        const category = getFileCategory(filename);
        const targetDir = path.join(uploadsDir, category);
        const targetPath = path.join(targetDir, filename);

        // Check if target file already exists
        if (fs.existsSync(targetPath)) {
          logger.warn(`File already exists in target location, skipping: ${filename}`);
          skippedCount++;
          continue;
        }

        // Move file to appropriate category folder
        fs.renameSync(sourcePath, targetPath);
        logger.info(`Moved ${filename} to ${category}/`);
        migratedCount++;

      } catch (error) {
        logger.error(`Error migrating file ${filename}:`, error);
        errorCount++;
      }
    }

    // Summary
    logger.info('Migration completed!');
    logger.info(`✅ Migrated: ${migratedCount} files`);
    logger.info(`⏭️  Skipped: ${skippedCount} files`);
    logger.info(`❌ Errors: ${errorCount} files`);

    if (migratedCount > 0) {
      logger.info('Files have been organized into:');
      categories.forEach(category => {
        const categoryDir = path.join(uploadsDir, category);
        const categoryFiles = fs.readdirSync(categoryDir);
        logger.info(`  📁 ${category}: ${categoryFiles.length} files`);
      });
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateUploads()
    .then(() => {
      logger.info('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateUploads };
