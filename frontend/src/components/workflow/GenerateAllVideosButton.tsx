import { useState } from 'react';
import { Video, Loader2, AlertCircle, CheckCircle, SkipForward, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ApprovalStatus } from '@/types';
import type { VideoSegment } from '@/types';

interface GenerateAllVideosButtonProps {
  segments: VideoSegment[];
}

// Duration options supported by the model
const DURATION_OPTIONS = [
  { value: 5, label: '5 seconds', description: 'Short, focused clip' },
  { value: 10, label: '10 seconds', description: 'Extended scene' },
] as const;

// Mode options for video generation
const MODE_OPTIONS = [
  { value: 'std', label: 'Standard', description: 'Balanced quality and speed' },
  { value: 'pro', label: 'Professional', description: 'Higher quality, longer processing' },
] as const;

// Default negative prompt
const DEFAULT_NEGATIVE_PROMPT = 'blurry, low quality, pixelated, noisy, grainy, compression artifacts, distorted, deformed, bad anatomy, poorly drawn, disfigured, malformed, extra limbs, fused limbs, mutated, missing body parts, watermarks, text, signature, logo, cropped, out of frame, unnatural proportions, ugly, bad composition';

export function GenerateAllVideosButton({ segments }: GenerateAllVideosButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [selectedMode, setSelectedMode] = useState<string>('std');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [showSettings, setShowSettings] = useState(false);
  
  const { generateSegmentVideo, currentProject, loadProject } = useProjectStore();
  const { addToast } = useUIStore();

  // Calculate segments that need video generation
  const segmentsNeedingGeneration = segments.filter(segment => {
    const isApprovalValid = 
      segment.scriptApprovalStatus === ApprovalStatus.APPROVED && 
      segment.audioApprovalStatus === ApprovalStatus.APPROVED &&
      segment.imageApprovalStatus === ApprovalStatus.APPROVED && 
      segment.videoApprovalStatus !== ApprovalStatus.APPROVED
    
    if (!isApprovalValid) return false;

    const hasImage = segment.images.some(item => item.url && item.isSelected)

    if (!hasImage) return false

    const hasVideo = segment.videos.some(item => item.status !== 'failed')

    return !hasVideo
  });

  const segmentsWithVideos = segments.filter(segment => 
    segment.videos && segment.videos.length > 0 && segment.videoApprovalStatus === ApprovalStatus.APPROVED
  );

  const segmentsMissingRequirements = segments.filter(segment => {
    const hasApprovedImage = segment.images && segment.images.some(img => img.isSelected);
    const hasVideoPrompt = segment.videoPrompt && segment.videoPrompt.trim() !== '';
    return !hasApprovedImage || !hasVideoPrompt;
  });

  const canGenerate = segmentsNeedingGeneration.length > 0;

  const handleGenerateAll = async () => {
    if (!canGenerate) {
      addToast({
        type: 'warning',
        title: 'Nothing to Generate',
        message: 'All segments either have videos or are missing required images/prompts.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await Promise.all(segmentsNeedingGeneration.map(segment => {
        const image = segment.images.find(item => item.isSelected)
        return generateSegmentVideo(
          segment.id, 
          image!.url, 
          segment.videoPrompt, 
          selectedDuration, 
          negativePrompt, 
          selectedMode
        )
      }))

      addToast({
        type: 'success',
        title: 'Batch Video Generation Complete',
        message: `Successfully batch generated videos.`,
      });

      if (currentProject) loadProject(currentProject.id)

    } catch (error) {
      console.error('Batch video generation failed:', error);
      addToast({
        type: 'error',
        title: 'Batch Generation Failed',
        message: 'Failed to generate videos for segments. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-purple-500" />
          Batch Video Generation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Play className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium text-blue-900">{segmentsNeedingGeneration.length}</div>
              <div className="text-blue-600">Ready to Generate</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium text-green-900">{segmentsWithVideos.length}</div>
              <div className="text-green-600">Already Generated</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium text-yellow-900">{segmentsMissingRequirements.length}</div>
              <div className="text-yellow-600">Missing Requirements</div>
            </div>
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {canGenerate ? (
              `Ready to generate videos for ${segmentsNeedingGeneration.length} segment${segmentsNeedingGeneration.length !== 1 ? 's' : ''}`
            ) : (
              'No segments available for generation'
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </Button>
        </div>

        {/* Generation Settings */}
        {showSettings && (
          <div className="p-4 bg-white rounded-lg border space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Batch Generation Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Duration Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Duration:</Label>
                <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Quality Mode:</Label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    {MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Negative Prompt */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Negative Prompt (Optional):</Label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Describe what you don't want in the videos..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {segmentsWithVideos.length > 0 && (
              <div className="flex items-center gap-1">
                <SkipForward className="h-3 w-3" />
                Segments with existing videos will be skipped
              </div>
            )}
          </div>
          
          <Button
            onClick={handleGenerateAll}
            disabled={isGenerating || !canGenerate}
            className="flex items-center gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {segmentsNeedingGeneration.length} Videos...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate All Videos ({segmentsNeedingGeneration.length})
              </>
            )}
          </Button>
        </div>

        {/* Warning for segments without requirements */}
        {segmentsMissingRequirements.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-800">Missing Requirements</div>
              <div className="text-yellow-700">
                {segmentsMissingRequirements.length} segment{segmentsMissingRequirements.length !== 1 ? 's are' : ' is'} 
                {segmentsMissingRequirements.length === 1 ? ' is' : ' are'} missing approved images or video prompts and will be skipped. 
                Please ensure segments have both approved images and video prompts.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
