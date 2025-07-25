import { useState } from 'react';
import { Loader2, Scissors, Clock, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';

interface ScriptRevisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalScript: string;
  onRevisionAccepted: (revisedScript: string) => void;
}

interface RevisionResult {
  revisedScript: string;
  originalLength: number;
  revisedLength: number;
  estimatedTimeSaved: number;
  confidence: number;
  processedAt: string;
  model: string;
}

export function ScriptRevisionDialog({
  isOpen,
  onClose,
  originalScript,
  onRevisionAccepted
}: ScriptRevisionDialogProps) {
  const [isRevising, setIsRevising] = useState(false);
  const [revisionResult, setRevisionResult] = useState<RevisionResult | null>(null);
  const { addToast } = useUIStore();

  const handleRevise = async () => {
    if (!originalScript.trim()) {
      addToast({
        type: 'warning',
        title: 'No Script',
        message: 'Please provide a script to revise',
      });
      return;
    }

    setIsRevising(true);
    try {
      const response = await apiClient.reviseScript(originalScript);
      
      if (response.success && response.data) {
        setRevisionResult(response.data);
        addToast({
          type: 'success',
          title: 'Script Revised',
          message: `Script shortened by ${((response.data.originalLength - response.data.revisedLength) / response.data.originalLength * 100).toFixed(1)}%`,
        });
      } else {
        throw new Error(response.error?.message || 'Failed to revise script');
      }
    } catch (error) {
      console.error('Script revision failed:', error);
      addToast({
        type: 'error',
        title: 'Revision Failed',
        message: error instanceof Error ? error.message : 'Failed to revise script. Please try again.',
      });
    } finally {
      setIsRevising(false);
    }
  };

  const handleAcceptRevision = () => {
    if (revisionResult) {
      onRevisionAccepted(revisionResult.revisedScript);
      addToast({
        type: 'success',
        title: 'Revision Applied',
        message: 'The revised script has been applied to your segment',
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setRevisionResult(null);
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Script Revision - Make it Shorter
          </DialogTitle>
          <DialogDescription>
            Use AI to shorten your script while preserving meaning and context. This will help reduce speaking time by approximately 0.5 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Script */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Original Script</Label>
            <Textarea
              value={originalScript}
              readOnly
              rows={4}
              className="bg-gray-50 text-gray-700"
              placeholder="No script provided"
            />
            <div className="text-xs text-muted-foreground">
              Length: {originalScript.length} characters
            </div>
          </div>

          {/* Revision Button */}
          {!revisionResult && (
            <div className="flex justify-center">
              <Button
                onClick={handleRevise}
                disabled={isRevising || !originalScript.trim()}
                className="flex items-center gap-2"
              >
                {isRevising ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Revising Script...
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    Revise Script
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Revision Result */}
          {revisionResult && (
            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      Length Reduction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {((revisionResult.originalLength - revisionResult.revisedLength) / revisionResult.originalLength * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {revisionResult.originalLength} → {revisionResult.revisedLength} chars
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Time Saved
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {revisionResult.estimatedTimeSaved.toFixed(1)}s
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estimated speaking time reduction
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getConfidenceIcon(revisionResult.confidence)}
                      Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">
                        {(revisionResult.confidence * 100).toFixed(0)}%
                      </div>
                      <Badge className={getConfidenceColor(revisionResult.confidence)}>
                        {revisionResult.confidence >= 0.8 ? 'High' : revisionResult.confidence >= 0.6 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revised Script */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Revised Script</Label>
                <Textarea
                  value={revisionResult.revisedScript}
                  readOnly
                  rows={4}
                  className="bg-green-50 border-green-200 text-gray-700"
                />
                <div className="text-xs text-muted-foreground">
                  Length: {revisionResult.revisedLength} characters
                </div>
              </div>

              {/* Comparison */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-800">Revision Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-blue-700">
                    The AI has successfully shortened your script by{' '}
                    <strong>{((revisionResult.originalLength - revisionResult.revisedLength) / revisionResult.originalLength * 100).toFixed(1)}%</strong>,
                    reducing the estimated speaking time by{' '}
                    <strong>{revisionResult.estimatedTimeSaved.toFixed(1)} seconds</strong> while preserving the original meaning and context.
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    Processed with {revisionResult.model} • {new Date(revisionResult.processedAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleRevise} variant="outline" disabled={isRevising}>
                  {isRevising ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Revising...
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4 mr-2" />
                      Revise Again
                    </>
                  )}
                </Button>
                <Button onClick={handleAcceptRevision} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Revision
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
