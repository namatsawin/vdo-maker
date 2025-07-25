import { Router } from 'express';
import { register, login, logout, getProfile } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
