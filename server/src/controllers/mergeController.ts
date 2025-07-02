import { Request, Response } from 'express';
import { ffmpegService, MergeOptions } from '../services/ffmpegService';
import { prisma } from '../config/database';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface MergeRequest {
  videoUrl: string;
  audioUrl: string;
  segmentId?: string; // Optional segment ID to update result_url
  options: MergeOptions;
}

export class MergeController {
  public async mergeVideoAudio(req: Request, res: Response): Promise<void> {
    try {
      const { videoUrl, audioUrl, segmentId, options }: MergeRequest = req.body;

      // Validate input
      if (!videoUrl || !audioUrl) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Both videoUrl and audioUrl are required',
            code: 'MISSING_MEDIA_URLS'
          }
        });
        return;
      }

      // Validate options
      const mergeOptions: MergeOptions = {
        duration: options?.duration || 'shortest',
        audioVolume: options?.audioVolume || 1.0,
        fadeIn: options?.fadeIn || 0,
        fadeOut: options?.fadeOut || 0,
        videoCodec: options?.videoCodec || 'copy',
        audioCodec: options?.audioCodec || 'copy'
      };

      // Create temporary directory for downloads
      const tempDir = path.join(process.cwd(), 'temp', uuidv4());
      await require('fs/promises').mkdir(tempDir, { recursive: true });

      try {
        // Download video and audio files
        const videoPath = path.join(tempDir, 'video.mp4');
        const audioPath = path.join(tempDir, 'audio.mp3');

        console.log('Downloading video from:', videoUrl);
        await ffmpegService.downloadFile(videoUrl, videoPath);
        
        console.log('Downloading audio from:', audioUrl);
        await ffmpegService.downloadFile(audioUrl, audioPath);

        // Merge video and audio
        console.log('Starting FFmpeg merge with options:', mergeOptions);
        const result = await ffmpegService.mergeVideoAudio(videoPath, audioPath, mergeOptions);

        // Generate public URL for the merged video
        const filename = path.basename(result.outputPath);
        const publicUrl = ffmpegService.getOutputUrl(filename);

        // Update segment with result_url if segmentId is provided
        if (segmentId) {
          await prisma.segment.update({
            where: { id: segmentId },
            data: { result_url: publicUrl }
          });
        }

        // Cleanup temporary files
        await ffmpegService.cleanupFile(videoPath);
        await ffmpegService.cleanupFile(audioPath);
        await require('fs/promises').rmdir(tempDir);

        res.json({
          success: true,
          data: {
            mergedVideoUrl: publicUrl,
            duration: result.duration,
            size: result.size,
            processingTime: result.processingTime,
            options: mergeOptions
          }
        });

      } catch (processingError) {
        // Cleanup on error
        try {
          await require('fs/promises').rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp directory:', cleanupError);
        }
        throw processingError;
      }

    } catch (error: any) {
      console.error('Merge error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to merge video and audio',
          code: 'MERGE_FAILED'
        }
      });
    }
  }

  public async getMergedVideo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', 'merged', filename);

      // Check if file exists
      try {
        await require('fs/promises').access(filePath);
      } catch {
        res.status(404).json({
          success: false,
          error: {
            message: 'Merged video not found',
            code: 'FILE_NOT_FOUND'
          }
        });
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Stream the file
      const fs = require('fs');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

    } catch (error: any) {
      console.error('File serving error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to serve merged video',
          code: 'FILE_SERVE_FAILED'
        }
      });
    }
  }
}

export const mergeController = new MergeController();
