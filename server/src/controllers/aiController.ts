import { Request, Response, NextFunction } from 'express';
import { geminiService } from '@/services/geminiService';
import { imagen4Service } from '@/services/imagen4Service';
import { klingAIService } from '@/services/klingAIService';
import { ApiResponse, ScriptGenerationRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

export const generateScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, model } = req.body;

    if (!title) {
      throw createError('Title is required', 400);
    }

    const request: ScriptGenerationRequest = {
      title,
      description,
      model
    };

    const segments = await geminiService.generateScript(request);

    const response: ApiResponse = {
      success: true,
      data: {
        segments,
        generatedAt: new Date().toISOString(),
        model: model || 'gemini-1.5-flash'
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, aspectRatio, safetyFilterLevel, personGeneration } = req.body;

    if (!prompt) {
      throw createError('Image prompt is required', 400);
    }

    // Validate the prompt
    const validation = await imagen4Service.validateImagePrompt(prompt);
    if (!validation.valid) {
      throw createError(`Invalid prompt: ${validation.reason}`, 400);
    }

    const result = await imagen4Service.generateImage({
      prompt,
      aspectRatio,
      safetyFilterLevel,
      personGeneration
    });

    if (!result.success) {
      throw createError(result.error || 'Image generation failed', 500);
    }

    const response: ApiResponse = {
      success: true,
      data: result
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, imageBase64, prompt, duration, aspectRatio, mode } = req.body;

    if (!prompt) {
      throw createError('Video prompt is required', 400);
    }

    // Validate the request
    const validation = await klingAIService.validateVideoRequest({
      imageUrl,
      imageBase64,
      prompt,
      duration,
      aspectRatio,
      mode
    });

    if (!validation.valid) {
      throw createError(`Invalid request: ${validation.reason}`, 400);
    }

    const result = await klingAIService.generateVideo({
      imageUrl,
      imageBase64,
      prompt,
      duration,
      aspectRatio,
      mode
    });

    if (!result.success) {
      throw createError(result.error || 'Video generation failed', 500);
    }

    const response: ApiResponse = {
      success: true,
      data: result
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getVideoStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      throw createError('Task ID is required', 400);
    }

    const result = await klingAIService.getVideoStatus(taskId);

    const response: ApiResponse = {
      success: true,
      data: result
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
    const { text, voice = 'default', model } = req.body;

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
        model: model || 'gemini-1.5-flash',
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

export const generateIdeas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, model, count = 5 } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw createError('Topic is required and must be a non-empty string', 400);
    }

    if (count < 1 || count > 10) {
      throw createError('Count must be between 1 and 10', 400);
    }

    const ideas = await geminiService.generateVideoIdeas({
      topic: topic.trim(),
      model,
      count
    });

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
        testedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
