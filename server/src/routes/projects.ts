import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateSegment,
  generateSegmentAudio,
  selectSegmentAudio,
  generateSegments
} from '../controllers/projectController';

const router = Router();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD operations
router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Generate segments for a project
router.post('/:id/generate-segments', generateSegments);

// Segment operations
router.put('/:projectId/segments/:segmentId', updateSegment);
router.post('/:projectId/segments/:segmentId/audio', generateSegmentAudio);
router.put('/:id/segments/:segmentId/audio/:audioId/select', selectSegmentAudio);

export default router;
