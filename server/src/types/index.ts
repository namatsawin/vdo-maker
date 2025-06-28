import { Request } from 'express';

// Re-export shared types
export * from './shared';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}
