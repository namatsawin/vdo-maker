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

export interface MergeResult {
  outputPath: string;
  duration: number;
  size: number;
  processingTime: number;
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
    } catch (error) {
      console.error('Failed to create output directory:', error);
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
          // Use the longer duration, pad shorter stream
          command = command.outputOptions('-filter_complex', '[0:v][1:a]concat=n=1:v=1:a=1[outv][outa]')
                          .outputOptions('-map', '[outv]', '-map', '[outa]');
          break;
        case 'video':
          // Match video duration, loop or truncate audio
          command = command.outputOptions('-filter_complex', '[1:a]aloop=loop=-1:size=2e+09[looped_audio]')
                          .outputOptions('-map', '0:v', '-map', '[looped_audio]')
                          .outputOptions('-t', '$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 ' + videoPath + ')');
          break;
        case 'audio':
          // Match audio duration, loop or truncate video
          command = command.outputOptions('-filter_complex', '[0:v]loop=loop=-1:size=2e+09[looped_video]')
                          .outputOptions('-map', '[looped_video]', '-map', '1:a')
                          .outputOptions('-t', '$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 ' + audioPath + ')');
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
            const stats = await fs.stat(outputPath);
            const processingTime = (Date.now() - startTime) / 1000;
            
            // Get duration of output file
            const duration = await this.getVideoDuration(outputPath);
            
            resolve({
              outputPath,
              duration,
              size: stats.size,
              processingTime
            });
          } catch (error) {
            reject(new Error(`Failed to get output file stats: ${error}`));
          }
        })
        .on('error', (error) => {
          console.error('FFmpeg error:', error);
          reject(new Error(`FFmpeg processing failed: ${error.message}`));
        })
        .run();
    });
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
