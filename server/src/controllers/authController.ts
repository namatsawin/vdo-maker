import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { generateToken } from '@/middleware/auth';
import { createError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('User already exists with this email', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Generate token
    const token = generateToken(user.id);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        token
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: { user }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
