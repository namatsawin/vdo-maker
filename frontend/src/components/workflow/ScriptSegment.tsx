import { useState, useEffect } from 'react';
import { Edit2, Check, X, GripVertical, Volume2, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SimpleSelect';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import type { VideoSegment, ApprovalStatus } from '@/types';
import { isApprovalStatus, convertToLegacyApprovalStatus } from '@/utils/typeCompatibility';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

interface ScriptSegmentProps {
  segment: VideoSegment;
  index: number;
  onUpdate: (segmentId: string, updates: Partial<VideoSegment>) => void;
  onApprove: (segmentId: string) => void;
  onReject: (segmentId: string) => void;
  isDragging?: boolean;
}

export function ScriptSegment({
  segment,
  index,
  onUpdate,
  onApprove,
  onReject,
  isDragging = false
}: ScriptSegmentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState(segment.script);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState(segment.videoPrompt);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('callirrhoe');

  const { currentProject, generateSegmentAudio, selectSegmentAudio } = useProjectStore();
  const { addToast } = useUIStore();

  const currentStatus = segment.scriptApprovalStatus;

  // Exit editing mode if segment becomes approved
  useEffect(() => {
    if (isApprovalStatus(currentStatus, 'approved') && isEditing) {
      setIsEditing(false);
      addToast({
        type: 'info',
        title: 'Editing Disabled',
        message: 'Cannot edit approved segment. Editing mode has been disabled.',
      });
    }
  }, [currentStatus, isEditing, addToast]);

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
      // generateSegmentAudio already handles creating the audio and updating the segment
      await generateSegmentAudio(segment.id, segment.script, selectedVoice);

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

  const handleAudioSelection = async (audioId: string) => {
    try {
      // Get the project ID from the current project in the store
      if (!currentProject) {
        throw new Error('No current project found');
      }

      await selectSegmentAudio(currentProject.id, segment.id, audioId);
      
      addToast({
        type: 'success',
        title: 'Audio Selected',
        message: 'Audio version has been selected successfully',
      });
    } catch (error) {
      console.error('Audio selection failed:', error);
      addToast({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select audio. Please try again.',
      });
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
            {!isEditing && !isApprovalStatus(currentStatus, 'approved') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                title="Edit segment content"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {isApprovalStatus(currentStatus, 'approved') && (
              <div className="flex items-center space-x-1">
                <Lock className="h-3 w-3 text-green-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  title="Cannot edit approved segment"
                  className="cursor-not-allowed"
                >
                  <Edit2 className="h-4 w-4 opacity-30" />
                </Button>
              </div>
            )}
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
            {isApprovalStatus(currentStatus, 'approved') && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md mb-4">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  This segment is approved and cannot be edited
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Script</Label>
              <p className={`text-sm p-3 rounded border ${
                isApprovalStatus(currentStatus, 'approved') 
                  ? 'text-gray-700 bg-gray-50 border-gray-200' 
                  : 'text-muted-foreground bg-white'
              }`}>
                {segment.script}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Video Prompt</Label>
              <p className={`text-sm p-3 rounded border ${
                isApprovalStatus(currentStatus, 'approved') 
                  ? 'text-gray-700 bg-gray-50 border-gray-200' 
                  : 'text-muted-foreground bg-white'
              }`}>
                {segment.videoPrompt}
              </p>
            </div>

            {/* Audio Generation Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Audio Preview</Label>
                {!isApprovalStatus(currentStatus, 'approved') && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      disabled={isGeneratingAudio}
                    >
                    <option value="kore">Kore</option>
                    <option value="zephyr">Zephyr</option>
                    <option value="puck">Puck</option>
                    <option value="charon">Charon</option>
                    <option value="fenrir">Fenrir</option>
                    <option value="leda">Leda</option>
                    <option value="orus">Orus</option>
                    <option value="aoede">Aoede</option>
                    <option value="callirrhoe">Callirrhoe</option>
                    <option value="autonoe">Autonoe</option>
                    <option value="enceladus">Enceladus</option>
                    <option value="iapetus">Iapetus</option>
                    <option value="umbriel">Umbriel</option>
                    <option value="algieba">Algieba</option>
                    <option value="despina">Despina</option>
                    <option value="erinome">Erinome</option>
                    <option value="algenib">Algenib</option>
                    <option value="rasalgethi">Rasalgethi</option>
                    <option value="laomedeia">Laomedeia</option>
                    <option value="achernar">Achernar</option>
                    <option value="alnilam">Alnilam</option>
                    <option value="schedar">Schedar</option>
                    <option value="gacrux">Gacrux</option>
                    <option value="pulcherrima">Pulcherrima</option>
                    <option value="achird">Achird</option>
                    <option value="zubenelgenubi">Zubenelgenubi</option>
                    <option value="vindemiatrix">Vindemiatrix</option>
                    <option value="sadachbia">Sadachbia</option>
                    <option value="sadaltager">Sadaltager</option>
                    <option value="sulafat">Sulafat</option>                  
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
                )}
              </div>
              
              {segment.audios && segment.audios.length > 0 ? (
                <div className="space-y-3">
                  {segment.audios.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium">Version:</Label>
                      <Select
                        value={segment.audios.find(a => a.isSelected)?.id || segment.audios[0]?.id}
                        onValueChange={(audioId) => handleAudioSelection(audioId)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select audio version" />
                        </SelectTrigger>
                        <SelectContent>
                          {segment.audios.sort((a, b) => {
                            const x = new Date(a.createdAt).getTime()
                            const y = new Date(b.createdAt).getTime()
                            return y - x
                          }).map((audio) => (
                            <SelectItem key={audio.id} value={audio.id}>
                              {audio.voice} - {new Date(audio.createdAt).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <AudioPlayer 
                    audio={segment.audios.find(a => a.isSelected) || segment.audios[0]} 
                    compact={true} 
                  />
                </div>
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
      </CardContent>
    </Card>
  );
}
