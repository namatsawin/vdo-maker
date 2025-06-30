import { useState, useEffect } from 'react';
import { Check, X, ZoomIn, Download, Loader2, Sparkles, Settings, Lock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/Collapsible';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { VideoSegment, ApprovalStatus } from '@/types';
import { convertToLegacyApprovalStatus, isApprovalStatus } from '@/utils/typeCompatibility';

interface ImageGenerationProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
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

export function ImageApproval({
  segment,
  index,
  onApprove,
  onReject,
}: ImageGenerationProps) {
  const [imagePrompt, setImagePrompt] = useState(segment.videoPrompt || '');
  const [selectedModel, setSelectedModel] = useState<string>(GeminiImageModel.IMAGE_3);
  const [safetyFilterLevel, setSafetyFilterLevel] = useState<string>(SafetyFilterLevel.BLOCK_LOW_AND_ABOVE);
  const [personGeneration, setPersonGeneration] = useState<string>(PersonGeneration.ALLOW_ADULT);

  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { generateSegmentImage, selectSegmentImage, currentProject } = useProjectStore();
  const { addToast } = useUIStore();

  const currentStatus = segment.imageApprovalStatus;
  const isApproved = isApprovalStatus(currentStatus, 'approved');

  const selectedImage = segment.images?.find(img => img.isSelected) || segment.images?.[0] || null;
  const hasImages = segment.images && segment.images.length > 0;
  const hasMultipleImages = segment.images && segment.images.length > 1;

  useEffect(() => {
    if (isApproved) setIsCollapsed(true)
  }, [])

  const approve = (segmentId: string) => {
    onApprove(segmentId)
    setIsCollapsed(true)
    setShowAdvanced(false);
  }

  const reject = (segmentId: string) => {
    onReject(segmentId)
  }

  // Create collapsed summary content
  const getCollapsedSummary = () => {
    if (!hasImages) {
      return (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <ImageIcon className="h-4 w-4" />
          <span>No image generated yet</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src={selectedImage?.url}
            alt={`Segment ${index + 1} thumbnail`}
            className="w-12 h-8 object-cover rounded border"
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {selectedImage?.metadata?.model || selectedModel}
            </div>
            <div className="text-gray-500 text-xs">
              {hasMultipleImages ? `${segment.images.length} versions` : '1 version'}
            </div>
          </div>
        </div>
        {isApproved && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Approved</span>
          </div>
        )}
      </div>
    );
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Prompt',
        message: 'Please enter an image prompt before generating.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateSegmentImage(segment.id, imagePrompt.trim(), aspectRatio, selectedModel, safetyFilterLevel, personGeneration);
      
      addToast({
        type: 'success',
        title: 'Image Generated',
        message: `Image has been successfully generated using ${selectedModel}.`,
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate image. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectImage = async (imageId: string) => {
    try {
      // Get the project ID from the current project in the store
      if (!currentProject) {
        throw new Error('No current project found');
      }

      await selectSegmentImage(currentProject.id, segment.id, imageId);
      
      addToast({
        type: 'success',
        title: 'Image Selected',
        message: 'Image version has been selected successfully',
      });
    } catch (error) {
      console.error('Image selection failed:', error);
      addToast({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select image. Please try again.',
      });
    }
  };

  const handleDownload = () => {
    if (!selectedImage) return;
    
    const link = document.createElement('a');
    link.href = selectedImage.url;
    link.download = `segment-${index + 1}-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: ApprovalStatus) => {
    const legacyStatus = convertToLegacyApprovalStatus(status);
    switch (legacyStatus) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    const legacyStatus = convertToLegacyApprovalStatus(status);
    switch (legacyStatus) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pending Review</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Draft</span>;
    }
  };

  return (
    <Card className={`w-full ${isApproved ? 'border-green-200 bg-green-50' : ''}`}>
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => setIsCollapsed(!open)}
        className='px-4'
        trigger={
          <CollapsibleTrigger>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Segment {index + 1}
                  {isApproved && <Lock className="h-4 w-4 text-green-600" />}
                </CardTitle>
                {getStatusBadge(segment.imageApprovalStatus || 'DRAFT')}
              </div>
              {isCollapsed && (
                <div className="mt-3">
                  {getCollapsedSummary()}
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>
        }
      >
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
        {/* Approval Lock Notice */}
        {isApproved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              This segment is approved and cannot be edited
            </span>
          </div>
        )}

        {/* Script Display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Script:</Label>
          <div className={`text-sm p-3 rounded-lg border ${
            isApproved 
              ? 'text-gray-700 bg-gray-50 border-gray-200' 
              : 'bg-gray-50'
          }`}>
            {segment.script}
          </div>
        </div>

        {/* Image Prompt Editor */}
        <div className="space-y-2">
          <Label htmlFor={`image-prompt-${segment.id}`} className="text-sm font-medium text-gray-700">
            Image Prompt:
          </Label>
          <Textarea
            id={`image-prompt-${segment.id}`}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            rows={3}
            className={`resize-none ${isApproved ? 'cursor-not-allowed opacity-60' : ''}`}
            disabled={isApproved}
            readOnly={isApproved}
          />
          <p className="text-xs text-gray-500">
            This prompt will be used to generate the first frame image for this segment.
          </p>
        </div>

        {/* Model Selection and Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Generation Settings:</Label>
            {!isApproved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            )}
            {isApproved && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="h-3 w-3" />
                Settings Locked
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">AI Model:</Label>
              <Select 
                value={selectedModel} 
                onValueChange={(value) => setSelectedModel(value)}
                disabled={isApproved}
              >
                <SelectTrigger className={isApproved ? 'cursor-not-allowed opacity-60' : ''}>
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
              <Select 
                value={aspectRatio} 
                onValueChange={(value) => setAspectRatio(value)}
                disabled={isApproved}
              >
                <SelectTrigger className={isApproved ? 'cursor-not-allowed opacity-60' : ''}>
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
          </div>

          {/* Advanced Settings */}
          {showAdvanced && !isApproved && (
            <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Advanced Settings</h4>
              <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating || !imagePrompt.trim() || isApproved}
            className={`flex items-center gap-2 ${isApproved ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating with {selectedModel}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {hasImages ? 'Regenerate' : 'Generate'} with {selectedModel}
                {isApproved && <Lock className="h-3 w-3 ml-1" />}
              </>
            )}
          </Button>
          {isApproved && (
            <span className="text-xs text-gray-500">
              Cannot regenerate approved segment
            </span>
          )}
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Generating image with {selectedModel}...</p>
              <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Generated Image Display */}
        {/* Generated Images Display */}
        {!isGenerating && hasImages && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Generated Images:</Label>
              {hasMultipleImages && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Select Version:</Label>
                  <Select 
                    value={selectedImage?.id || ''} 
                    onValueChange={handleSelectImage}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Choose image version" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {segment.images.sort((a, b) => {
                        const x = new Date(a.createdAt).getTime()
                        const y = new Date(b.createdAt).getTime()
                        return y - x
                      }).map((image) => (
                        <SelectItem key={image.id} value={image.id}>
                          {image.metadata?.model || 'Unknown Model'} - {new Date(image.createdAt).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {selectedImage && (
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={`Generated image for segment ${index + 1}`}
                  className="aspect-video w-full max-w-xl mx-auto object-contain cursor-pointer"
                  onClick={() => setShowPreview(true)}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="bg-white/90 hover:bg-white"
                    title="View full size"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="bg-white/90 hover:bg-white"
                    title="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Prompt:</strong> {selectedImage?.prompt || imagePrompt}</p>
              <p><strong>Model:</strong> {selectedImage?.metadata?.model || selectedModel}</p>
              <p><strong>Generated:</strong> {selectedImage ? new Date(selectedImage.createdAt).toLocaleString() : 'N/A'}</p>
              {hasMultipleImages && (
                <p><strong>Total Versions:</strong> {segment.images.length}</p>
              )}
            </div>
          </div>
        )}

        {/* No Image State */}
        {!isGenerating && !hasImages && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-gray-400 mb-3">
              <Sparkles className="mx-auto h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No images generated yet</h3>
            <p className="text-xs text-gray-500">Configure settings above and click "Generate"</p>
          </div>
        )}

        {/* Approval Actions */}
        {hasImages && !isGenerating && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {isApprovalStatus(currentStatus, 'draft') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => reject(segment.id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => approve(segment.id)}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </>
            )}

            {isApprovalStatus(currentStatus, 'rejected') && (
              <Button
                variant="outline"
                onClick={() => approve(segment.id)}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}

            {isApprovalStatus(currentStatus, 'approved') && (
              <Button
                variant="outline"
                onClick={() => reject(segment.id)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Revoke Approval
              </Button>
            )}
          </div>
        )}

        {/* Image Preview Modal */}
        {showPreview && hasImages && selectedImage && (
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50" 
            onClick={() => setShowPreview(false)}
          >
            <div className="max-w-4xl max-h-full p-4">
              <img
                src={selectedImage.url}
                alt="Full size preview"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
