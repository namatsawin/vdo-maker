import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, CreateProjectRequest, UpdateProjectRequest, UpdateSegmentRequest, ProjectStatus, WorkflowStage } from '../types';
import { mapProject, mapVideoSegment, calculateCurrentStage, calculateProjectStatus } from '../utils/typeMappers';
import { generateScript } from './aiController';

const prisma = new PrismaClient();

// Get all projects for authenticated user
export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        segments: {
          include: {
            images: true,
            videos: true,
            audios: true,
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Map to frontend types and update calculated fields
    const mappedProjects = projects.map(project => {
      const currentStage = calculateCurrentStage(project.segments);
      const status = calculateProjectStatus(project.segments);
      
      // Update database if calculated values differ
      if (project.currentStage !== currentStage || project.status !== status) {
        prisma.project.update({
          where: { id: project.id },
          data: { 
            currentStage,
            status,
            updatedAt: new Date()
          }
        }).catch(console.error); // Don't block response for this update
      }

      return mapProject({
        ...project,
        currentStage,
        status
      });
    });

    res.json({
      success: true,
      data: { projects: mappedProjects }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch projects' }
    });
  }
};

// Get single project by ID
export const getProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const project = await prisma.project.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        segments: {
          include: {
            images: true,
            videos: true,
            audios: true,
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: { message: 'Project not found' }
      });
      return;
    }

    // Calculate current stage and status
    const currentStage = calculateCurrentStage(project.segments);
    const status = calculateProjectStatus(project.segments);
    
    // Update database if calculated values differ
    if (project.currentStage !== currentStage || project.status !== status) {
      await prisma.project.update({
        where: { id: project.id },
        data: { 
          currentStage,
          status,
          updatedAt: new Date()
        }
      });
    }

    // Map to frontend type
    const mappedProject = mapProject({
      ...project,
      currentStage,
      status
    });

    res.json({
      success: true,
      data: { project: mappedProject }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch project' }
    });
  }
};

// Create new project
export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { title, description, story }: CreateProjectRequest = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!title) {
      throw createError('Project title is required', 400);
    }

    // Create project first
    const project = await prisma.project.create({
      data: {
        title,
        description: description || '',
        status: 'IN_PROGRESS',
        currentStage: 'SCRIPT_GENERATION',
        userId
      }
    });

    // Generate script segments using AI (simplified for now)
    let segments = [];
    try {
      // Create basic segments - we'll improve AI integration later
      const basicSegments = [
        {
          script: `Introduction to ${title}`,
          videoPrompt: `Professional introduction scene for ${title}`,
          order: 0
        },
        {
          script: `Main content about ${description || title}`,
          videoPrompt: `Main content visualization for ${title}`,
          order: 1
        },
        {
          script: `Conclusion and next steps for ${title}`,
          videoPrompt: `Conclusion scene for ${title}`,
          order: 2
        }
      ];

      // Create segments in database
      const segmentPromises = basicSegments.map((segment, index) => 
        prisma.segment.create({
          data: {
            order: index,
            script: segment.script,
            videoPrompt: segment.videoPrompt,
            status: 'PENDING',
            scriptApprovalStatus: 'PENDING',
            imageApprovalStatus: 'DRAFT',
            videoApprovalStatus: 'DRAFT',
            audioApprovalStatus: 'DRAFT',
            finalApprovalStatus: 'DRAFT',
            projectId: project.id
          }
        })
      );

      segments = await Promise.all(segmentPromises);
    } catch (aiError) {
      console.error('Segment creation failed:', aiError);
      // Continue without segments - user can add them manually
    }

    // Fetch complete project with segments
    const completeProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        segments: {
          include: {
            images: true,
            videos: true,
            audios: true,
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!completeProject) {
      throw createError('Failed to fetch created project', 500);
    }

    // Map to frontend type
    const mappedProject = mapProject(completeProject);

    res.status(201).json({
      success: true,
      data: { 
        project: mappedProject,
        message: segments.length > 0 
          ? `Project created with ${segments.length} AI-generated segments`
          : 'Project created successfully'
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create project' }
    });
  }
};

// Update project
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const updates: UpdateProjectRequest = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Verify project ownership
    const existingProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      throw createError('Project not found', 404);
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        segments: {
          include: {
            images: true,
            videos: true,
            audios: true,
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    // Map to frontend type
    const mappedProject = mapProject(project);

    res.json({
      success: true,
      data: { project: mappedProject }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update project' }
    });
  }
};

// Delete project
export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Verify project ownership
    const existingProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      throw createError('Project not found', 404);
    }

    // Delete project (segments will be deleted due to cascade)
    await prisma.project.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: 'Project deleted successfully' }
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete project' }
    });
  }
};

// Update segment
export const updateSegment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, segmentId } = req.params;
    const updates: UpdateSegmentRequest = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Update segment
    const segment = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        images: true,
        videos: true,
        audios: true,
      }
    });

    // Update project timestamp and recalculate status
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        segments: {
          include: {
            images: true,
            videos: true,
            audios: true,
          }
        }
      }
    });

    if (updatedProject) {
      const currentStage = calculateCurrentStage(updatedProject.segments);
      const status = calculateProjectStatus(updatedProject.segments);
      
      await prisma.project.update({
        where: { id: projectId },
        data: { 
          currentStage,
          status,
          updatedAt: new Date() 
        }
      });
    }

    // Map to frontend type
    const mappedSegment = mapVideoSegment(segment);

    res.json({
      success: true,
      data: { segment: mappedSegment }
    });
  } catch (error) {
    console.error('Update segment error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update segment' }
    });
  }
};
