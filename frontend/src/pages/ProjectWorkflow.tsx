import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ScriptSegment } from '@/components/workflow/ScriptSegment';
import { ImageApproval } from '@/components/workflow/ImageApproval';
import { VideoApproval } from '@/components/workflow/VideoApproval';
import { AudioApproval } from '@/components/workflow/AudioApproval';
import { FinalAssembly } from '@/components/workflow/FinalAssembly';
import { WorkflowProgress } from '@/components/workflow/WorkflowProgress';
import { ScriptGenerationDialog } from '@/components/workflow/ScriptGenerationDialog';
import { WorkflowStage, ApprovalStatus, ProjectStatus, type VideoSegment } from '@/types';
import { isApprovalStatus } from '@/utils/typeCompatibility';

export function ProjectWorkflow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stage = searchParams.get('stage') || 'script';
  
  const { projects, updateProject, generateProjectScript } = useProjectStore();
  const { addToast } = useUIStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [showScriptDialog, setShowScriptDialog] = useState(false);

  const project = projects.find(p => p.id === id);

  const handleGenerateSegments = useCallback(async (title: string, description: string, model: string) => {
    if (!project) return;
    setIsGenerating(true);
    
    try {
      // Use real AI script generation with model selection
      const segments = await generateProjectScript(title, description, model);
      
      updateProject(project.id, {
        segments: segments,
        currentStage: WorkflowStage.IMAGE_GENERATION,
        updatedAt: new Date().toISOString(),
      });

      addToast({
        type: 'success',
        title: 'Script Generated',
        message: `Generated ${segments.length} segments using ${model}`,
      });
    } catch (error) {
      console.error('Script generation failed:', error);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate script segments. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [project, generateProjectScript, updateProject, addToast]);

  useEffect(() => {
    if (!project) {
      navigate('/projects');
      return;
    }

    // Auto-generation removed - now user must explicitly choose model
  }, [project, navigate, stage]);

  const handleSegmentUpdate = (segmentId: string, updates: Partial<VideoSegment>) => {
    if (!project) return;

    const updatedSegments = project.segments.map(segment =>
      segment.id === segmentId
        ? { ...segment, ...updates, updatedAt: new Date().toISOString() }
        : segment
    );

    updateProject(project.id, {
      segments: updatedSegments,
      updatedAt: new Date().toISOString(),
    });
  };

  const getApprovalField = (currentStage: string) => {
    switch (currentStage) {
      case 'script': return 'scriptApprovalStatus';
      case 'images': return 'imageApprovalStatus';
      case 'videos': return 'videoApprovalStatus';
      case 'audio': return 'audioApprovalStatus';
      default: return 'scriptApprovalStatus';
    }
  };

  const handleApprove = (segmentId: string) => {
    const field = getApprovalField(stage);
    handleSegmentUpdate(segmentId, { [field]: 'APPROVED' as ApprovalStatus });
    
    addToast({
      type: 'success',
      title: 'Segment Approved',
      message: `${stage.charAt(0).toUpperCase() + stage.slice(1)} segment has been approved`,
    });
  };

  const handleReject = (segmentId: string) => {
    const field = getApprovalField(stage);
    handleSegmentUpdate(segmentId, { [field]: 'REJECTED' as ApprovalStatus });
    
    addToast({
      type: 'warning',
      title: 'Segment Rejected',
      message: `${stage.charAt(0).toUpperCase() + stage.slice(1)} segment has been rejected for revision`,
    });
  };

  const handleRegenerate = async (segmentId: string) => {
    if (!project) return;
    setIsRegenerating(segmentId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (stage === 'script') {
        const newScript = `This is a regenerated script for segment ${segmentId}. The AI has created new content based on your feedback and requirements.`;
        const newVideoPrompt = `A regenerated visual prompt showing different scenes and actions for segment ${segmentId}.`;
        
        handleSegmentUpdate(segmentId, {
          script: newScript,
          videoPrompt: newVideoPrompt,
          scriptApprovalStatus: ApprovalStatus.DRAFT,
        });
      } else {
        const field = getApprovalField(stage);
        handleSegmentUpdate(segmentId, {
          [field]: 'DRAFT' as ApprovalStatus,
        });
      }

      addToast({
        type: 'success',
        title: 'Segment Regenerated',
        message: 'New content has been generated for this segment',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Regeneration Failed',
        message: 'Failed to regenerate segment. Please try again.',
      });
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleAddSegment = () => {
    if (!project) return;

    const newSegment: VideoSegment = {
      id: Math.random().toString(36).substr(2, 9),
      script: 'New segment script. Click edit to customize this content.',
      videoPrompt: 'Visual description for the new segment.',
      duration: 10,
      order: project.segments.length,
      status: 'DRAFT',
      scriptApprovalStatus: 'DRAFT' as ApprovalStatus,
      imageApprovalStatus: 'DRAFT' as ApprovalStatus,
      videoApprovalStatus: 'DRAFT' as ApprovalStatus,
      audioApprovalStatus: 'DRAFT' as ApprovalStatus,
      finalApprovalStatus: 'DRAFT' as ApprovalStatus,
      images: [],
      videos: [],
      audios: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateProject(project.id, {
      segments: [...project.segments, newSegment],
      updatedAt: new Date().toISOString(),
    });

    addToast({
      type: 'success',
      title: 'Segment Added',
      message: 'New segment has been added to your project',
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
      case 'audio':
        return project.segments.every(segment => 
          isApprovalStatus(segment.audioApprovalStatus, 'approved')
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
        nextStage = WorkflowStage.AUDIO_GENERATION;
        nextUrl = `audio`;
        message = 'All videos approved. Moving to audio generation.';
        break;
      case 'audio':
        nextStage = WorkflowStage.FINAL_ASSEMBLY;
        nextUrl = `final`;
        message = 'All audio approved. Moving to final assembly.';
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
      'audio': 'videos',
      'final': 'audio',
    };
    
    const backStage = backStages[stage];
    if (backStage) {
      setSearchParams({ stage: backStage });
    }
  };


  const getStageTitle = () => {
    switch (stage) {
      case 'script': return 'Script Generation & Approval';
      case 'images': return 'Image Generation & Approval';
      case 'videos': return 'Video Generation & Approval';
      case 'audio': return 'Audio Generation & Approval';
      case 'final': return 'Final Assembly & Export';
      default: return 'Workflow';
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case 'script': return 'Review and approve the AI-generated script segments. You can edit the content or regenerate segments as needed.';
      case 'images': return 'Review the generated images for each segment. These will be used as the first frame for video generation.';
      case 'videos': return 'Review the generated videos for each segment.';
      case 'audio': return 'Review the generated audio narration for each segment.';
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
      case 'audio':
        return project?.segments.filter(s => s.audioApprovalStatus === ApprovalStatus.APPROVED).length || 0;
      default:
        return 0;
    }
  };

  if (!project) {
    return <LoadingSpinner text="Loading project..." />;
  }

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Generating script segments...</p>
        </div>
        <LoadingSpinner text="AI is analyzing your story and creating video segments..." />
      </div>
    );
  }

  const approvedCount = getApprovedCount();
  const totalCount = project.segments.length;

  const completedStages: WorkflowStage[] = [];
  if (project.segments.every(s => s.scriptApprovalStatus === ApprovalStatus.APPROVED)) {
    completedStages.push(WorkflowStage.SCRIPT_GENERATION);
  }
  if (project.segments.every(s => s.imageApprovalStatus === ApprovalStatus.APPROVED)) {
    completedStages.push(WorkflowStage.IMAGE_GENERATION);
  }
  if (project.segments.every(s => s.videoApprovalStatus === ApprovalStatus.APPROVED)) {
    completedStages.push(WorkflowStage.VIDEO_GENERATION);
  }
  if (project.segments.every(s => s.audioApprovalStatus === ApprovalStatus.APPROVED)) {
    completedStages.push(WorkflowStage.AUDIO_GENERATION);
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
            >
              Script
            </Button>
            <Button
              variant={stage === 'images' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'images' })}
            >
              Images
            </Button>
            <Button
              variant={stage === 'videos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'videos' })}
            >
              Videos
            </Button>
            <Button
              variant={stage === 'audio' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'audio' })}
            >
              Audio
            </Button>
            <Button
              variant={stage === 'final' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ stage: 'final' })}
            >
              Final
            </Button>
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
              Progress: {approvedCount} of {totalCount} segments approved
            </div>
            <div className="flex space-x-2">
              {stage === 'script' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSegment}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Segment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScriptDialog(true)}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate All
                  </Button>
                </>
              )}
            </div>
          </div>

          {totalCount > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(approvedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {stage === 'final' ? (
          <FinalAssembly 
            segments={project.segments}
            onComplete={() => {
              updateProject(project.id, {
                status: ProjectStatus.COMPLETED,
                currentStage: WorkflowStage.COMPLETED,
                updatedAt: new Date().toISOString(),
              });
              addToast({
                type: 'success',
                title: 'Project Completed!',
                message: 'Your video project has been completed successfully.',
              });
            }}
          />
        ) : (
          project.segments.map((segment, index) => (
            <div key={segment.id} className="relative">
              {isRegenerating === segment.id && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                  <LoadingSpinner text="Regenerating segment..." />
                </div>
              )}
              
              {stage === 'script' && (
                <ScriptSegment
                  segment={segment}
                  index={index}
                  onUpdate={handleSegmentUpdate}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRegenerate={handleRegenerate}
                />
              )}
              
              {stage === 'images' && (
                <ImageApproval
                  segment={segment}
                  index={index}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRegenerate={handleRegenerate}
                  isRegenerating={isRegenerating === segment.id}
                />
              )}

              {stage === 'videos' && (
                <VideoApproval
                  segment={segment}
                  index={index}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRegenerate={handleRegenerate}
                  isRegenerating={isRegenerating === segment.id}
                />
              )}

              {stage === 'audio' && (
                <AudioApproval
                  segment={segment}
                  index={index}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRegenerate={handleRegenerate}
                  isRegenerating={isRegenerating === segment.id}
                />
              )}
            </div>
          ))
        )}
      </div>

      {totalCount === 0 && stage === 'script' && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No segments generated yet</p>
            <Button onClick={() => setShowScriptDialog(true)}>
              Generate Script Segments
            </Button>
          </CardContent>
        </Card>
      )}

      {totalCount > 0 && stage !== 'final' && (
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                {stage === 'script' ? 'Proceed to Images' : 
                 stage === 'images' ? 'Proceed to Videos' : 
                 stage === 'videos' ? 'Proceed to Audio' :
                 stage === 'audio' ? 'Proceed to Final Assembly' :
                 'Proceed to Next Stage'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScriptGenerationDialog
        isOpen={showScriptDialog}
        onClose={() => setShowScriptDialog(false)}
        onGenerate={handleGenerateSegments}
        initialTitle={project?.title || project?.name || ''}
        initialDescription={project?.description || ''}
        isGenerating={isGenerating}
      />
    </div>
  );
}
