# Merge All Segments Feature

## Overview

The "Merge All Segments" feature has been added to the Final Assembly stage, allowing users to batch merge video and audio for all segments with a single click, similar to the existing "Generate All" features in the video and image stages.

## Feature Details

### Location
- **Stage**: Final Assembly (final stage of the workflow)
- **Component**: `MergeAllSegmentsButton`
- **Position**: Appears at the top of the Final Assembly stage, before individual segment cards

### Functionality

#### Batch Processing
- Merges video and audio for all eligible segments in sequence
- Applies the same merge options to all segments
- Shows real-time progress during the batch operation
- Handles failures gracefully with detailed error reporting

#### Segment Eligibility
A segment is eligible for batch merging if:
- It has both selected video and audio files
- It hasn't been merged already (no `result_url` or local merged video)
- The video and audio files are accessible

#### Status Display
The component shows three status categories:
- **Ready to Merge**: Segments that can be processed
- **Already Merged**: Segments that have been merged previously
- **Missing Media**: Segments lacking video or audio files

### Merge Options

Users can configure the following FFmpeg options that apply to all segments:

#### Duration Strategy
- **Shortest** (default): Use the shorter of video or audio duration
- **Longest**: Use the longer of video or audio duration
- **Video**: Match the video duration exactly
- **Audio**: Match the audio duration exactly

#### Audio Settings
- **Volume**: 0.0x to 2.0x (default: 1.0x)
- **Fade In**: 0 to 5 seconds (default: 0s)
- **Fade Out**: 0 to 5 seconds (default: 0s)

#### Codec Settings
- **Video Codec**: Copy (fastest), H.264, or H.265
- **Audio Codec**: Copy (fastest), AAC, or MP3

### User Interface

#### Main Button
- **Enabled**: When segments are ready for merging
- **Disabled**: When no segments need merging
- **Loading State**: Shows "Merging All..." with spinner during processing

#### Progress Indicator
During batch processing, shows:
- Current segment being processed
- Progress bar with completion percentage
- Current/total segment count

#### Settings Panel
- Collapsible options panel
- Real-time preview of settings impact
- Consistent with individual segment merge options

### Error Handling

#### Individual Segment Failures
- Continues processing remaining segments if one fails
- Logs specific error messages for each failure
- Shows summary of successes and failures

#### Complete Failure
- Shows appropriate error message
- Allows user to retry the operation
- Preserves any successfully merged segments

### Integration

#### With Existing Workflow
- Follows the same pattern as `GenerateAllImagesButton` and `GenerateAllVideosButton`
- Maintains consistency with the overall UI/UX design
- Integrates seamlessly with the existing approval workflow

#### State Management
- Updates the `mergedVideos` Map in the parent component
- Triggers UI updates for individual segment cards
- Maintains sync with the project store

## Technical Implementation

### Component Structure
```
MergeAllSegmentsButton/
├── Status Summary (3 cards showing segment counts)
├── Missing Requirements Alert (if applicable)
├── Merge Settings Panel (collapsible)
├── Progress Indicator (during processing)
└── Action Button
```

### Key Functions

#### `handleMergeAll()`
- Main batch processing function
- Processes segments sequentially to avoid server overload
- Handles success/failure tracking and reporting

#### `getSelectedVideo()` / `getSelectedAudio()`
- Helper functions to find the selected media for each segment
- Consistent with individual segment merge logic

#### `hasSegmentResult()`
- Determines if a segment has already been merged
- Checks both database `result_url` and local `mergedVideos` Map

### API Integration
- Uses the same `/api/merge/video-audio` endpoint as individual merges
- Sends segment ID for database updates
- Includes merge options in the request payload

## Benefits

### User Experience
- **Efficiency**: Merge all segments with one click instead of individual merging
- **Consistency**: Apply the same settings to all segments uniformly
- **Progress Visibility**: Clear feedback on batch operation progress
- **Error Recovery**: Graceful handling of partial failures

### Workflow Optimization
- **Time Saving**: Reduces manual clicking and waiting
- **Quality Control**: Ensures consistent merge settings across all segments
- **Batch Processing**: Optimal for projects with many segments

## Usage Instructions

### Basic Usage
1. Navigate to the Final Assembly stage
2. Ensure segments have both video and audio files
3. Click "Merge All Segments" button
4. Wait for batch processing to complete
5. Review merged results and approve segments

### Advanced Usage
1. Click "Show Options" to access merge settings
2. Configure duration strategy, audio volume, and fade effects
3. Select appropriate video and audio codecs
4. Click "Merge All Segments" to apply settings to all segments
5. Monitor progress and handle any failures individually

### Troubleshooting
- **Button Disabled**: Check that segments have both video and audio
- **Partial Failures**: Review error messages and retry failed segments individually
- **Settings Not Applied**: Ensure options are configured before clicking merge

## Future Enhancements

### Potential Improvements
- **Parallel Processing**: Process multiple segments simultaneously (with server capacity considerations)
- **Resume Capability**: Resume batch operations from where they left off
- **Custom Settings Per Segment**: Allow different merge options for different segments
- **Preview Mode**: Show estimated results before actual merging

### Integration Opportunities
- **Final Video Assembly**: Extend to include final video compilation
- **Export Options**: Add batch export functionality
- **Quality Presets**: Provide predefined merge option templates
