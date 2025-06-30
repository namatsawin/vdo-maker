import { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Copy, 
  X, 
  RefreshCw,
  Zap,
  BrushCleaning
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { useAIStore } from '@/stores/aiStore';
import { useUIStore } from '@/stores/uiStore';

interface PromptAdvisorProps {
  currentPrompt: string;
  onPromptUpdate: (newPrompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  issues: string[];
  revisedPrompt: string;
  confidence: number;
}

export function PromptAdvisor({ 
  currentPrompt, 
  onPromptUpdate, 
  isOpen, 
  onClose 
}: PromptAdvisorProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(currentPrompt);
  
  const { analyzeAndReviseContent } = useAIStore();
  const { addToast } = useUIStore();

  const handleAnalyze = async () => {
    if (!tempPrompt.trim()) {
      addToast({
        type: 'warning',
        title: 'Empty Content',
        message: 'Please enter content to analyze.',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeAndReviseContent(tempPrompt);
      setAnalysis(result);
    } catch (error) {
      console.error('Prompt analysis failed:', error);
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: 'Failed to analyze content. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyRevised = async () => {
    if (!analysis?.revisedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(analysis.revisedPrompt);
      addToast({
        type: 'success',
        title: 'Copied!',
        message: 'Revised content copied to clipboard.',
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = analysis.revisedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      addToast({
        type: 'success',
        title: 'Copied!',
        message: 'Revised content copied to clipboard.',
      });
    }
  };

  const handleUseRevised = () => {
    if (!analysis?.revisedPrompt) return;
    
    onPromptUpdate(analysis.revisedPrompt);
    addToast({
      type: 'success',
      title: 'Content Updated',
      message: 'Your content has been updated with AI improvements.',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BrushCleaning className="h-5 w-5 text-purple-500" />
              AI Sanitizer
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Get AI feedback to improve your content by removing inappropriate terms while preserving meaning.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Prompt Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Your Current Content:
            </Label>
            <Textarea
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value)}
              placeholder="Enter your content here..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Analyze Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !tempPrompt.trim()}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Content
                </>
              )}
            </Button>
            
            {analysis && (
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Re-analyze
              </Button>
            )}
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              {/* Issues Found */}
              {analysis.issues.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Issues Found ({analysis.issues.length})
                  </Label>
                  <div className="space-y-2">
                    {analysis.issues.map((issue, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revised Prompt */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI-Improved Content
                  <span className="text-xs text-gray-500 font-normal">
                    (Confidence: {Math.round(analysis.confidence * 100)}%)
                  </span>
                </Label>
                <div className="relative">
                  <Textarea
                    value={analysis.revisedPrompt}
                    readOnly
                    rows={6}
                    className="resize-none bg-green-50 border-green-200 text-green-800"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyRevised}
                      className="h-8 px-2 bg-white/80 hover:bg-white"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  {analysis.revisedPrompt !== tempPrompt ? (
                    <span className="text-green-600">✓ Improvements suggested</span>
                  ) : (
                    <span className="text-blue-600">✓ Your prompt looks good!</span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Keep Original
                  </Button>
                  
                  <Button
                    onClick={handleUseRevised}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Use Improved Content
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600">AI is analyzing your content...</p>
                <p className="text-xs text-gray-400 mt-1">This will only take a moment</p>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!analysis && !isAnalyzing && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Quick & Cost-Effective Analysis:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Identifies inappropriate or sensitive content</li>
                <li>• Provides a cleaned version of your content</li>
                <li>• Maintains your original meaning and intent</li>
                <li>• Optimized for minimal AI cost</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
