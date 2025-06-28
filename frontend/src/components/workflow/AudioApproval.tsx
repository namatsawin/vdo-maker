import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Play, Pause, Download, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { VideoSegment, ApprovalStatus } from '@/types';
import { convertToLegacyApprovalStatus } from '@/utils/typeCompatibility';

interface AudioApprovalProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onRegenerate: (segmentId: string) => void;
  isRegenerating?: boolean;
}

interface GeneratedAudio {
  id: string;
  url: string;
  text: string;
  voice: string;
  duration: number;
  size: number;
  generatedAt: string;
}

const VOICE_OPTIONS = [
  { id: 'default', name: 'Default Voice', description: 'Standard AI voice' },
  { id: 'male', name: 'Male Voice', description: 'Professional male narrator' },
  { id: 'female', name: 'Female Voice', description: 'Professional female narrator' },
  { id: 'casual', name: 'Casual Voice', description: 'Friendly conversational tone' },
];

export function AudioApproval({
  segment,
  index,
  onApprove,
  onReject,
  onRegenerate,
  isRegenerating = false
}: AudioApprovalProps) {
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [speed, setSpeed] = useState(1.0);
  
  const { generateSegmentAudio } = useProjectStore();
  const { addToast } = useUIStore();

  // Generate initial audio when component mounts
  useEffect(() => {
    if (!generatedAudio && segment.script) {
      generateInitialAudio();
    }
  }, [segment.script]);

  const generateInitialAudio = async () => {
    setIsGenerating(true);
    try {
      const audioUrl = await generateSegmentAudio(segment.id, segment.script, selectedVoice);
      
      const audio: GeneratedAudio = {
        id: `audio-${segment.id}`,
        url: audioUrl,
        text: segment.script,
        voice: selectedVoice,
        duration: Math.ceil(segment.script.length / 10), // Rough estimate
        size: Math.ceil(segment.script.length * 100), // Rough estimate
        generatedAt: new Date().toISOString(),
      };

      setGeneratedAudio(audio);

      addToast({
        type: 'success',
        title: 'Audio Generated',
        message: 'Voice narration generated successfully!',
      });
    } catch (error) {
      console.error('Audio generation failed:', error);
      addToast({
        type: 'error',
        title: 'Audio Generation Failed',
        message: 'Failed to generate audio. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    onRegenerate(segment.id);
    
    try {
      const audioUrl = await generateSegmentAudio(segment.id, segment.script, selectedVoice);
      
      const newAudio: GeneratedAudio = {
        id: `audio-${segment.id}-${Date.now()}`,
        url: audioUrl,
        text: segment.script,
        voice: selectedVoice,
        duration: Math.ceil(segment.script.length / 10),
        size: Math.ceil(segment.script.length * 100),
        generatedAt: new Date().toISOString(),
      };

      setGeneratedAudio(newAudio);

      addToast({
        type: 'success',
        title: 'Audio Regenerated',
        message: 'New voice narration generated successfully!',
      });
    } catch (error) {
      console.error('Audio regeneration failed:', error);
      addToast({
        type: 'error',
        title: 'Regeneration Failed',
        message: 'Failed to regenerate audio. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (audio: GeneratedAudio) => {
    const link = document.createElement('a');
    link.href = audio.url;
    link.download = `segment-${index + 1}-audio.mp3`;
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

  const selectedVoiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-green-500" />
            Segment {index + 1} - Audio Generation
          </CardTitle>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(segment.audioApprovalStatus || 'draft')}`}>
            {(segment.audioApprovalStatus || 'draft').toUpperCase()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Script */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-1">Script to Narrate:</h4>
          <p className="text-sm bg-gray-50 p-3 rounded-lg">{segment.script}</p>
        </div>

        {/* Voice Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Voice Selection:</h4>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VOICE_OPTIONS.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Speed: {speed}x</h4>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={isGenerating}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Generating voice narration...</p>
              <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Generated Audio */}
        {!isGenerating && generatedAudio && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Generated Audio:</h4>
            
            {/* Audio Player */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const audio = document.getElementById(`audio-${segment.id}`) as HTMLAudioElement;
                      if (audio) {
                        if (isPlaying) {
                          audio.pause();
                          setIsPlaying(false);
                        } else {
                          audio.play();
                          setIsPlaying(true);
                        }
                      }
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <div className="text-sm">
                    <div className="font-medium">segment-{index + 1}-audio.mp3</div>
                    <div className="text-gray-500">
                      Voice: {selectedVoiceData?.name} • Speed: {speed}x • {Math.round(generatedAudio.size / 1024)}KB
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(generatedAudio)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              <audio
                id={`audio-${segment.id}`}
                src={generatedAudio.url}
                className="w-full"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Voice:</strong> {selectedVoiceData?.name}</p>
              <p><strong>Duration:</strong> ~{generatedAudio.duration}s</p>
              <p><strong>Generated:</strong> {new Date(generatedAudio.generatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* No Audio State */}
        {!isGenerating && !generatedAudio && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Volume2 className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audio generated yet</h3>
            <p className="text-gray-500 mb-4">Click "Generate Audio" to create AI voice narration</p>
            <Button onClick={generateInitialAudio} className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Generate Audio
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {generatedAudio && (
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
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve Audio
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
