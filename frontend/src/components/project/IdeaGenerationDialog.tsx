import { useState } from 'react';
import { Lightbulb, Sparkles, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { apiClient } from '@/lib/api';
import { GeminiModel } from '@/types/shared';
import { cn } from '@/lib/utils';

interface VideoIdea {
  title: string;
  description: string;
  isFactBased: boolean;
}

interface IdeaGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIdea: (idea: VideoIdea) => void;
}

export function IdeaGenerationDialog({ isOpen, onClose, onSelectIdea }: IdeaGenerationDialogProps) {
  const [topic, setTopic] = useState('');
  const [tempTopic, setTempTopic] = useState(topic)
  const [selectedModel, setSelectedModel] = useState<string>(GeminiModel.GEMINI_2_5_FLASH);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (topic !== tempTopic) {
        setIdeas([])
      }

      const response = await apiClient.post('/ai/generate-ideas', {
        topic: topic.trim(),
        model: selectedModel,
        count: 5,
        existingIdeas: ideas.map(item => item.title),
      });


      if (response.success) {
        setIdeas(response.data?.ideas ?? []);
        setTempTopic(topic)
      } else {
        setError(response.data.error || 'Failed to generate ideas');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = (idea: VideoIdea) => {
    onSelectIdea(idea);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">AI Video Idea Generator</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Input Section */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="topic">Topic or Theme</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., เหตุการณ์ปะหลาด, สัตว์โลก, เทคโนโลยีอนาคต"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a topic in any language to generate creative video ideas
              </p>
            </div>

            <div>
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                label="AI Model"
                showDescription={false}
              />
            </div>

            <Button
              onClick={generateIdeas}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Video Ideas
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Ideas Display */}
          {ideas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                Generated Ideas ({ideas.length})
              </h3>
              
              <div className="grid gap-4">
                {ideas.map((idea, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{idea.title}</CardTitle>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          idea.isFactBased 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {idea.isFactBased ? 'Fact-Based' : 'Creative'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 mb-3 font-medium">{idea.description}</p>
                      
                      <Button
                        onClick={() => handleSelectIdea(idea)}
                        className="w-full"
                        variant="outline"
                      >
                        Use This Idea
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={generateIdeas}
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', { 'animate-spin': loading })} />
                  Generate More Ideas
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && ideas.length === 0 && !error && (
            <div className="text-center py-12">
              <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Ideas</h3>
              <p className="text-gray-500">
                Enter a topic above and click "Generate Video Ideas" to get AI-powered suggestions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
