import { useState } from 'react';
import { Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

interface AudioGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (text: string, voice: string, model: string) => Promise<void>;
  initialText?: string;
  isGenerating?: boolean;
}

const VOICE_OPTIONS = [
  { value: 'default', label: 'Default Voice', description: 'Standard neutral voice' },
  { value: 'male', label: 'Male Voice', description: 'Professional male narrator' },
  { value: 'female', label: 'Female Voice', description: 'Professional female narrator' },
  { value: 'casual', label: 'Casual Voice', description: 'Friendly conversational tone' },
  { value: 'professional', label: 'Professional Voice', description: 'Formal business tone' },
];

export function AudioGenerationDialog({
  isOpen,
  onClose,
  onGenerate,
  initialText = '',
  isGenerating = false
}: AudioGenerationDialogProps) {
  const [text, setText] = useState(initialText);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    try {
      await onGenerate(text.trim(), selectedVoice, selectedModel);
      onClose();
    } catch (error) {
      console.error('Audio generation failed:', error);
    }
  };

  const wordCount = text.trim().split(/\s+/).length;
  const estimatedDuration = Math.ceil(wordCount / 2.5); // ~2.5 words per second

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-green-500" />
              <CardTitle>Generate Audio Narration</CardTitle>
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
            Convert text to speech using AI-powered text-to-speech technology.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">Script Text *</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                rows={6}
                disabled={isGenerating}
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{wordCount} words</span>
                <span>~{estimatedDuration} seconds</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voice Style</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VOICE_OPTIONS.map((voice) => (
                  <Button
                    key={voice.value}
                    type="button"
                    variant={selectedVoice === voice.value ? "default" : "outline"}
                    onClick={() => setSelectedVoice(voice.value)}
                    disabled={isGenerating}
                    className="h-auto p-3 text-left"
                  >
                    <div>
                      <div className="font-medium">{voice.label}</div>
                      <div className="text-xs text-muted-foreground">{voice.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isGenerating}
              label="AI Model"
              showDescription={true}
            />

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Audio Generation Info:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• High-quality AI-generated speech</li>
                <li>• Natural intonation and pacing</li>
                <li>• Optimized for video narration</li>
                <li>• MP3 format output</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={!text.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Generate Audio
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
