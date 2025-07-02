import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Wand2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ScriptSegment } from '@/components/workflow/ScriptSegment';
import { ImageApproval } from '@/components/workflow/ImageApproval';
import { VideoApproval } from '@/components/workflow/VideoApproval';
import { FinalAssembly } from '@/components/workflow/FinalAssembly';
import { WorkflowProgress } from '@/components/workflow/WorkflowProgress';
import { GenerateAllImagesButton } from '@/components/workflow/GenerateAllImagesButton';
import { GenerateAllAudiosButton } from '@/components/workflow/GenerateAllAudiosButton';
import { GenerateAllVideosButton } from '@/components/workflow/GenerateAllVideosButton';
import { SegmentGenerationDialog } from '@/components/workflow/SegmentGenerationDialog';
import { WorkflowStage, ApprovalStatus, ProjectStatus, type VideoSegment } from '@/types';
import type { SegmentGenerationRequest } from '@/types/shared';
import { isApprovalStatus } from '@/utils/typeCompatibility';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

// const StageTab: Record<string, string >= {
//   [WorkflowStage.SCRIPT_GENERATION]: 'script ',
//   [WorkflowStage.IMAGE_GENERATION]: 'images',
//   [WorkflowStage.VIDEO_GENERATION]: 'videos',
//   [WorkflowStage.FINAL_ASSEMBLY]: 'final',
// }

export function ProjectWorkflow() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const stage = searchParams.get('stage') || 'script';
  
  const { currentProject: project, updateProject, loadProject, updateSegment } = useProjectStore();
  const { addToast } = useUIStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);

  // Determine the current stage based on project progress
  const getCurrentProjectStage = (): string => {
    if (!project || !project.segments.length) {
      return 'script';
    }

    // Check if all scripts are approved
    const allScriptsApproved = project.segments.every(s => 
      s.scriptApprovalStatus === ApprovalStatus.APPROVED
    );

    // Check if all images are approved
    const allImagesApproved = project.segments.every(s => 
      s.imageApprovalStatus === ApprovalStatus.APPROVED
    );

    // Check if all videos are approved
    const allVideosApproved = project.segments.every(s => 
      s.videoApprovalStatus === ApprovalStatus.APPROVED
    );

    // Determine current stage based on completion
    if (allVideosApproved) {
      return 'final';
    } else if (allImagesApproved) {
      return 'videos';
    } else if (allScriptsApproved) {
      return 'images';
    } else {
      return 'script';
    }
  };

  useEffect(() => {
    if (id) loadProject(id)
  }, [id])

  // Auto-navigate to current stage when project loads
  useEffect(() => {
    if (project && !searchParams.get('stage')) {
      const currentStage = getCurrentProjectStage();
      setSearchParams({ stage: currentStage });
    }
  }, [project, searchParams, setSearchParams]);

  const handleGenerateSegments = useCallback(async (request: SegmentGenerationRequest) => {
    if (!project) return;
    setIsGenerating(true);
    setShowSegmentDialog(false);
    
    try {
      const response = await apiClient.post(`/projects/${project.id}/generate-segments`, request);
      
      if (response.success) {
        // Update the project with new segments
        const updatedProject = response.data.project;
        updateProject(project.id, updatedProject);
        
        addToast({
          type: 'success',
          title: 'Segments Generated',
          message: response.data.message || `Generated ${updatedProject.segments?.length || 0} segments`,
        });
      }
    } catch (error: any) {
      console.error('Segment generation failed:', error);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: error.response?.data?.error?.message || 'Failed to generate segments. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [project, updateProject, addToast]);

  const handleSegmentUpdate = (segmentId: string, updates: Partial<VideoSegment>) => {
    if (!project) return;
    return updateSegment(project.id, segmentId, updates)
  };

  const getApprovalField = (currentStage: string) => {
    switch (currentStage) {
      case 'script': return ['scriptApprovalStatus', 'audioApprovalStatus'];
      case 'images': return ['imageApprovalStatus'];
      case 'videos': return ['videoApprovalStatus'];
      case 'final' : return ['finalApprovalStatus']
      default: return ['scriptApprovalStatus'];
    }
  };

  const handleApprove = (segmentId: string) => {
    const fields = getApprovalField(stage);

    const payload = fields.reduce((acc: Record<string, ApprovalStatus>, item) => {
       acc[item] = ApprovalStatus.APPROVED
       return acc
    }, {})

    handleSegmentUpdate(segmentId, payload);
    
    addToast({
      type: 'success',
      title: 'Segment Approved',
      message: `${stage.charAt(0).toUpperCase() + stage.slice(1)} segment has been approved`,
    });
  };

  const handleReject = (segmentId: string) => {
    const fields = getApprovalField(stage);

    const payload = fields.reduce((acc: Record<string, ApprovalStatus>, item) => {
       acc[item] = ApprovalStatus.REJECTED
       return acc
    }, {})

    handleSegmentUpdate(segmentId, payload);
    
    addToast({
      type: 'warning',
      title: 'Segment Rejected',
      message: `${stage.charAt(0).toUpperCase() + stage.slice(1)} segment has been rejected for revision`,
    });
  };

  const canProceedToNext = () => {
    if (!project || project.segments.length === 0) return false;
    
    switch (stage) {
      case 'script':
        return project.segments.every(segment => 
          isApprovalStatus(segment.scriptApprovalStatus, 'approved')
        );
      case 'images':
        return project.segments.every(segment => 
          isApprovalStatus(segment.imageApprovalStatus, 'approved')
        );
      case 'videos':
        return project.segments.every(segment => 
          isApprovalStatus(segment.videoApprovalStatus, 'approved')
        );
      default:
        return false;
    }
  };

  const handleProceedToNext = () => {
    if (!project || !canProceedToNext()) return;

    let nextStage: WorkflowStage;
    let nextUrl: string;
    let message: string;

    switch (stage) {
      case 'script':
        nextStage = WorkflowStage.IMAGE_GENERATION;
        nextUrl = `images`;
        message = 'All scripts approved. Moving to image generation.';
        break;
      case 'images':
        nextStage = WorkflowStage.VIDEO_GENERATION;
        nextUrl = `videos`;
        message = 'All images approved. Moving to video generation.';
        break;
      case 'videos':
        nextStage = WorkflowStage.FINAL_ASSEMBLY;
        nextUrl = `final`;
        message = 'All videos approved. Moving to final assembly.';
        break;
      default:
        return;
    }

    updateProject(project.id, {
      currentStage: nextStage,
      updatedAt: new Date().toISOString(),
    });

    addToast({
      type: 'success',
      title: 'Proceeding to Next Stage',
      message,
    });

    setSearchParams({ stage: nextUrl });
  };

  const handleGoBack = () => {
    if (!project) return;
    
    const backStages: Record<string, string> = {
      'images': 'script',
      'videos': 'images',
      'final': 'videos',
    };
    
    const backStage = backStages[stage];
    if (backStage) {
      setSearchParams({ stage: backStage });
    }
  };


  const getStageTitle = () => {
    switch (stage) {
      case 'script': return 'Script Generation & Audio Preview';
      case 'images': return 'Image Generation & Approval';
      case 'videos': return 'Video Generation & Approval';
      case 'final': return 'Final Assembly & Export';
      default: return 'Workflow';
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case 'script': return 'Review and approve the AI-generated script segments. Generate audio previews to hear how each segment sounds.';
      case 'images': return 'Review the generated images for each segment. These will be used as the first frame for video generation.';
      case 'videos': return 'Review the generated videos for each segment.';
      case 'final': return 'Review the final assembled video and export it.';
      default: return 'Manage your project workflow.';
    }
  };

  const getApprovedCount = () => {
    switch (stage) {
      case 'script':
        return project?.segments.filter(s => s.scriptApprovalStatus === ApprovalStatus.APPROVED).length || 0;
      case 'images':
        return project?.segments.filter(s => s.imageApprovalStatus === ApprovalStatus.APPROVED).length || 0;
      case 'videos':
        return project?.segments.filter(s => s.videoApprovalStatus === ApprovalStatus.APPROVED).length || 0;
      default:
        return 0;
    }
  };

  if (!project) {
    return <LoadingSpinner text="Loading project..." />;
  }

  const approvedCount = getApprovedCount();
  const totalCount = project.segments.length;

  const completedStages: WorkflowStage[] = [];
  
  if (project.segments.length) {
    if (project.segments.every(s => s.scriptApprovalStatus === ApprovalStatus.APPROVED)) {
      completedStages.push(WorkflowStage.SCRIPT_GENERATION);
    }
    if (project.segments.every(s => s.imageApprovalStatus === ApprovalStatus.APPROVED)) {
      completedStages.push(WorkflowStage.IMAGE_GENERATION);
    }
    if (project.segments.every(s => s.videoApprovalStatus === ApprovalStatus.APPROVED)) {
      completedStages.push(WorkflowStage.VIDEO_GENERATION);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <WorkflowProgress 
        currentStage={project.currentStage} 
        completedStages={completedStages} 
      />

      {/* Stage Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant={stage === 'script' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'script' })}
              className={cn(
                'relative',
                completedStages.includes(WorkflowStage.SCRIPT_GENERATION) && stage !== 'script' && 
                'border-green-500 text-green-700 hover:bg-green-50'
              )}
            >
              Script
              {completedStages.includes(WorkflowStage.SCRIPT_GENERATION) && stage !== 'script' && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              )}
            </Button>
            <Button
              variant={stage === 'images' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'images' })}
              className={cn(
                'relative',
                completedStages.includes(WorkflowStage.IMAGE_GENERATION) && stage !== 'images' && 
                'border-green-500 text-green-700 hover:bg-green-50'
              )}
            >
              Images
              {completedStages.includes(WorkflowStage.IMAGE_GENERATION) && stage !== 'images' && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              )}
            </Button>
            <Button
              variant={stage === 'videos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'videos' })}
              className={cn(
                'relative',
                completedStages.includes(WorkflowStage.VIDEO_GENERATION) && stage !== 'videos' && 
                'border-green-500 text-green-700 hover:bg-green-50'
              )}
            >
              Videos
              {completedStages.includes(WorkflowStage.VIDEO_GENERATION) && stage !== 'videos' && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              )}
            </Button>
            <Button
              variant={stage === 'final' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'final' })}
              className={cn(
                'relative',
                project?.status === ProjectStatus.COMPLETED && stage !== 'final' && 
                'border-green-500 text-green-700 hover:bg-green-50'
              )}
            >
              Final
              {project?.status === ProjectStatus.COMPLETED && stage !== 'final' && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              )}
            </Button>
          </div>
          
          {/* Current Stage Indicator */}
          <div className="text-center mt-3">
            <span className="text-xs text-gray-500">
              Current Stage: <span className="font-medium text-gray-700">{getCurrentProjectStage().charAt(0).toUpperCase() + getCurrentProjectStage().slice(1)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{getStageTitle()}</CardTitle>
              <CardDescription>{getStageDescription()}</CardDescription>
            </div>
            {stage !== 'script' && (
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Progress: {approvedCount} of {isGenerating ? '?' : totalCount} segments approved
            </div>
            <div className={cn('flex space-x-2', { 'hidden': !project.segments.length })}>
              {stage === 'script' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSegmentDialog(true)}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate All
                  </Button>
                </>
              )}
            </div>
          </div>

          {totalCount > 0 && !isGenerating && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(approvedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      { 
      isGenerating ? 
        <div className="space-y-4">
          <LoadingSpinner text="AI is analyzing your story and creating video segments..." />
        </div> : 
        <div className="space-y-4">
          {stage === 'final' ? (
            <FinalAssembly 
              segments={project.segments}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdate={handleSegmentUpdate}
            />
          ) : (
            <>
              {/* Generate All Images Button - only show for images stage */}
              {stage === 'images' && (
                <GenerateAllImagesButton segments={project.segments} />
              )}

              {/* Generate All Videos Button - only show for videos stage */}
              {stage === 'videos' && (
                <GenerateAllVideosButton segments={project.segments} />
              )}

              {/* Generate All Audios Button - only show for audios stage */}
              {stage === 'script' && (
                <GenerateAllAudiosButton segments={project.segments} />
              )}
              
              {project.segments.map((segment, index) => (
              <div key={segment.id} className="relative">
                {stage === 'script' && (
                  <ScriptSegment
                    segment={segment}
                    index={index}
                    onUpdate={handleSegmentUpdate}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                )}
                
                {stage === 'images' && (
                  <ImageApproval
                    segment={segment}
                    index={index}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                )}

                {stage === 'videos' && (
                  <VideoApproval
                    segment={segment}
                    index={index}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                )}
              </div>
              ))}
            </>
          )}
        </div>
      }

      {totalCount === 0 && stage === 'script' && !isGenerating &&  (
        <Card>
          <CardContent className="text-center py-12">
            <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No segments generated yet
            </h3>
            <p className="text-gray-500 mb-6">
              Generate video segments with AI using your preferred model and system instructions.
            </p>
            <Button onClick={() => setShowSegmentDialog(true)} className="flex items-center mx-auto gap-2">
              <Wand2 className="h-4 w-4" />
              Generate Segments
            </Button>
          </CardContent>
        </Card>
      )}

      {totalCount > 0 && stage !== 'final' && !isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to proceed?</p>
                <p className="text-sm text-muted-foreground">
                  {canProceedToNext() 
                    ? `All ${stage} segments are approved. You can proceed to the next stage.`
                    : `${totalCount - approvedCount} segments still need approval before proceeding.`
                  }
                </p>
              </div>
              <Button
                onClick={handleProceedToNext}
                disabled={!canProceedToNext()}
                className="bg-green-500 hover:bg-green-600 min-w-[120px]"
              >
                 Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <SegmentGenerationDialog
        isOpen={showSegmentDialog}
        onClose={() => setShowSegmentDialog(false)}
        onGenerate={handleGenerateSegments}
        loading={isGenerating}
      />
    </div>
  );
}
