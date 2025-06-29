import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

interface ScriptGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (title: string, description: string, model: string) => Promise<void>;
  initialTitle?: string;
  initialDescription?: string;
  isGenerating?: boolean;
}

export function ScriptGenerationDialog({
  isOpen,
  onClose,
  onGenerate,
  initialTitle = '',
  initialDescription = '',
  isGenerating = false
}: ScriptGenerationDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      await onGenerate(title.trim(), description.trim(), selectedModel);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Script generation failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <CardTitle>Generate Video Script</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isGenerating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Use AI to generate a structured video script with visual prompts for each segment.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the main topic or title for your video..."
                disabled={isGenerating}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context, target audience, key points to cover, or specific requirements..."
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isGenerating}
              label="AI Model"
              showDescription={true}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What will be generated:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 3-5 video segments (15-30 seconds each)</li>
                <li>• Script content for narration</li>
                <li>• Visual prompts for each segment</li>
                <li>• Structured workflow for approval</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={!title.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
