import { Request, Response, NextFunction } from 'express';
import { geminiService, GeminiTTSModel } from '@/services/geminiService';
import { GeminiImageModel, imagen4Service } from '@/services/imagen4Service';
import { klingAIService } from '@/services/klingAIService';
import { ApiResponse, AuthenticatedRequest, ScriptGenerationRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';
import prisma from '@/config/database';

export const generateScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, model, systemInstructionId } = req.body;

    if (!title) {
      throw createError('Title is required', 400);
    }

    if (!model) {
      throw createError('Model is required', 400);
    }

    if (!systemInstructionId) {
      throw createError('systemInstructionId is required', 400);
    }

    const instruction = await prisma.systemInstruction.findUnique({
      where: { id: systemInstructionId, isActive: true }
    });

    if (!instruction) {
      throw createError('systemInstruction could not be found', 404);
    }

    const request: ScriptGenerationRequest = {
      title,
      description,
      systemInstruction: instruction.instruction,
      model
    };

    const segments = await geminiService.generateScript(request);

    const response: ApiResponse = {
      success: true,
      data: {
        segments,
        generatedAt: new Date().toISOString(),
        model: model
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const reviseScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { originalScript, model } = req.body;

    if (!originalScript || typeof originalScript !== 'string' || originalScript.trim().length === 0) {
      throw createError('Original script is required and must be a non-empty string', 400);
    }

    const revision = await geminiService.reviseScriptForShorterDuration(originalScript, model);

    const response: ApiResponse = {
      success: true,
      data: {
        ...revision,
        processedAt: new Date().toISOString(),
        model: model || 'gemini-2.5-flash'
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getSegmentImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segmentId } = req.params;

    if (!segmentId) {
      throw createError('Segment ID is required', 400);
    }

    // Get all images for the segment, ordered by creation date (newest first)
    const images = await prisma.image.findMany({
      where: { segmentId },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: { images }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const selectImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;

    if (!imageId) {
      throw createError('Image ID is required', 400);
    }

    // Get the image to find its segment
    const image = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw createError('Image not found', 404);
    }

    // Update selection in a transaction
    await prisma.$transaction(async (tx) => {
      // Unselect all images for this segment
      await tx.image.updateMany({
        where: { segmentId: image.segmentId },
        data: { isSelected: false }
      });

      // Select the specified image
      await tx.image.update({
        where: { id: imageId },
        data: { isSelected: true }
      });
    });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Image selected successfully' }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const selectVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      throw createError('Video ID is required', 400);
    }

    // Get the video to find its segment
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      throw createError('Video not found', 404);
    }

    // Update selection in a transaction
    await prisma.$transaction(async (tx) => {
      // Unselect all videos for this segment
      await tx.video.updateMany({
        where: { segmentId: video.segmentId },
        data: { isSelected: false }
      });

      // Select the specified video
      await tx.video.update({
        where: { id: videoId },
        data: { isSelected: true }
      });
    });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Video selected successfully' }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      prompt, 
      segmentId,
      aspectRatio = '1:1', 
      safetyFilterLevel, 
      personGeneration, 
      model = GeminiImageModel.Imagen3
    } = req.body;

    if (!prompt) {
      throw createError('Image prompt is required', 400);
    }

    if (!segmentId) {
      throw createError('Segment ID is required', 400);
    }

    // Validate that the segment exists
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId }
    });

    if (!segment) {
      throw createError('Segment not found', 404);
    }

    // Validate the prompt
    const validation = await imagen4Service.validateImagePrompt(prompt);
    if (!validation.valid) {
      throw createError(`Invalid prompt: ${validation.reason}`, 400);
    }

    // Generate the image
    const result = await imagen4Service.generateImage({
      prompt,
      aspectRatio,
      personGeneration,
      safetyFilterLevel,
      model
    });

    if (!result.success) {
      throw createError(result.error || 'Image generation failed', 500);
    }

    // Save the image to uploads folder and create database record
    if (result.imageBase64) {
      const fs = require('fs');
      const path = require('path');
      
      // Create uploads/images directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const imagesDir = path.join(uploadsDir, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `image_${segmentId}_${timestamp}.png`;
      const filepath = path.join(imagesDir, filename);
      
      // Save base64 image to file
      const buffer = Buffer.from(result.imageBase64, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      // Create the full image URL (same pattern as audio URLs)
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
      const imageUrl = `${backendUrl}/uploads/images/${filename}`;
      
      // Save to database - create new image and set as selected
      const imageRecord = await prisma.$transaction(async (tx) => {
        // First, unselect any previously selected images for this segment
        await tx.image.updateMany({
          where: { segmentId },
          data: { isSelected: false }
        });

        // Create new image and set as selected
        return await tx.image.create({
          data: {
            segmentId,
            url: imageUrl,
            prompt,
            isSelected: true, // New image is automatically selected
            metadata: JSON.stringify({
              aspectRatio,
              model,
              personGeneration,
              generationTime: result.metadata?.generationTime,
              timestamp
            })
          }
        });
      });

      const response: ApiResponse = {
        success: true,
        data: {
          success: true,
          imageUrl,
          imageId: imageRecord.id,
          metadata: result.metadata
        }
      };

      res.json(response);
    } else {
      throw createError('No image data received from generation service', 500);
    }
  } catch (error) {
    next(error);
  }
};

export const generateVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      segmentId,
      imageUrl, 
      prompt, 
      negativePrompt, 
      duration = 5, 
      mode = 'std' 
    } = req.body;

    if (!segmentId) {
      throw createError('SegmentId is required', 400);
    }

    if (!prompt) {
      throw createError('Prompt is required', 400);
    }

    if (!imageUrl) {
      throw createError('Image is required', 400);
    }
    
    const result = await klingAIService.generateVideo({
      imageUrl,
      prompt,
      duration,
      mode,
      negativePrompt
    })

    const record = await prisma.$transaction(async (tx) => {
      // First, unselect any previously selected videos for this segment
      await tx.video.updateMany({
        where: { segmentId },
        data: { isSelected: false }
      });

      // Create new video and set as selected
      return await tx.video.create({
        data: {
          url: '', // Placeholder URL, will be updated when video is ready
          prompt,
          duration,
          segmentId,
          taskId: result.taskId,
          status: result.status,
          isSelected: true, // New video is automatically selected
          metadata: JSON.stringify({ 
            mode: result.input?.mode, 
            negative_prompt: result.input?.negative_prompt,
            status: result.status, // Include status in metadata for frontend filtering
            taskId: result.taskId
          })
        }
      });
    });

    const response: ApiResponse = {
      success: true,
      data: {
        taskId: result.taskId,
        status: result.status,
        record: record,
        message: 'Video generation task created successfully'
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getVideoStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      throw createError('Task ID is required', 400);
    }

    const record = await prisma.video.findFirst({ where: { taskId } })

    if (!record) {
      throw createError(`Video with the task is not found`, 400);
    }

    if (record.status === 'completed') {
      const response: ApiResponse = {
        success: true,
        data: {
          taskId: taskId,
          status: record.status,
        }
      };

      res.json(response);
      return;
    }

    const result = await klingAIService.getVideoStatus(taskId)

    if (record.status !== result.status) {
      await prisma.video.update({
        where: { id: record.id },
        data: { status: result.status, url: result.videoUrl, metadata: JSON.stringify(result.metadata ?? {}) }
      })
    }
    
    const response: ApiResponse = {
      success: true,
      data: {
        taskId: taskId,
        status: result.status,
        metadata: result.metadata
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const cancelVideoGeneration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      throw createError('Task ID is required', 400);
    }

    const result = await klingAIService.cancelVideoGeneration(taskId);

    const response: ApiResponse = {
      success: true,
      data: result
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateTTS = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voice, model } = req.body;


    if (!text) {
      throw createError('Text is required', 400);
    }

    if (text.length > 5000) {
      throw createError('Text too long. Maximum 5000 characters allowed', 400);
    }

    const audioUrl = await geminiService.generateTextToSpeech(text, voice, model);

    const response: ApiResponse = {
      success: true,
      data: {
        audioUrl,
        text,
        voice,
        model: model,
        generatedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getAvailableModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = geminiService.getAvailableModels();

    const response: ApiResponse = {
      success: true,
      data: {
        models,
        retrievedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getAvailableVoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voices = geminiService.getAvailableVoices();

    const response: ApiResponse = {
      success: true,
      data: {
        voices,
        retrievedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateIdeas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { topic, model, count = 5, existingIdeas = [] } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw createError('Topic is required and must be a non-empty string', 400);
    }

    if (count < 1 || count > 10) {
      throw createError('Count must be between 1 and 10', 400);
    }

    const projects = await prisma.project.findMany({ where: { userId }})

    const existingTopics = [ ...existingIdeas, ...projects.map(item => item.title)]

    const ideas = await geminiService.generateVideoIdeas({
      topic: topic.trim(),
      model,
      count
    }, existingTopics);

    const response: ApiResponse = {
      success: true,
      data: {
        ideas,
        topic: topic.trim(),
        model: model || 'gemini-2.5-flash',
        count: ideas.length,
        generatedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const analyzeImagePrompt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      throw createError('Prompt is required and must be a string', 400);
    }

    if (prompt.trim().length === 0) {
      throw createError('Prompt cannot be empty', 400);
    }

    const analysis = await geminiService.analyzeAndReviseContent(prompt.trim());

    const response: ApiResponse = {
      success: true,
      data: analysis
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const testAIConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [geminiStatus, imagen4Status, klingStatus] = await Promise.all([
      geminiService.testConnection(),
      imagen4Service.getGenerationStatus(),
      klingAIService.getGenerationStatus()
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        services: {
          gemini: geminiStatus ? 'connected' : 'disconnected',
          imagen4: imagen4Status.configured ? 'configured' : 'fallback_mode',
          klingAI: klingStatus.configured ? 'configured' : 'fallback_mode'
        },
        imageModels: imagen4Status.models || [],
        testedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
