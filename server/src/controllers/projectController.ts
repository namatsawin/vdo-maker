import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, CreateProjectRequest, UpdateProjectRequest, UpdateSegmentRequest, ProjectStatus, WorkflowStage, ApiResponse } from '../types';
import { mapProject, mapVideoSegment, calculateCurrentStage, calculateProjectStatus } from '../utils/typeMappers';
import { generateScript } from './aiController';
import { geminiService } from '@/services/geminiService';

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

    // Create project without segments - user will generate them manually
    const project = await prisma.project.create({
      data: {
        title,
        description: description || '',
        status: 'DRAFT',
        currentStage: 'SCRIPT_GENERATION',
        userId
      }
    });

    // Fetch complete project (will have empty segments array)
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
        message: 'Project created successfully. You can now generate segments in the script stage.'
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
    const updates = req.body;

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

    // Separate project fields from segments
    const { segments, ...projectUpdates } = updates;

    // Update project fields only (exclude segments from direct update)
    const allowedProjectFields = ['title', 'description', 'status', 'currentStage', 'final_video_url'];
    const filteredProjectUpdates = Object.keys(projectUpdates)
      .filter(key => allowedProjectFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = projectUpdates[key];
        return obj;
      }, {} as any);

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...filteredProjectUpdates,
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

    // Handle segments update separately if provided
    if (segments && Array.isArray(segments)) {
      // Update each segment individually
      for (const segmentUpdate of segments) {
        if (segmentUpdate.id) {
          // Update existing segment
          const allowedSegmentFields = [
            'script', 'videoPrompt', 'status',
            'scriptApprovalStatus', 'imageApprovalStatus', 
            'videoApprovalStatus', 'audioApprovalStatus', 
            'finalApprovalStatus', 'order'
          ];
          
          const filteredSegmentUpdates = Object.keys(segmentUpdate)
            .filter(key => allowedSegmentFields.includes(key))
            .reduce((obj, key) => {
              obj[key] = segmentUpdate[key];
              return obj;
            }, {} as any);

          await prisma.segment.update({
            where: { id: segmentUpdate.id },
            data: {
              ...filteredSegmentUpdates,
              updatedAt: new Date()
            }
          });
        }
      }

      // Fetch updated project with segments
      const updatedProject = await prisma.project.findUnique({
        where: { id },
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

      if (updatedProject) {
        const mappedProject = mapProject(updatedProject);
        res.json({
          success: true,
          data: { project: mappedProject }
        });
        return;
      }
    }

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

    // Verify segment belongs to project
    const existingSegment = await prisma.segment.findFirst({
      where: { id: segmentId, projectId }
    });

    if (!existingSegment) {
      throw createError('Segment not found', 404);
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
      error: {
        message: error instanceof Error ? error.message : 'Failed to update segment'
      }
    });
  }
};

// Generate audio for segment
export const generateSegmentAudio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, segmentId } = req.params;
    const { text, voice, model } = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!text) {
      throw createError('Text is required', 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Get segment with script
    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, projectId },
      include: {
        images: true,
        videos: true,
        audios: true,
      }
    });

    if (!segment) {
      throw createError('Segment not found', 404);
    }

    if (!segment.script.trim()) {
      throw createError('Segment script is empty', 400);
    }

    // Generate audio using AI service
    try {
      // Import AI controller function
      const { generateTTS } = await import('./aiController');
      
      // Create a mock request object for the AI controller
      const aiRequest = {
        user: req.user,
        body: {
          text,
          voice,
          model
        }
      } as AuthenticatedRequest;

      // Create a mock response object to capture the result
      let audioResult: any = null;
      const aiResponse = {
        json: (data: any) => {
          audioResult = data;
        },
        status: () => aiResponse
      } as any;

      // Create a mock next function
      const mockNext = (error?: any) => {
        if (error) throw error;
      };

      // Call the AI controller
      await generateTTS(aiRequest, aiResponse, mockNext);

      if (!audioResult?.success || !audioResult?.data?.audioUrl) {
        throw new Error('Audio generation failed');
      }

      // Create audio record in database
      const audio = await prisma.audio.create({
        data: {
          url: audioResult.data.audioUrl,
          text: segment.script,
          voice,
          isSelected: true, // New audio is selected by default
          metadata: JSON.stringify({
            model,
            voice,
            duration: audioResult.data.duration || null // Store duration in metadata instead
          }),
          segmentId: segment.id
        }
      });

      // Unselect other audio files for this segment
      await prisma.audio.updateMany({
        where: {
          segmentId: segment.id,
          id: { not: audio.id }
        },
        data: {
          isSelected: false
        }
      });

      // Update segment to include the new audio
      const updatedSegment = await prisma.segment.findUnique({
        where: { id: segmentId },
        include: {
          images: true,
          videos: true,
          audios: true,
        }
      });

      if (!updatedSegment) {
        throw createError('Failed to fetch updated segment', 500);
      }

      // Map to frontend type
      const mappedSegment = mapVideoSegment(updatedSegment);

      res.json({
        success: true,
        data: { 
          segment: mappedSegment,
          audioUrl: audio.url,
          message: 'Audio generated successfully'
        }
      });

    } catch (aiError) {
      console.error('AI audio generation failed:', aiError);
      throw createError('Failed to generate audio', 500);
    }

  } catch (error) {
    console.error('Generate segment audio error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to generate audio'
      }
    });
  }
};

// Select audio for segment
export const selectSegmentAudio = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id: projectId, segmentId, audioId } = req.params;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Verify segment exists
    const segment = await prisma.segment.findUnique({
      where: { 
        id: segmentId,
        projectId: projectId
      }
    });

    if (!segment) {
      throw createError('Segment not found', 404);
    }

    // Verify audio exists and belongs to this segment
    const audio = await prisma.audio.findUnique({
      where: { 
        id: audioId,
        segmentId: segmentId
      }
    });

    if (!audio) {
      throw createError('Audio not found', 404);
    }

    // Unselect all audio files for this segment
    await prisma.audio.updateMany({
      where: {
        segmentId: segmentId
      },
      data: {
        isSelected: false
      }
    });

    // Select the specified audio
    const selectedAudio = await prisma.audio.update({
      where: { id: audioId },
      data: { isSelected: true }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        audioId: selectedAudio.id,
        segmentId: segmentId,
        isSelected: true,
        message: 'Audio selection updated successfully'
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Generate segments for a project
export const generateSegments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { 
      model = 'gemini-2.5-flash', 
      systemInstructionId,
      customInstruction
    } = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Get system instruction
    let systemInstruction = '';
    if (systemInstructionId) {
      const instruction = await prisma.systemInstruction.findUnique({
        where: { id: systemInstructionId, isActive: true }
      });
      if (instruction) {
        systemInstruction = instruction.instruction;
      }
    } else if (customInstruction) {
      systemInstruction = customInstruction;
    } else {
      // Use default instruction
      const defaultInstruction = await prisma.systemInstruction.findFirst({
        where: { isDefault: true, isActive: true }
      });
      systemInstruction = defaultInstruction?.instruction || 'You are an expert video script writer. Create engaging, well-structured video scripts.';
    }

    await prisma.segment.deleteMany({ 
      where: { projectId: project.id }
    })

    const segments = await geminiService.generateScript({
      title: project.title,
      description: project.description ?? '',
      systemInstruction,
    })

    await prisma.segment.createMany({
      data: segments.map((segment) => ({
        order: segment.order,
        script: segment.script,
        videoPrompt: segment.videoPrompt,
        status: 'DRAFT',
        scriptApprovalStatus: 'DRAFT',
        imageApprovalStatus: 'DRAFT',
        videoApprovalStatus: 'DRAFT',
        audioApprovalStatus: 'DRAFT',
        finalApprovalStatus: 'DRAFT',
        projectId: project.id
      }))
    })

    // Fetch updated project with segments
    const updatedProject = await prisma.project.findUnique({
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

    if (!updatedProject) {
      throw createError('Failed to fetch updated project', 500);
    }

    const mappedProject = mapProject(updatedProject);

    res.json({
      success: true,
      data: { 
        project: mappedProject,
        message: `AI intelligently generated ${segments.length} segments using ${model} model based on system instructions`
      }
    });
  } catch (error) {
    console.error('Generate segments error:', error);
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to generate segments' }
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
