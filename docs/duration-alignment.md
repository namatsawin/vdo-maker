# Duration Alignment in Final Assembly

## Overview

The Final Assembly component displays duration information that is aligned with the actual media assets, not with API response durations that were chosen during video creation.

## Duration Sources

### ✅ Correct: Asset Duration
- **Source**: `MediaAsset.duration` property
- **Usage**: `selectedVideo.duration` and `selectedAudio.duration`
- **Description**: The actual duration of the media file as determined by the media processing system
- **Accuracy**: Reflects the true length of the video/audio content

### ❌ Avoided: API Response Duration
- **Source**: `VideoSegment.duration` property (API response)
- **Description**: Duration option chosen during video creation request
- **Issue**: May not match the actual generated media file duration
- **Why Avoided**: This is just a preference/option, not the actual media duration

## Implementation

```typescript
// ✅ Correct - Using actual asset duration
{formatDuration(selectedVideo.duration || 0)}
{formatDuration(selectedAudio.duration || 0)}

// ❌ Incorrect - Would use API response duration
{formatDuration(segment.duration || 0)}
```

## Display Locations

The asset-aligned duration is displayed in:

1. **Video Section Header**: Shows actual video file duration
2. **Video Details**: Shows "Duration: X:XX" from video asset
3. **Audio Section Header**: Shows actual audio file duration  
4. **Audio Details**: Shows "Duration: X:XX" from audio asset

## Benefits

- **Accuracy**: Users see the true duration of their media files
- **Consistency**: Duration matches what they would see in media players
- **Reliability**: Not dependent on API request parameters
- **Debugging**: Helps identify duration mismatches between request and result

## Example

```
API Request: duration: 30 (seconds requested)
Actual Video: duration: 28.5 (seconds in generated file)
Display: 0:28 ← Shows actual asset duration, not requested duration
```

This ensures users have accurate information about their actual media assets rather than their original requests.
