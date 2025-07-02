import { Request, Response } from 'express';
import { ffmpegService, MergeOptions, ConcatenateOptions } from '../services/ffmpegService';
import { prisma } from '../config/database';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface MergeRequest {
  videoUrl: string;
  audioUrl: string;
  segmentId?: string; // Optional segment ID to update result_url
  options: MergeOptions;
}

export interface ConcatenateRequest {
  projectId: string;
  segmentUrls: string[]; // Array of segment result URLs in order
  options: ConcatenateOptions;
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

  public async concatenateSegments(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, segmentUrls, options }: ConcatenateRequest = req.body;

      // Validate input
      if (!projectId || !segmentUrls || !Array.isArray(segmentUrls) || segmentUrls.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: 'projectId and segmentUrls array are required',
            code: 'MISSING_REQUIRED_FIELDS'
          }
        });
        return;
      }

      // Validate options
      const concatenateOptions: ConcatenateOptions = {
        videoCodec: options?.videoCodec || 'copy',
        audioCodec: options?.audioCodec || 'copy',
        resolution: options?.resolution,
        frameRate: options?.frameRate,
        addTransitions: options?.addTransitions || false,
        transitionDuration: options?.transitionDuration || 0.5
      };

      // Create temporary directory for downloads
      const tempDir = path.join(process.cwd(), 'temp', uuidv4());
      await require('fs/promises').mkdir(tempDir, { recursive: true });

      try {
        // Download all segment videos
        const downloadedPaths: string[] = [];
        
        for (let i = 0; i < segmentUrls.length; i++) {
          const segmentUrl = segmentUrls[i];
          const segmentPath = path.join(tempDir, `segment_${i + 1}.mp4`);
          
          console.log(`Downloading segment ${i + 1} from:`, segmentUrl);
          await ffmpegService.downloadFile(segmentUrl, segmentPath);
          downloadedPaths.push(segmentPath);
        }

        // Concatenate all segments
        console.log('Starting FFmpeg concatenation with options:', concatenateOptions);
        const result = await ffmpegService.concatenateVideos(downloadedPaths, concatenateOptions);

        // Generate public URL for the concatenated video
        const filename = path.basename(result.outputPath);
        const publicUrl = ffmpegService.getOutputUrl(filename);

        // Update project with final video URL
        await prisma.project.update({
          where: { id: projectId },
          data: { 
            final_video_url: publicUrl,
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });

        // Cleanup temporary files
        for (const filePath of downloadedPaths) {
          await ffmpegService.cleanupFile(filePath);
        }
        await require('fs/promises').rmdir(tempDir);

        res.json({
          success: true,
          data: {
            concatenatedVideoUrl: publicUrl,
            duration: result.duration,
            size: result.size,
            processingTime: result.processingTime,
            segmentCount: result.segmentCount,
            options: concatenateOptions
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
      console.error('Concatenation error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to concatenate video segments',
          code: 'CONCATENATION_FAILED'
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
