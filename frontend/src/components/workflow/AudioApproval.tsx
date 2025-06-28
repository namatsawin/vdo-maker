import { useState } from 'react';
import { Check, X, RotateCcw, Volume2, Download, Settings, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { VideoSegment, MediaAsset, ApprovalStatus } from '@/types';

interface AudioApprovalProps {
  segment: VideoSegment;
  index: number;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onRegenerate: (segmentId: string) => void;
  isRegenerating?: boolean;
}

export function AudioApproval({
  segment,
  index,
  onApprove,
  onReject,
  onRegenerate,
  isRegenerating = false
}: AudioApprovalProps) {
  const [selectedVoice, setSelectedVoice] = useState('neural-sarah');
  const [speed, setSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // Mock audio for each segment
  const mockAudio: MediaAsset = {
    id: `audio-${segment.id}`,
    filename: `segment-${index + 1}-audio.mp3`,
    url: '/mock-assets/audio/sample-audio.mp3',
    type: 'audio',
    size: 524288, // 512KB
    duration: segment.duration,
    createdAt: new Date().toISOString(),
  };

  const voiceOptions = [
    { id: 'neural-sarah', name: 'Sarah (Neural)', description: 'Natural, professional female voice', accent: 'US English' },
    { id: 'neural-john', name: 'John (Neural)', description: 'Clear, confident male voice', accent: 'US English' },
    { id: 'neural-emma', name: 'Emma (Neural)', description: 'Warm, friendly female voice', accent: 'British English' },
    { id: 'neural-david', name: 'David (Neural)', description: 'Deep, authoritative male voice', accent: 'Australian English' },
    { id: 'neural-maria', name: 'Maria (Neural)', description: 'Expressive, engaging female voice', accent: 'Spanish English' },
  ];

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pending Review</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Generated</span>;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real implementation, this would control actual audio playback
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mockAudio.url;
    link.download = mockAudio.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedVoiceData = voiceOptions.find(v => v.id === selectedVoice);

  return (
    <Card className={`${getStatusColor(segment.audioApprovalStatus || 'draft')} ${isRegenerating ? 'opacity-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">Segment {index + 1} - Audio</CardTitle>
            {getStatusBadge(segment.audioApprovalStatus || 'draft')}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRegenerate(segment.id)}
              disabled={isRegenerating || segment.audioApprovalStatus === 'approved'}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Script</h4>
          <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
            {segment.script}
          </p>
        </div>

        {/* Audio Settings Panel */}
        {showSettings && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-medium text-sm flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Audio Generation Settings
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice Selection</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  {voiceOptions.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} - {voice.accent}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {selectedVoiceData?.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Speaking Speed: {speed}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Fast)</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pitch</label>
                <select className="w-full p-2 border rounded-md text-sm">
                  <option value="low">Low</option>
                  <option value="normal" selected>Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Emphasis</label>
                <select className="w-full p-2 border rounded-md text-sm">
                  <option value="none">None</option>
                  <option value="moderate" selected>Moderate</option>
                  <option value="strong">Strong</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pause Length</label>
                <select className="w-full p-2 border rounded-md text-sm">
                  <option value="short">Short</option>
                  <option value="normal" selected>Normal</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Generated Audio</h4>
          
          {/* Audio Player */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center space-x-4">
              {/* Voice Avatar */}
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Volume2 className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1 space-y-3">
                {/* Audio Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{mockAudio.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      Voice: {selectedVoiceData?.name} • Speed: {speed}x • {Math.round(mockAudio.size / 1024)}KB
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Waveform Visualization */}
                <div className="w-full h-12 bg-muted rounded flex items-end justify-center px-2 space-x-1">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm transition-colors ${
                        i < (currentTime / segment.duration) * 60 
                          ? 'bg-primary' 
                          : 'bg-primary/30'
                      }`}
                      style={{
                        width: '3px',
                        height: `${Math.random() * 80 + 20}%`,
                        minHeight: '4px',
                      }}
                    />
                  ))}
                </div>
                
                {/* Progress and Time */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono">{formatTime(currentTime)}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 relative">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${(currentTime / segment.duration) * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={segment.duration}
                      value={currentTime}
                      onChange={(e) => setCurrentTime(Number(e.target.value))}
                      className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-mono">{formatTime(segment.duration)}</span>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePlayPause}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Quality Metrics */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">Quality</div>
            <div className="text-muted-foreground">High</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">Bitrate</div>
            <div className="text-muted-foreground">128 kbps</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">Format</div>
            <div className="text-muted-foreground">MP3</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">Sample Rate</div>
            <div className="text-muted-foreground">44.1 kHz</div>
          </div>
        </div>

        {/* Approval Actions */}
        {(segment.audioApprovalStatus === 'draft' || !segment.audioApprovalStatus) && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(segment.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Audio
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(segment.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject Audio
            </Button>
          </div>
        )}

        {segment.audioApprovalStatus === 'rejected' && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(segment.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Audio
            </Button>
          </div>
        )}

        {segment.audioApprovalStatus === 'approved' && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(segment.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Revoke Approval
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Duration: {segment.duration}s • 
          Voice: {selectedVoiceData?.name} • 
          Generated: {new Date(segment.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
