import { Router } from 'express';
import { mergeController } from '../controllers/mergeController';

const router = Router();

/**
 * @route POST /api/merge/video-audio
 * @desc Merge video and audio files using FFmpeg
 * @body {videoUrl: string, audioUrl: string, options: MergeOptions}
 */
router.post('/video-audio', mergeController.mergeVideoAudio.bind(mergeController));

/**
 * @route POST /api/merge/concatenate-segments
 * @desc Concatenate multiple video segments into a single video
 * @body {projectId: string, segmentUrls: string[], options: ConcatenateOptions}
 */
router.post('/concatenate-segments', mergeController.concatenateSegments.bind(mergeController));

/**
 * @route GET /api/media/merged/:filename
 * @desc Serve merged video files
 * @param filename - The filename of the merged video
 */
router.get('/merged/:filename', mergeController.getMergedVideo.bind(mergeController));

export default router;
