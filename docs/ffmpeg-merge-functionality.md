# FFmpeg Merge Functionality

## Overview

The Final Assembly component now includes advanced FFmpeg-based merging capabilities to combine video and audio tracks with customizable options for handling duration mismatches and encoding preferences.

## Features

### 🎬 **Merge Options**

#### Duration Strategy
- **Shortest (Default)**: Uses the shorter duration between video and audio
- **Longest**: Uses the longer duration, padding shorter track
- **Match Video**: Uses video duration, truncating/padding audio
- **Match Audio**: Uses audio duration, truncating/padding video

#### Audio Controls
- **Volume Control**: 0.0x to 2.0x audio volume adjustment
- **Fade In**: 0-5 seconds fade in effect
- **Fade Out**: 0-5 seconds fade out effect

#### Codec Options
- **Video Codec**:
  - `copy`: Fastest, no re-encoding
  - `h264`: Re-encode with H.264 (compatibility)
  - `h265`: Re-encode with H.265 (smaller file size)
- **Audio Codec**:
  - `copy`: Fastest, no re-encoding
  - `aac`: Re-encode with AAC (quality)
  - `mp3`: Re-encode with MP3 (compatibility)

## User Interface

### Merge Section Layout
```
┌─ Merge Video & Audio ──────────────────────────┐
│                              [Options] [Merge] │
├─ Options Panel (Collapsible) ─────────────────┤
│ Duration Strategy: [Shortest ▼]               │
│ Audio Volume: [1.0x] ████████████████████████  │
│ Fade In: [0s] ████████████████████████████████  │
│ Fade Out: [0s] ███████████████████████████████  │
│ Video Codec: [Copy ▼]  Audio Codec: [Copy ▼]  │
│ ─────────────────────────────────────────────  │
│ Video: 2:15  Audio: 2:20  Result: 2:15        │
└───────────────────────────────────────────────┘
```

### States

#### 1. **Ready to Merge**
- Shows merge button and options toggle
- Options panel collapsible (hidden by default)
- Real-time duration calculation preview

#### 2. **Merging in Progress**
- Shows loading spinner and "Merging..." text
- Button disabled during processing
- Processing time based on duration and complexity

#### 3. **Merge Complete**
- Shows merged video preview
- Displays result metadata (duration, size, strategy used)
- Green success styling

## Technical Implementation

### FFmpeg Command Generation
```typescript
// Example FFmpeg command structure based on options:
const generateFFmpegCommand = (options: MergeOptions) => {
  let cmd = `ffmpeg -i video.mp4 -i audio.mp3`;
  
  // Duration strategy
  switch (options.duration) {
    case 'shortest': cmd += ` -shortest`; break;
    case 'longest': cmd += ` -filter_complex "[0:v]pad=..."`; break;
    // ... other strategies
  }
  
  // Audio filters
  if (options.audioVolume !== 1.0) {
    cmd += ` -af "volume=${options.audioVolume}"`;
  }
  
  if (options.fadeIn > 0 || options.fadeOut > 0) {
    cmd += ` -af "afade=t=in:ss=0:d=${options.fadeIn},afade=t=out:st=${duration-options.fadeOut}:d=${options.fadeOut}"`;
  }
  
  // Codecs
  cmd += ` -c:v ${options.videoCodec} -c:a ${options.audioCodec}`;
  
  return cmd + ` output.mp4`;
};
```

### State Management
```typescript
interface MergeOptions {
  duration: 'shortest' | 'longest' | 'video' | 'audio';
  audioVolume: number; // 0.0 to 2.0
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  videoCodec: 'copy' | 'h264' | 'h265';
  audioCodec: 'copy' | 'aac' | 'mp3';
}

// State tracking
const [mergingSegments, setMergingSegments] = useState<Set<string>>();
const [mergedVideos, setMergedVideos] = useState<Map<string, MergedVideo>>();
const [showMergeOptions, setShowMergeOptions] = useState<Record<string, boolean>>();
const [mergeOptions, setMergeOptions] = useState<Record<string, MergeOptions>>();
```

## Processing Logic

### Duration Calculation
```typescript
const calculateFinalDuration = (videoDuration: number, audioDuration: number, strategy: string) => {
  switch (strategy) {
    case 'shortest': return Math.min(videoDuration, audioDuration);
    case 'longest': return Math.max(videoDuration, audioDuration);
    case 'video': return videoDuration;
    case 'audio': return audioDuration;
    default: return Math.min(videoDuration, audioDuration);
  }
};
```

### Processing Time Estimation
```typescript
// Processing time based on duration and complexity
const estimateProcessingTime = (duration: number, options: MergeOptions) => {
  let baseTime = duration * 100; // 100ms per second of content
  
  // Add time for re-encoding
  if (options.videoCodec !== 'copy') baseTime *= 3;
  if (options.audioCodec !== 'copy') baseTime *= 1.5;
  
  // Add time for effects
  if (options.fadeIn > 0 || options.fadeOut > 0) baseTime *= 1.2;
  
  return Math.max(2000, baseTime); // Minimum 2 seconds
};
```

## API Integration

### Current (Mock Implementation)
- Simulates FFmpeg processing with realistic timing
- Calculates result duration based on selected strategy
- Estimates file size with compression factors

### Future (Real Implementation)
```typescript
// Backend API endpoint
POST /api/segments/{id}/merge
{
  "videoUrl": "...",
  "audioUrl": "...",
  "options": {
    "duration": "shortest",
    "audioVolume": 1.0,
    "fadeIn": 0,
    "fadeOut": 0,
    "videoCodec": "copy",
    "audioCodec": "copy"
  }
}

// Response
{
  "success": true,
  "data": {
    "mergedVideoUrl": "...",
    "duration": 135.5,
    "size": 15728640,
    "processingTime": 8.2
  }
}
```

## User Experience

### Workflow
1. **Review Media**: User sees video and audio with actual durations
2. **Configure Options**: Click "Options" to customize merge settings
3. **Preview Result**: See calculated result duration in real-time
4. **Execute Merge**: Click "Merge" to start FFmpeg processing
5. **Monitor Progress**: Loading indicator shows processing status
6. **Review Result**: Preview merged video with metadata

### Smart Defaults
- **Duration Strategy**: "Shortest" (safest, no padding needed)
- **Audio Volume**: 1.0x (no change)
- **Fade Effects**: 0s (no fades)
- **Codecs**: "Copy" (fastest processing)

### Real-time Feedback
- Duration preview updates as options change
- Processing time estimation
- File size estimation
- Validation warnings for mismatched durations

## Error Handling

### Common Issues
- **Missing Media**: Clear error message if video or audio unavailable
- **Duration Mismatch**: Warning when durations differ significantly
- **Processing Failure**: Retry option with different settings
- **Codec Incompatibility**: Fallback to safe codec options

### User Guidance
- Tooltips explaining each option
- Duration comparison display
- Processing time estimates
- Quality vs. speed trade-offs

## Performance Considerations

### Optimization Strategies
- **Copy Codecs**: Use when possible for fastest processing
- **Batch Processing**: Queue multiple segments
- **Background Processing**: Non-blocking UI during merge
- **Progress Updates**: Real-time processing feedback

### Resource Management
- Processing time estimation
- Memory usage monitoring
- Temporary file cleanup
- Concurrent merge limits

## Future Enhancements

### Advanced Features
- **Custom FFmpeg Commands**: Power user mode
- **Batch Merge Options**: Apply same settings to all segments
- **Quality Presets**: Predefined option combinations
- **Advanced Audio Filters**: EQ, compression, noise reduction
- **Video Effects**: Color correction, scaling, cropping

### Integration Improvements
- **WebSocket Progress**: Real-time processing updates
- **Cloud Processing**: Offload heavy operations
- **Preview Generation**: Quick preview before full merge
- **Undo/Redo**: Revert merge operations

This merge functionality provides professional-grade video/audio combining capabilities while maintaining an intuitive user interface suitable for both beginners and advanced users.
