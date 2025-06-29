import { useState, useEffect } from 'react';
import { Wand2, Settings, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { ModelSelector } from '@/components/ui/ModelSelector';
import type { SystemInstruction, SegmentGenerationRequest } from '@/types/shared';
import { GeminiModel } from '@/types/shared';
import { SystemInstructionManager } from '@/components/system-instructions/SystemInstructionManager';
import { apiClient } from '@/lib/api';

interface SegmentGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: SegmentGenerationRequest) => void;
  loading?: boolean;
}

export function SegmentGenerationDialog({ 
  isOpen, 
  onClose, 
  onGenerate, 
  loading = false 
}: SegmentGenerationDialogProps) {
  const [selectedModel, setSelectedModel] = useState<string>(GeminiModel.GEMINI_2_5_FLASH);
  const [instructionMode, setInstructionMode] = useState<'preset' | 'custom'>('preset');
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [instructions, setInstructions] = useState<SystemInstruction[]>([]);
  const [instructionManagerOpen, setInstructionManagerOpen] = useState(false);
  const [loadingInstructions, setLoadingInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInstructions();
    }
  }, [isOpen]);

  const loadInstructions = async () => {
    setLoadingInstructions(true);
    try {
      const response = await apiClient.get('/system-instructions?active=true');
      if (response.success) {
        setInstructions(response.data.instructions);
        // Auto-select default instruction
        const defaultInstruction = response.data.instructions.find((inst: SystemInstruction) => inst.isDefault);
        if (defaultInstruction) {
          setSelectedInstructionId(defaultInstruction.id);
        }
      }
    } catch (err) {
      console.error('Load instructions error:', err);
    } finally {
      setLoadingInstructions(false);
    }
  };

  const handleGenerate = () => {
    const request: SegmentGenerationRequest = {
      model: selectedModel,
    };

    if (instructionMode === 'preset' && selectedInstructionId) {
      request.systemInstructionId = selectedInstructionId;
    } else if (instructionMode === 'custom' && customInstruction.trim()) {
      request.customInstruction = customInstruction.trim();
    }

    onGenerate(request);
  };

  const selectedInstruction = instructions.find(inst => inst.id === selectedInstructionId);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">Generate Video Segments</h2>
                <p className="text-sm text-gray-600">AI will intelligently determine the optimal segmentation</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelSelector
                  value={selectedModel}
                  onChange={setSelectedModel}
                  label="Select AI Model"
                />
                <p className="text-sm text-gray-500 mt-2">
                  The AI will intelligently determine the optimal number of segments based on your content and system instructions.
                </p>
              </CardContent>
            </Card>

            {/* System Instructions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">System Instructions</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInstructionManagerOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Instructions
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instruction Mode Toggle */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="instructionMode"
                      value="preset"
                      checked={instructionMode === 'preset'}
                      onChange={(e) => setInstructionMode(e.target.value as 'preset')}
                    />
                    <span>Use Preset Instruction</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="instructionMode"
                      value="custom"
                      checked={instructionMode === 'custom'}
                      onChange={(e) => setInstructionMode(e.target.value as 'custom')}
                    />
                    <span>Custom Instruction</span>
                  </label>
                </div>

                {instructionMode === 'preset' ? (
                  <div>
                    <Label htmlFor="presetInstruction">Select Preset Instruction</Label>
                    {loadingInstructions ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-500">Loading instructions...</span>
                      </div>
                    ) : (
                      <select
                        id="presetInstruction"
                        value={selectedInstructionId}
                        onChange={(e) => setSelectedInstructionId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select an instruction...</option>
                        {instructions.map((instruction) => (
                          <option key={instruction.id} value={instruction.id}>
                            {instruction.name} ({instruction.category})
                            {instruction.isDefault && ' - Default'}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {selectedInstruction && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {selectedInstruction.name}
                        </p>
                        {selectedInstruction.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedInstruction.description}
                          </p>
                        )}
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words overflow-x-hidden overflow-y-auto">
                          {selectedInstruction.instruction}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="customInstruction">Custom System Instruction</Label>
                    <Textarea
                      id="customInstruction"
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      placeholder="Enter your custom system instruction for AI script generation..."
                      rows={6}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This instruction guides how the AI generates scripts and determines the optimal number of segments for your video.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={loading || (instructionMode === 'custom' && !customInstruction.trim())}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? 'Generating...' : 'Generate Segments'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SystemInstructionManager
        isOpen={instructionManagerOpen}
        onClose={() => {
          setInstructionManagerOpen(false);
          loadInstructions(); // Reload instructions after closing manager
        }}
      />
    </>
  );
}
