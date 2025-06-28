import { useState } from 'react';
import { Play, Download, Share2, Settings, Film, Clock, FileVideo, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Project, MediaAsset } from '@/types';

interface FinalAssemblyProps {
  project: Project;
  onExport: (settings: ExportSettings) => void;
  isExporting?: boolean;
}

interface ExportSettings {
  quality: 'HD' | '4K' | 'SD';
  format: 'MP4' | 'MOV' | 'AVI';
  includeSubtitles: boolean;
  includeBranding: boolean;
  frameRate: number;
  bitrate: string;
}

export function FinalAssembly({ project, onExport, isExporting = false }: FinalAssemblyProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    quality: 'HD',
    format: 'MP4',
    includeSubtitles: false,
    includeBranding: true,
    frameRate: 30,
    bitrate: 'auto',
  });

  // Calculate total duration and stats
  const totalDuration = project.segments.reduce((total, segment) => total + segment.duration, 0);
  const approvedSegments = project.segments.filter(s => 
    s.approvalStatus === 'approved' && 
    s.imageApprovalStatus === 'approved' && 
    s.videoApprovalStatus === 'approved' && 
    s.audioApprovalStatus === 'approved'
  );
  
  // Mock final video
  const finalVideo: MediaAsset = {
    id: `final-${project.id}`,
    filename: `${project.name.replace(/\s+/g, '-').toLowerCase()}-final.${exportSettings.format.toLowerCase()}`,
    url: '/mock-assets/videos/final-video.mp4',
    type: 'video',
    size: totalDuration * 1024 * 1024, // Rough estimate: 1MB per second
    duration: totalDuration,
    width: exportSettings.quality === '4K' ? 3840 : exportSettings.quality === 'HD' ? 1920 : 1280,
    height: exportSettings.quality === '4K' ? 2160 : exportSettings.quality === 'HD' ? 1080 : 720,
    createdAt: new Date().toISOString(),
  };

  const handleExport = () => {
    onExport(exportSettings);
  };

  const handleShare = () => {
    const shareUrl = `https://vdo-maker.com/share/${project.id}`;
    navigator.clipboard.writeText(shareUrl);
    // Toast notification would be shown here
  };

  const getSegmentStatus = (segment: any) => {
    const allApproved = segment.approvalStatus === 'approved' && 
                       segment.imageApprovalStatus === 'approved' && 
                       segment.videoApprovalStatus === 'approved' && 
                       segment.audioApprovalStatus === 'approved';
    return allApproved ? 'complete' : 'incomplete';
  };

  const qualityPresets = {
    'SD': { width: 1280, height: 720, bitrate: '2 Mbps' },
    'HD': { width: 1920, height: 1080, bitrate: '5 Mbps' },
    '4K': { width: 3840, height: 2160, bitrate: '15 Mbps' },
  };

  return (
    <div className="space-y-6">
      {/* Final Video Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Film className="h-5 w-5" />
            <span>Final Video Assembly</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative">
                <div className="text-center text-white">
                  <div className="text-8xl mb-6">🎬</div>
                  <h3 className="text-3xl font-bold mb-2">{project.name}</h3>
                  <p className="text-lg opacity-80">{project.segments.length} segments assembled</p>
                  <p className="text-sm opacity-60 mt-2">
                    {finalVideo.width}x{finalVideo.height} • {Math.round(finalVideo.size / 1024 / 1024)}MB
                  </p>
                </div>

                {/* Play Button Overlay */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
                >
                  <div className="bg-white/90 rounded-full p-6 group-hover:bg-white transition-colors">
                    <Play className="h-12 w-12 text-black ml-1" />
                  </div>
                </button>
              </div>

              {/* Video Controls */}
              <div className="bg-black/90 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:bg-white/20"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      0:00 / {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-sm">
                    {exportSettings.quality} • {exportSettings.format}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Stats */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <FileVideo className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">{exportSettings.quality}</p>
                <p className="text-xs text-muted-foreground">Quality</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Film className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">{project.segments.length}</p>
                <p className="text-xs text-muted-foreground">Segments</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-sm font-medium">{approvedSegments.length}/{project.segments.length}</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.segments.map((segment, index) => {
              const status = getSegmentStatus(segment);
              return (
                <div key={segment.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{segment.script.substring(0, 60)}...</p>
                    <p className="text-xs text-muted-foreground">{segment.duration}s</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Status Indicators */}
                    <div className="flex space-x-1">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          segment.approvalStatus === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                        }`} 
                        title="Script" 
                      />
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          segment.imageApprovalStatus === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                        }`} 
                        title="Image" 
                      />
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          segment.videoApprovalStatus === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                        }`} 
                        title="Video" 
                      />
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          segment.audioApprovalStatus === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                        }`} 
                        title="Audio" 
                      />
                    </div>
                    {status === 'complete' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Export Settings</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSettings && (
            <div className="space-y-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video Quality</label>
                    <select
                      value={exportSettings.quality}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="SD">SD (720p) - Smaller file size</option>
                      <option value="HD">HD (1080p) - Recommended</option>
                      <option value="4K">4K (2160p) - Highest quality</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {qualityPresets[exportSettings.quality].width}x{qualityPresets[exportSettings.quality].height} • 
                      {qualityPresets[exportSettings.quality].bitrate}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">File Format</label>
                    <select
                      value={exportSettings.format}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="MP4">MP4 - Universal compatibility</option>
                      <option value="MOV">MOV - Apple optimized</option>
                      <option value="AVI">AVI - Windows compatible</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frame Rate</label>
                    <select
                      value={exportSettings.frameRate}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, frameRate: Number(e.target.value) }))}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value={24}>24 fps - Cinematic</option>
                      <option value={30}>30 fps - Standard</option>
                      <option value={60}>60 fps - Smooth motion</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bitrate</label>
                    <select
                      value={exportSettings.bitrate}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, bitrate: e.target.value }))}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="auto">Auto (Recommended)</option>
                      <option value="high">High Quality</option>
                      <option value="medium">Medium Quality</option>
                      <option value="low">Low Quality</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeSubtitles}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeSubtitles: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include subtitles/captions</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeBranding}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeBranding: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include VDO Maker watermark</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">Exporting Video...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Processing segments and assembling final video...
              </p>
            </div>
          )}

          {/* Export Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={handleExport}
              disabled={isExporting || approvedSegments.length !== project.segments.length}
              loading={isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Video'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={isExporting}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Preview
            </Button>
          </div>

          {/* Export Preview */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Export Preview:</strong> {finalVideo.filename} • 
              {exportSettings.quality} ({finalVideo.width}x{finalVideo.height}) • 
              {exportSettings.format} • 
              {exportSettings.frameRate} fps • 
              ~{Math.round(finalVideo.size / 1024 / 1024)}MB
            </p>
          </div>

          {/* Readiness Check */}
          {approvedSegments.length !== project.segments.length && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {project.segments.length - approvedSegments.length} segments need approval before export
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
