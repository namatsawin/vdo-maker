# Status System Migration Guide

## Overview
This guide shows how to migrate from the current PENDING/DRAFT system to the improved 5-state system for better user experience and clearer workflow logic.

## Migration Strategy

### Phase 1: Add New System (Backward Compatible)
Keep both systems running simultaneously to ensure no breaking changes.

### Phase 2: Gradual Migration
Update components one by one to use the new system.

### Phase 3: Complete Migration
Remove old system once all components are updated.

## Code Examples

### Before: Current System
```typescript
// Old way - ambiguous status usage
const segment = {
  scriptApprovalStatus: 'PENDING', // Could mean queued OR processing
  imageApprovalStatus: 'DRAFT',    // Could mean not started OR editing
  // ...
};

// Unclear status checks
if (segment.scriptApprovalStatus === 'PENDING') {
  // Is it queued or actively processing? 🤔
  showSpinner();
}
```

### After: Improved System
```typescript
import { ApprovalStatus, useAIGenerationStatus } from '@/types/approvalStatus';

// Clear, semantic status usage
const segment = {
  scriptApprovalStatus: ApprovalStatus.SUBMITTED,  // Clearly queued
  imageApprovalStatus: ApprovalStatus.PROCESSING,  // Clearly processing
  // ...
};

// Clear status checks with helper functions
if (isProcessing(segment.scriptApprovalStatus)) {
  showSpinner(); // Clear when to show spinner
}

if (needsUserAction(segment.imageApprovalStatus)) {
  enableEditButton(); // Clear when user can act
}
```

## Component Migration Examples

### 1. Script Generation Component

#### Before:
```typescript
const ScriptSegment = ({ segment }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    // No clear status transitions
    try {
      const result = await generateScript();
      // Status update unclear
    } catch (error) {
      // Error handling unclear
    }
    setIsGenerating(false);
  };

  return (
    <div>
      {segment.scriptApprovalStatus === 'PENDING' && <Spinner />}
      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
};
```

#### After:
```typescript
import { useAIGenerationStatus } from '@/hooks/useStatusManager';
import { StatusBadge, StatusActionButtons } from '@/components/ui/StatusBadge';

const ScriptSegment = ({ segment, onUpdate }) => {
  const { status, generate, retry, cancel, isGenerating, error } = useAIGenerationStatus(
    segment.id,
    'script',
    () => generateScript(segment.script)
  );

  return (
    <div>
      <StatusBadge status={status} />
      
      <StatusActionButtons
        status={status}
        onSubmit={generate}
        onRetry={retry}
        onCancel={cancel}
        disabled={isGenerating}
      />
      
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
};
```

### 2. Workflow Progress Component

#### Before:
```typescript
const WorkflowProgress = ({ segments }) => {
  const getOverallStatus = (segment) => {
    // Complex, unclear logic
    if (segment.scriptApprovalStatus === 'PENDING' || 
        segment.imageApprovalStatus === 'PENDING') {
      return 'pending';
    }
    // More unclear logic...
  };

  return (
    <div>
      {segments.map(segment => (
        <div key={segment.id}>
          Status: {getOverallStatus(segment)}
        </div>
      ))}
    </div>
  );
};
```

#### After:
```typescript
import { getOverallSegmentStatus } from '@/types/approvalStatus';
import { StatusProgress } from '@/components/ui/StatusBadge';

const WorkflowProgress = ({ segments }) => {
  return (
    <div>
      {segments.map(segment => {
        const statuses = [
          { label: 'Script', status: segment.scriptApprovalStatus },
          { label: 'Images', status: segment.imageApprovalStatus },
          { label: 'Video', status: segment.videoApprovalStatus },
          { label: 'Audio', status: segment.audioApprovalStatus },
          { label: 'Final', status: segment.finalApprovalStatus },
        ];

        return (
          <div key={segment.id}>
            <h3>Segment {segment.order}</h3>
            <StatusProgress statuses={statuses} />
          </div>
        );
      })}
    </div>
  );
};
```

## Database Migration

### 1. Add New Status Column (Optional)
```sql
-- Add new column with default value
ALTER TABLE video_segments 
ADD COLUMN script_approval_status_v2 VARCHAR(20) DEFAULT 'DRAFT';

-- Migrate existing data
UPDATE video_segments 
SET script_approval_status_v2 = CASE 
  WHEN script_approval_status = 'PENDING' THEN 'PROCESSING'
  WHEN script_approval_status = 'DRAFT' THEN 'DRAFT'
  WHEN script_approval_status = 'APPROVED' THEN 'APPROVED'
  WHEN script_approval_status = 'REJECTED' THEN 'REJECTED'
  ELSE 'DRAFT'
END;
```

### 2. Update Application Code
```typescript
// Update type definitions
interface VideoSegment {
  // Keep old fields for backward compatibility
  scriptApprovalStatus: string; // Legacy
  
  // Add new fields
  scriptApprovalStatusV2: ApprovalStatus; // New system
}
```

### 3. Remove Old System
```sql
-- After migration is complete
ALTER TABLE video_segments DROP COLUMN script_approval_status;
ALTER TABLE video_segments RENAME COLUMN script_approval_status_v2 TO script_approval_status;
```

## Testing Migration

### 1. Unit Tests
```typescript
describe('Status Migration', () => {
  test('should migrate PENDING to PROCESSING', () => {
    const oldStatus = 'PENDING';
    const newStatus = migrateStatus(oldStatus);
    expect(newStatus).toBe(ApprovalStatus.PROCESSING);
  });

  test('should handle status transitions', () => {
    const { result } = renderHook(() => useFieldStatus(ApprovalStatus.DRAFT, 'seg1', 'script'));
    
    act(() => {
      result.current.submit();
    });
    
    expect(result.current.status).toBe(ApprovalStatus.SUBMITTED);
  });
});
```

### 2. Integration Tests
```typescript
describe('Workflow Integration', () => {
  test('should complete full generation workflow', async () => {
    const { getByText, queryByText } = render(<ScriptSegment segment={mockSegment} />);
    
    // Start in DRAFT
    expect(getByText('Draft')).toBeInTheDocument();
    
    // Click generate
    fireEvent.click(getByText('Generate'));
    expect(getByText('Queued')).toBeInTheDocument();
    
    // Should show processing
    await waitFor(() => {
      expect(getByText('Generating')).toBeInTheDocument();
    });
    
    // Should complete
    await waitFor(() => {
      expect(getByText('Approved')).toBeInTheDocument();
    });
  });
});
```

## Rollback Plan

### If Issues Arise
1. **Feature Flag**: Use feature flag to switch between systems
2. **Database Rollback**: Keep old columns until migration is stable
3. **Component Rollback**: Revert to old components if needed

```typescript
// Feature flag approach
const useNewStatusSystem = useFeatureFlag('new-status-system');

const StatusComponent = ({ segment }) => {
  if (useNewStatusSystem) {
    return <NewStatusBadge status={segment.scriptApprovalStatusV2} />;
  } else {
    return <OldStatusDisplay status={segment.scriptApprovalStatus} />;
  }
};
```

## Benefits After Migration

### For Users
- ✅ Clear understanding of what's happening
- ✅ Know when they can take action
- ✅ Better visual feedback
- ✅ Reduced confusion

### For Developers
- ✅ Clearer code logic
- ✅ Better debugging capabilities
- ✅ Consistent status handling
- ✅ Easier to add new features

### For Product
- ✅ Better user experience
- ✅ Reduced support requests
- ✅ More reliable workflows
- ✅ Better analytics and monitoring

## Timeline

### Week 1: Preparation
- [ ] Create new status types and utilities
- [ ] Add new components (StatusBadge, etc.)
- [ ] Write migration utilities
- [ ] Set up feature flags

### Week 2: Backend Migration
- [ ] Add new database columns
- [ ] Update API endpoints
- [ ] Migrate existing data
- [ ] Add status transition validation

### Week 3: Frontend Migration
- [ ] Update core components one by one
- [ ] Test each component thoroughly
- [ ] Update status checks throughout app
- [ ] Add new status management hooks

### Week 4: Testing & Cleanup
- [ ] Comprehensive testing
- [ ] Performance testing
- [ ] Remove old system
- [ ] Update documentation

## Monitoring & Metrics

### Track Migration Success
- Status transition error rates
- User confusion metrics (support tickets)
- Workflow completion rates
- Performance impact

### Key Metrics to Watch
- Time to complete video generation
- User satisfaction scores
- Error rates in status transitions
- Support ticket volume

This migration will significantly improve the user experience and make the codebase more maintainable!
