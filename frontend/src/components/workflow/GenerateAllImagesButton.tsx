import { useState } from 'react';
import { Sparkles, Loader2, Images, AlertCircle, CheckCircle, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { VideoSegment } from '@/types';

interface GenerateAllImagesButtonProps {
  segments: VideoSegment[];
}

const GeminiImageModel = {
  IMAGE_3: 'imagen-3.0-generate-002',
  IMAGE_4: 'imagen-4.0-generate-preview-06-06',
  IMAGE_4_ULTRA: 'imagen-4.0-ultra-generate-preview-06-06',
}

const SafetyFilterLevel = {
  BLOCK_LOW_AND_ABOVE: "BLOCK_LOW_AND_ABOVE",
  BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE",
  BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH",
  BLOCK_NONE: "BLOCK_NONE",
}

const PersonGeneration = {
  DONT_ALLOW: "DONT_ALLOW",
  ALLOW_ADULT: "ALLOW_ADULT",
  ALLOW_ALL: "ALLOW_ALL",
}

export function GenerateAllImagesButton({ segments }: GenerateAllImagesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(GeminiImageModel.IMAGE_3);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [safetyFilterLevel, setSafetyFilterLevel] = useState<string>(SafetyFilterLevel.BLOCK_LOW_AND_ABOVE);
  const [personGeneration, setPersonGeneration] = useState<string>(PersonGeneration.ALLOW_ADULT);
  const [showSettings, setShowSettings] = useState(false);
  
  const { generateAllSegmentImages } = useProjectStore();
  const { addToast } = useUIStore();

  // Calculate segments that need generation
  const segmentsNeedingGeneration = segments.filter(segment => 
    segment.videoPrompt && 
    segment.videoPrompt.trim() !== '' &&
    (!segment.images || segment.images.length === 0)
  );

  const segmentsWithImages = segments.filter(segment => 
    segment.images && segment.images.length > 0
  );

  const segmentsWithoutPrompts = segments.filter(segment => 
    !segment.videoPrompt || segment.videoPrompt.trim() === ''
  );

  const canGenerate = segmentsNeedingGeneration.length > 0;

  const handleGenerateAll = async () => {
    if (!canGenerate) {
      addToast({
        type: 'warning',
        title: 'Nothing to Generate',
        message: 'All segments either have images or are missing video prompts.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await generateAllSegmentImages(
        aspectRatio,
        selectedModel,
        safetyFilterLevel,
        personGeneration
      );

      // Show detailed results
      if (result.success > 0) {
        addToast({
          type: 'success',
          title: 'Batch Generation Complete',
          message: `Successfully generated ${result.success} images. ${result.skipped > 0 ? `Skipped ${result.skipped} segments with existing images.` : ''} ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
        });
      }

      if (result.failed > 0) {
        addToast({
          type: 'error',
          title: 'Some Generations Failed',
          message: `${result.failed} segments failed to generate. Check individual segments for details.`,
        });
      }

      if (result.success === 0 && result.failed === 0) {
        addToast({
          type: 'info',
          title: 'No Images Generated',
          message: `All ${result.skipped} segments already have images or are missing prompts.`,
        });
      }

    } catch (error) {
      console.error('Batch image generation failed:', error);
      addToast({
        type: 'error',
        title: 'Batch Generation Failed',
        message: 'Failed to generate images for segments. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5 text-purple-500" />
          Batch Image Generation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium text-blue-900">{segmentsNeedingGeneration.length}</div>
              <div className="text-blue-600">Ready to Generate</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium text-green-900">{segmentsWithImages.length}</div>
              <div className="text-green-600">Already Generated</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium text-yellow-900">{segmentsWithoutPrompts.length}</div>
              <div className="text-yellow-600">Missing Prompts</div>
            </div>
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {canGenerate ? (
              `Ready to generate images for ${segmentsNeedingGeneration.length} segment${segmentsNeedingGeneration.length !== 1 ? 's' : ''}`
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
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">AI Model:</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value={GeminiImageModel.IMAGE_3}>{GeminiImageModel.IMAGE_3}</SelectItem>
                    <SelectItem value={GeminiImageModel.IMAGE_4}>{GeminiImageModel.IMAGE_4}</SelectItem>
                    <SelectItem value={GeminiImageModel.IMAGE_4_ULTRA}>{GeminiImageModel.IMAGE_4_ULTRA}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Aspect Ratio:</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Safety Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Safety Filter:</Label>
                <Select value={safetyFilterLevel} onValueChange={setSafetyFilterLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value={SafetyFilterLevel.BLOCK_NONE}>None</SelectItem>
                    <SelectItem value={SafetyFilterLevel.BLOCK_LOW_AND_ABOVE}>Low And Above</SelectItem>
                    <SelectItem value={SafetyFilterLevel.BLOCK_MEDIUM_AND_ABOVE}>Medium And Above</SelectItem>
                    <SelectItem value={SafetyFilterLevel.BLOCK_ONLY_HIGH}>Only High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Person Generation */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Person Generation:</Label>
                <Select value={personGeneration} onValueChange={setPersonGeneration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value={PersonGeneration.ALLOW_ALL}>Allow All</SelectItem>
                    <SelectItem value={PersonGeneration.ALLOW_ADULT}>Allow Adults</SelectItem>
                    <SelectItem value={PersonGeneration.DONT_ALLOW}>Don't Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {segmentsWithImages.length > 0 && (
              <div className="flex items-center gap-1">
                <SkipForward className="h-3 w-3" />
                Segments with existing images will be skipped
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
                Generating {segmentsNeedingGeneration.length} Images...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All Images ({segmentsNeedingGeneration.length})
              </>
            )}
          </Button>
        </div>

        {/* Warning for segments without prompts */}
        {segmentsWithoutPrompts.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-800">Missing Video Prompts</div>
              <div className="text-yellow-700">
                {segmentsWithoutPrompts.length} segment{segmentsWithoutPrompts.length !== 1 ? 's' : ''} 
                {segmentsWithoutPrompts.length === 1 ? ' is' : ' are'} missing video prompts and will be skipped. 
                Please add prompts to individual segments first.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
