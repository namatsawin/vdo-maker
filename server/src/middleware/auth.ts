import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload & { userId: string };
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError('Invalid token', 401));
    }
    next(error);
  }
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  // Use any to bypass TypeScript issues with jwt.sign
  return (jwt as any).sign({ userId }, secret, { expiresIn: '7d' });
};
