import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSystemInstructions,
  getSystemInstruction,
  createSystemInstruction,
  updateSystemInstruction,
  deleteSystemInstruction,
  getCategories
} from '../controllers/systemInstructionController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all system instructions
router.get('/', getSystemInstructions);

// Get categories
router.get('/categories', getCategories);

// Get system instruction by ID
router.get('/:id', getSystemInstruction);

// Create system instruction
router.post('/', createSystemInstruction);

// Update system instruction
router.put('/:id', updateSystemInstruction);

// Delete system instruction
router.delete('/:id', deleteSystemInstruction);

export default router;
