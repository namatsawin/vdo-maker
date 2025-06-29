import { useState } from 'react';
import { Edit2, Check, X, RotateCcw, GripVertical, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import type { VideoSegment, ApprovalStatus, MediaAsset } from '@/types';
import { isApprovalStatus, convertToLegacyApprovalStatus } from '@/utils/typeCompatibility';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

interface ScriptSegmentProps {
  segment: VideoSegment;
  index: number;
  onUpdate: (segmentId: string, updates: Partial<VideoSegment>) => void;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  onRegenerate: (segmentId: string) => void;
  isDragging?: boolean;
}

export function ScriptSegment({
  segment,
  index,
  onUpdate,
  onApprove,
  onReject,
  onRegenerate,
  isDragging = false
}: ScriptSegmentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState(segment.script);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState(segment.videoPrompt);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('kore');

  const { generateSegmentAudio } = useProjectStore();
  const { addToast } = useUIStore();

  const currentStatus = segment.scriptApprovalStatus;

  const handleSave = () => {
    onUpdate(segment.id, {
      script: editedScript,
      videoPrompt: editedVideoPrompt,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedScript(segment.script);
    setEditedVideoPrompt(segment.videoPrompt);
    setIsEditing(false);
  };

  const handleGenerateAudio = async () => {
    if (!segment.script.trim()) {
      addToast({
        type: 'warning',
        title: 'No Script',
        message: 'Please add a script before generating audio',
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const audioUrl = await generateSegmentAudio(segment.id, segment.script, selectedVoice);
      
      // Create audio asset
      const audioAsset: MediaAsset = {
        id: Math.random().toString(36).substr(2, 9),
        url: audioUrl,
        filename: `segment-${index + 1}-audio.mp3`,
        type: 'audio',
        status: 'DRAFT' as ApprovalStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onUpdate(segment.id, {
        audios: [audioAsset],
      });

      addToast({
        type: 'success',
        title: 'Audio Generated',
        message: 'Audio has been generated for this segment',
      });
    } catch (error) {
      console.error('Audio generation failed:', error);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate audio. Please try again.',
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    const legacyStatus = convertToLegacyApprovalStatus(status);
    switch (legacyStatus) {
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
    const legacyStatus = convertToLegacyApprovalStatus(status);
    switch (legacyStatus) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Pending Review</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Draft</span>;
    }
  };

  return (
    <Card className={`${getStatusColor(currentStatus)} ${isDragging ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <CardTitle className="text-lg">Segment {index + 1}</CardTitle>
            {getStatusBadge(currentStatus)}
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRegenerate(segment.id)}
              disabled={isApprovalStatus(currentStatus, 'approved')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`script-${segment.id}`}>Script</Label>
              <Textarea
                id={`script-${segment.id}`}
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                rows={4}
                placeholder="Enter the script for this segment..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`prompt-${segment.id}`}>Video Prompt</Label>
              <Textarea
                id={`prompt-${segment.id}`}
                value={editedVideoPrompt}
                onChange={(e) => setEditedVideoPrompt(e.target.value)}
                rows={3}
                placeholder="Describe the visual scene for this segment..."
              />
            </div>

            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Script</Label>
              <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
                {segment.script}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Video Prompt</Label>
              <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
                {segment.videoPrompt}
              </p>
            </div>

            {/* Audio Generation Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Audio Preview</Label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                    disabled={isGeneratingAudio}
                  >
                    <option value="kore">Kore (Firm)</option>
                    <option value="puck">Puck (Upbeat)</option>
                    <option value="charon">Charon (Informative)</option>
                    <option value="leda">Leda (Youthful)</option>
                    <option value="enceladus">Enceladus (Breathy)</option>
                    <option value="fenrir">Fenrir (Excitable)</option>
                    <option value="aoede">Aoede (Breezy)</option>
                    <option value="autonoe">Autonoe (Bright)</option>
                    <option value="iapetus">Iapetus (Clear)</option>
                    <option value="algieba">Algieba (Smooth)</option>
                    <option value="gacrux">Gacrux (Mature)</option>
                    <option value="achird">Achird (Friendly)</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio || !segment.script.trim()}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4" />
                        Generate Audio
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {segment.audios && segment.audios.length > 0 ? (
                <AudioPlayer audio={segment.audios[0]} compact={true} />
              ) : (
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded border border-dashed">
                  No audio generated yet. Click "Generate Audio" to preview how this script sounds.
                </div>
              )}
            </div>

            {isApprovalStatus(currentStatus, 'draft') && (
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(segment.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(segment.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {isApprovalStatus(currentStatus, 'rejected') && (
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(segment.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            )}

            {isApprovalStatus(currentStatus, 'approved') && (
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
          </>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Duration: ~{segment.duration || 0}s • 
          Created: {new Date(segment.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
