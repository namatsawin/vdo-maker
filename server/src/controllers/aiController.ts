import { Request, Response, NextFunction } from 'express';
import { geminiService } from '@/services/geminiService';
import { ApiResponse, ScriptGenerationRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

export const generateScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      throw createError('Title is required', 400);
    }

    const request: ScriptGenerationRequest = {
      title,
      description
    };

    const segments = await geminiService.generateScript(request);

    const response: ApiResponse = {
      success: true,
      data: {
        segments,
        generatedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateTTS = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voice = 'default' } = req.body;

    if (!text) {
      throw createError('Text is required', 400);
    }

    if (text.length > 5000) {
      throw createError('Text too long. Maximum 5000 characters allowed', 400);
    }

    const audioUrl = await geminiService.generateTextToSpeech(text, voice);

    const response: ApiResponse = {
      success: true,
      data: {
        audioUrl,
        text,
        voice,
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
    const geminiStatus = await geminiService.testConnection();

    const response: ApiResponse = {
      success: true,
      data: {
        services: {
          gemini: geminiStatus ? 'connected' : 'disconnected'
        },
        testedAt: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
