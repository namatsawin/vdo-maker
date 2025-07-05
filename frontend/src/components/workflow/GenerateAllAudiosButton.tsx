import { useState } from 'react';
import { Volume2, Loader2, AlertCircle, CheckCircle, SkipForward, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ApprovalStatus } from '@/types';
import type { VideoSegment } from '@/types';

interface GenerateAllAudiosButtonProps {
  segments: VideoSegment[];
}

const VoiceOptions = {
  CALLIRRHOE: 'callirrhoe',
  CHARON: 'charon',
  HELIOS: 'helios',
  KLEON: 'kleon',
  PERICLES: 'pericles',
  PERSEUS: 'perseus',
  PHAIDRA: 'phaidra',
  THALIA: 'thalia',
  ZEUS: 'zeus',
  KORE: 'kore'
} as const;

const GeminiModels = {
  PRO: 'gemini-2.5-pro-preview-tts',
  FLASH: 'gemini-2.5-flash-preview-tts',
} as const;

export function GenerateAllAudiosButton({ segments }: GenerateAllAudiosButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(VoiceOptions.CALLIRRHOE);
  const [selectedModel, setSelectedModel] = useState<string>(GeminiModels.FLASH);
  const [showSettings, setShowSettings] = useState(false);
  
  const { generateSegmentAudio } = useProjectStore();
  const { addToast } = useUIStore();

  // Calculate segments that need audio generation
  const segmentsNeedingGeneration = segments.filter(segment => {
    const hasScript = segment.script && segment.script.trim() !== '';
    const needsAudio = !segment.audios?.length
    
    return hasScript && needsAudio;
  });

  const segmentsWithAudios = segments.filter(segment => 
    segment.audios && segment.audios.length > 0 && segment.audioApprovalStatus === ApprovalStatus.APPROVED
  );

  const segmentsMissingScripts = segments.filter(segment => 
    !segment.script || segment.script.trim() === ''
  );

  const canGenerate = segmentsNeedingGeneration.length > 0;

  const handleGenerateAll = async () => {
    if (!canGenerate) {
      addToast({
        type: 'warning',
        title: 'Nothing to Generate',
        message: 'All segments either have audios or are missing scripts.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      for (const segment of segmentsNeedingGeneration) {
        await generateSegmentAudio(segment.id, segment.script, selectedVoice, selectedModel)
      }
      
      // await Promise.all(segmentsNeedingGeneration.map(segment => {
      //   return generateSegmentAudio(segment.id, segment.script, selectedVoice, selectedModel)
      // }))

      addToast({
        type: 'success',
        title: 'Batch Audio Generation Complete',
        message: `Successfully batch generated audios`,
      });
    } catch (error) {
      console.error('Batch audio generation failed:', error);
      addToast({
        type: 'error',
        title: 'Batch Generation Failed',
        message: 'Failed to generate audios for segments. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-green-500" />
          Batch Audio Generation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Mic className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium text-blue-900">{segmentsNeedingGeneration.length}</div>
              <div className="text-blue-600">Ready to Generate</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium text-green-900">{segmentsWithAudios.length}</div>
              <div className="text-green-600">Already Generated</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium text-yellow-900">{segmentsMissingScripts.length}</div>
              <div className="text-yellow-600">Missing Scripts</div>
            </div>
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {canGenerate ? (
              `Ready to generate audios for ${segmentsNeedingGeneration.length} segment${segmentsNeedingGeneration.length !== 1 ? 's' : ''}`
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
              {/* Voice Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Voice:</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value={VoiceOptions.KORE}>Kore (Female)</SelectItem>
                    <SelectItem value={VoiceOptions.CALLIRRHOE}>Callirrhoe (Female)</SelectItem>
                    <SelectItem value={VoiceOptions.CHARON}>Charon (Male)</SelectItem>
                    <SelectItem value={VoiceOptions.HELIOS}>Helios (Male)</SelectItem>
                    <SelectItem value={VoiceOptions.KLEON}>Kleon (Male)</SelectItem>
                    <SelectItem value={VoiceOptions.PERICLES}>Pericles (Male)</SelectItem>
                    <SelectItem value={VoiceOptions.PERSEUS}>Perseus (Male)</SelectItem>
                    <SelectItem value={VoiceOptions.PHAIDRA}>Phaidra (Female)</SelectItem>
                    <SelectItem value={VoiceOptions.THALIA}>Thalia (Female)</SelectItem>
                    <SelectItem value={VoiceOptions.ZEUS}>Zeus (Male)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">AI Model:</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value={GeminiModels.FLASH}>Gemini 2.5 Preview Flash</SelectItem>
                    <SelectItem value={GeminiModels.PRO}>Gemini 2.5 Preview Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {segmentsWithAudios.length > 0 && (
              <div className="flex items-center gap-1">
                <SkipForward className="h-3 w-3" />
                Segments with existing audios will be skipped
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
                Generating {segmentsNeedingGeneration.length} Audios...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Generate All Audios ({segmentsNeedingGeneration.length})
              </>
            )}
          </Button>
        </div>

        {/* Warning for segments without scripts */}
        {segmentsMissingScripts.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-800">Missing Scripts</div>
              <div className="text-yellow-700">
                {segmentsMissingScripts.length} segment{segmentsMissingScripts.length !== 1 ? 's are' : ' is'} 
                missing scripts and will be skipped. Please add scripts to individual segments first.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
