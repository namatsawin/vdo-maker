import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface MergeOptions {
  duration: 'shortest' | 'longest' | 'video' | 'audio';
  audioVolume: number; // 0.0 to 2.0
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  videoCodec: 'copy' | 'h264' | 'h265';
  audioCodec: 'copy' | 'aac' | 'mp3';
}

export interface ConcatenateOptions {
  videoCodec: 'copy' | 'h264' | 'h265';
  audioCodec: 'copy' | 'aac' | 'mp3';
  resolution?: string; // e.g., '1920x1080'
  frameRate?: number; // e.g., 30
  addTransitions?: boolean;
  transitionDuration?: number; // seconds
}

export interface MergeResult {
  outputPath: string;
  duration: number;
  size: number;
  processingTime: number;
}

export interface ConcatenateResult {
  outputPath: string;
  duration: number;
  size: number;
  processingTime: number;
  segmentCount: number;
}

export class FFmpegService {
  private static instance: FFmpegService;
  private outputDir: string;

  constructor() {
    this.outputDir = process.env.FFMPEG_OUTPUT_DIR || path.join(process.cwd(), 'uploads', 'merged');
    this.ensureOutputDir();
  }

  public static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log('Output directory ensured:', this.outputDir);
      
      // Test write permissions
      const testFile = path.join(this.outputDir, 'test-write.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log('Output directory write permissions verified');
    } catch (error) {
      console.error('Failed to create or verify output directory:', error);
      throw new Error(`Output directory setup failed: ${error}`);
    }
  }

  public async mergeVideoAudio(
    videoPath: string,
    audioPath: string,
    options: MergeOptions
  ): Promise<MergeResult> {
    const startTime = Date.now();
    const outputFilename = `merged_${uuidv4()}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);

    console.log('Merge operation starting:');
    console.log('- Video path:', videoPath);
    console.log('- Audio path:', audioPath);
    console.log('- Output path:', outputPath);
    console.log('- Output directory:', this.outputDir);
    console.log('- Options:', options);

    // Ensure output directory exists
    await this.ensureOutputDir();

    // Verify input files exist
    try {
      await fs.access(videoPath);
      console.log('✓ Video file exists');
    } catch (error) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    try {
      await fs.access(audioPath);
      console.log('✓ Audio file exists');
    } catch (error) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    return new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(videoPath)
        .input(audioPath);

      // Apply duration strategy
      switch (options.duration) {
        case 'shortest':
          command = command.outputOptions('-shortest');
          break;
        case 'longest':
          break;
      }

      // Apply audio filters
      const audioFilters: string[] = [];
      
      if (options.audioVolume !== 1.0) {
        audioFilters.push(`volume=${options.audioVolume}`);
      }

      if (options.fadeIn > 0) {
        audioFilters.push(`afade=t=in:ss=0:d=${options.fadeIn}`);
      }

      if (options.fadeOut > 0) {
        audioFilters.push(`afade=t=out:st=0:d=${options.fadeOut}`);
      }

      if (audioFilters.length > 0) {
        console.log('Applying audio filters:', audioFilters.join(','));
        command = command.audioFilters(audioFilters.join(','));
      }

      // Apply video codec
      switch (options.videoCodec) {
        case 'copy':
          command = command.videoCodec('copy');
          break;
        case 'h264':
          command = command.videoCodec('libx264')
                          .outputOptions('-preset', 'medium')
                          .outputOptions('-crf', '23');
          break;
        case 'h265':
          command = command.videoCodec('libx265')
                          .outputOptions('-preset', 'medium')
                          .outputOptions('-crf', '28');
          break;
      }

      // Apply audio codec (only if not using audio filters)
      if (audioFilters.length === 0) {
        switch (options.audioCodec) {
          case 'copy':
            command = command.audioCodec('copy');
            break;
          case 'aac':
            command = command.audioCodec('aac')
                            .audioBitrate('128k');
            break;
          case 'mp3':
            command = command.audioCodec('libmp3lame')
                            .audioBitrate('128k');
            break;
        }
      } else {
        // When using audio filters, we need to re-encode audio
        switch (options.audioCodec) {
          case 'copy':
          case 'aac':
            command = command.audioCodec('aac')
                            .audioBitrate('128k');
            break;
          case 'mp3':
            command = command.audioCodec('libmp3lame')
                            .audioBitrate('128k');
            break;
        }
      }

      // Execute the command
      command
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', async () => {
          try {
            console.log('FFmpeg processing completed successfully');
            const stats = await fs.stat(outputPath);
            const processingTime = (Date.now() - startTime) / 1000;
            
            // Get duration of output file
            const duration = await this.getVideoDuration(outputPath);
            
            console.log('Merge result:', {
              outputPath,
              duration,
              size: stats.size,
              processingTime
            });
            
            resolve({
              outputPath,
              duration,
              size: stats.size,
              processingTime
            });
          } catch (error) {
            console.error('Failed to get output file stats:', error);
            reject(new Error(`Failed to get output file stats: ${error}`));
          }
        })
        .on('error', (error: any) => {
          console.error('FFmpeg error details:', {
            message: error.message,
            code: error.code,
            signal: error.signal,
            cmd: error.cmd
          });
          reject(new Error(`FFmpeg processing failed: ffmpeg exited with code ${error.code || 'unknown'}: ${error.message}`));
        })
        .run();
    });
  }

  public async concatenateVideos(
    videoPaths: string[],
    options: ConcatenateOptions
  ): Promise<ConcatenateResult> {
    const startTime = Date.now();
    const outputFilename = `concatenated_${uuidv4()}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);

    console.log('Concatenation operation starting:');
    console.log('- Video paths:', videoPaths);
    console.log('- Output path:', outputPath);
    console.log('- Options:', options);

    // Ensure output directory exists
    await this.ensureOutputDir();

    // Verify all input files exist
    for (const videoPath of videoPaths) {
      try {
        await fs.access(videoPath);
        console.log(`✓ Video file exists: ${videoPath}`);
      } catch (error) {
        throw new Error(`Video file not found: ${videoPath}`);
      }
    }

    // Create a temporary file list for FFmpeg concat demuxer
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    await fs.mkdir(tempDir, { recursive: true });
    const fileListPath = path.join(tempDir, 'filelist.txt');

    try {
      // Create file list content
      const fileListContent = videoPaths
        .map(videoPath => `file '${videoPath.replace(/'/g, "'\\''")}'`)
        .join('\n');
      
      await fs.writeFile(fileListPath, fileListContent);
      console.log('Created file list:', fileListPath);
      console.log('File list content:', fileListContent);

      return new Promise((resolve, reject) => {
        let command = ffmpeg()
          .input(fileListPath)
          .inputOptions('-f', 'concat')
          .inputOptions('-safe', '0');

        // Apply video codec
        switch (options.videoCodec) {
          case 'copy':
            command = command.videoCodec('copy');
            break;
          case 'h264':
            command = command.videoCodec('libx264')
                            .outputOptions('-preset', 'medium')
                            .outputOptions('-crf', '23');
            break;
          case 'h265':
            command = command.videoCodec('libx265')
                            .outputOptions('-preset', 'medium')
                            .outputOptions('-crf', '28');
            break;
        }

        // Apply audio codec
        switch (options.audioCodec) {
          case 'copy':
            command = command.audioCodec('copy');
            break;
          case 'aac':
            command = command.audioCodec('aac')
                            .audioBitrate('128k');
            break;
          case 'mp3':
            command = command.audioCodec('libmp3lame')
                            .audioBitrate('128k');
            break;
        }

        // Apply resolution if specified
        if (options.resolution) {
          command = command.size(options.resolution);
        }

        // Apply frame rate if specified
        if (options.frameRate) {
          command = command.fps(options.frameRate);
        }

        // Execute the command
        command
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg concatenation command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Concatenation progress: ' + progress.percent + '% done');
          })
          .on('end', async () => {
            try {
              console.log('FFmpeg concatenation completed successfully');
              const stats = await fs.stat(outputPath);
              const processingTime = (Date.now() - startTime) / 1000;
              
              // Get duration of output file
              const duration = await this.getVideoDuration(outputPath);
              
              // Cleanup temp directory
              await fs.rm(tempDir, { recursive: true, force: true });
              
              console.log('Concatenation result:', {
                outputPath,
                duration,
                size: stats.size,
                processingTime,
                segmentCount: videoPaths.length
              });
              
              resolve({
                outputPath,
                duration,
                size: stats.size,
                processingTime,
                segmentCount: videoPaths.length
              });
            } catch (error) {
              console.error('Failed to get output file stats:', error);
              reject(new Error(`Failed to get output file stats: ${error}`));
            }
          })
          .on('error', async (error: any) => {
            console.error('FFmpeg concatenation error details:', {
              message: error.message,
              code: error.code,
              signal: error.signal,
              cmd: error.cmd
            });
            
            // Cleanup temp directory on error
            try {
              await fs.rm(tempDir, { recursive: true, force: true });
            } catch (cleanupError) {
              console.warn('Failed to cleanup temp directory:', cleanupError);
            }
            
            reject(new Error(`FFmpeg concatenation failed: ffmpeg exited with code ${error.code || 'unknown'}: ${error.message}`));
          })
          .run();
      });

    } catch (error) {
      // Cleanup temp directory on error
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp directory:', cleanupError);
      }
      throw error;
    }
  }

  public async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const duration = metadata.format.duration || 0;
        resolve(duration);
      });
    });
  }

  public async downloadFile(url: string, outputPath: string): Promise<string> {
    const axios = require('axios');
    const writer = require('fs').createWriteStream(outputPath);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  }

  public async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to cleanup file:', filePath, error);
    }
  }

  public getOutputUrl(filename: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/api/media/merged/${filename}`;
  }
}

export const ffmpegService = FFmpegService.getInstance();
