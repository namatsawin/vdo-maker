import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, ZoomIn, Download, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { VideoSegment, ApprovalStatus } from '@/types';
import { convertToLegacyApprovalStatus } from '@/utils/typeCompatibility';

interface ImageApprovalProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onRegenerate: (segmentId: string) => void;
  isRegenerating?: boolean;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  generatedAt: string;
}

export function ImageApproval({
  segment,
  index,
  onApprove,
  onReject,
  onRegenerate,
  isRegenerating = false
}: ImageApprovalProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { generateSegmentImage } = useProjectStore();
  const { addToast } = useUIStore();

  // Generate initial images when component mounts
  useEffect(() => {
    if (generatedImages.length === 0 && segment.videoPrompt) {
      generateInitialImages();
    }
  }, [segment.videoPrompt]);

  const generateInitialImages = async () => {
    setIsGenerating(true);
    try {
      // Generate 3 different variations
      const imagePromises = [
        generateSegmentImage(segment.id, segment.videoPrompt, 'LANDSCAPE'),
        generateSegmentImage(segment.id, `${segment.videoPrompt} - variation 2`, 'LANDSCAPE'),
        generateSegmentImage(segment.id, `${segment.videoPrompt} - artistic style`, 'LANDSCAPE'),
      ];

      const results = await Promise.allSettled(imagePromises);
      const images: GeneratedImage[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          images.push({
            id: `img-${segment.id}-${index + 1}`,
            url: result.value,
            prompt: index === 0 ? segment.videoPrompt : `${segment.videoPrompt} - variation ${index + 1}`,
            aspectRatio: 'LANDSCAPE',
            generatedAt: new Date().toISOString(),
          });
        }
      });

      setGeneratedImages(images);
      if (images.length > 0) {
        setSelectedImage(images[0]);
      }

      if (images.length === 0) {
        addToast({
          type: 'error',
          title: 'Image Generation Failed',
          message: 'Unable to generate images. Please try regenerating.',
        });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      addToast({
        type: 'error',
        title: 'Image Generation Error',
        message: 'Failed to generate images. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    onRegenerate(segment.id);
    
    try {
      const newImageUrl = await generateSegmentImage(segment.id, segment.videoPrompt, 'LANDSCAPE');
      const newImage: GeneratedImage = {
        id: `img-${segment.id}-${Date.now()}`,
        url: newImageUrl,
        prompt: segment.videoPrompt,
        aspectRatio: 'LANDSCAPE',
        generatedAt: new Date().toISOString(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage);

      addToast({
        type: 'success',
        title: 'Image Regenerated',
        message: 'New image generated successfully!',
      });
    } catch (error) {
      console.error('Image regeneration failed:', error);
      addToast({
        type: 'error',
        title: 'Regeneration Failed',
        message: 'Failed to regenerate image. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Segment {index + 1} - Image Generation
          </CardTitle>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(segment.imageApprovalStatus || 'draft')}`}>
            {(segment.imageApprovalStatus || 'draft').toUpperCase()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Script and Prompt */}
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-1">Script:</h4>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{segment.script}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-1">Image Prompt:</h4>
            <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">{segment.videoPrompt}</p>
          </div>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Generating images with AI...</p>
              <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Generated Images */}
        {!isGenerating && generatedImages.length > 0 && (
          <>
            {/* Image Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Generated Images:</h4>
              <div className="grid grid-cols-3 gap-4">
                {generatedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.id === image.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={`Generated image ${image.id}`}
                      className="w-full h-32 object-cover"
                    />
                    {selectedImage?.id === image.id && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Image Preview */}
            {selectedImage && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Selected Image:</h4>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.url}
                    alt="Selected image"
                    className="w-full h-64 object-cover cursor-pointer"
                    onClick={() => setShowPreview(true)}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(selectedImage)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Prompt:</strong> {selectedImage.prompt}</p>
                  <p><strong>Generated:</strong> {new Date(selectedImage.generatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Images State */}
        {!isGenerating && generatedImages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Sparkles className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images generated yet</h3>
            <p className="text-gray-500 mb-4">Click "Generate Images" to create AI-generated images for this segment</p>
            <Button onClick={generateInitialImages} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Images
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {generatedImages.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isGenerating || isRegenerating}
              className="flex items-center gap-2"
            >
              {isGenerating || isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Regenerate
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onReject(segment.id)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => onApprove(segment.id)}
                disabled={!selectedImage}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve Image
              </Button>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {showPreview && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPreview(false)}>
            <div className="max-w-4xl max-h-full p-4">
              <img
                src={selectedImage.url}
                alt="Full size preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
