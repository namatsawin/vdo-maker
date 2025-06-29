import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { createError } from '../utils/errorHandler';

// Get all system instructions
export const getSystemInstructions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, active } = req.query;
    
    const where: any = {};
    
    if (category && category !== 'all') {
      where.category = category as string;
    }
    
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const instructions = await prisma.systemInstruction.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: { instructions }
    });
  } catch (error) {
    console.error('Get system instructions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch system instructions' }
    });
  }
};

// Get system instruction by ID
export const getSystemInstruction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const instruction = await prisma.systemInstruction.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!instruction) {
      throw createError('System instruction not found', 404);
    }

    res.json({
      success: true,
      data: { instruction }
    });
  } catch (error) {
    console.error('Get system instruction error:', error);
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to fetch system instruction' }
    });
  }
};

// Create system instruction
export const createSystemInstruction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, description, instruction, category = 'general' } = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!name || !instruction) {
      throw createError('Name and instruction are required', 400);
    }

    const newInstruction = await prisma.systemInstruction.create({
      data: {
        name,
        description,
        instruction,
        category,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { instruction: newInstruction }
    });
  } catch (error) {
    console.error('Create system instruction error:', error);
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to create system instruction' }
    });
  }
};

// Update system instruction
export const updateSystemInstruction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Check if instruction exists and user has permission
    const existingInstruction = await prisma.systemInstruction.findUnique({
      where: { id }
    });

    if (!existingInstruction) {
      throw createError('System instruction not found', 404);
    }

    // Only allow creator to update (or admin in future)
    if (existingInstruction.createdBy !== userId) {
      throw createError('Not authorized to update this instruction', 403);
    }

    // Don't allow updating default instructions
    if (existingInstruction.isDefault) {
      throw createError('Cannot update default system instructions', 403);
    }

    const allowedFields = ['name', 'description', 'instruction', 'category', 'isActive'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    const updatedInstruction = await prisma.systemInstruction.update({
      where: { id },
      data: filteredUpdates,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { instruction: updatedInstruction }
    });
  } catch (error) {
    console.error('Update system instruction error:', error);
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to update system instruction' }
    });
  }
};

// Delete system instruction
export const deleteSystemInstruction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Check if instruction exists and user has permission
    const existingInstruction = await prisma.systemInstruction.findUnique({
      where: { id }
    });

    if (!existingInstruction) {
      throw createError('System instruction not found', 404);
    }

    // Only allow creator to delete (or admin in future)
    if (existingInstruction.createdBy !== userId) {
      throw createError('Not authorized to delete this instruction', 403);
    }

    // Don't allow deleting default instructions
    if (existingInstruction.isDefault) {
      throw createError('Cannot delete default system instructions', 403);
    }

    await prisma.systemInstruction.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: 'System instruction deleted successfully' }
    });
  } catch (error) {
    console.error('Delete system instruction error:', error);
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to delete system instruction' }
    });
  }
};

// Get categories
export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.systemInstruction.groupBy({
      by: ['category'],
      where: {
        isActive: true
      },
      _count: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    const formattedCategories = categories.map((cat: any) => ({
      name: cat.category,
      count: cat._count.category,
      label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1)
    }));

    res.json({
      success: true,
      data: { categories: formattedCategories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch categories' }
    });
  }
};
