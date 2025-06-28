# Prisma Nested Update Error Fix

## Problem Description

### Error Encountered
```
Argument `segments`: Invalid value provided. Expected SegmentUpdateManyWithoutProjectNestedInput or SegmentUncheckedUpdateManyWithoutProjectNestedInput, provided (Object, Object, Object).
```

### Root Cause
The frontend was sending complete segment objects as part of project update requests, but Prisma expects specific nested input formats for related data updates. When updating a project with segments, Prisma requires either:

1. **Nested Write Operations**: Using `create`, `update`, `upsert`, `delete`, etc.
2. **Separate Updates**: Updating the project and segments independently

### Why This Happened
- Frontend `updateProject` accepts `Partial<Project>` which includes segments
- Backend was trying to spread all update data directly into Prisma update
- Prisma schema expects specific input types for nested relations
- Direct object assignment violates Prisma's type safety

## Solution Implemented

### 1. Enhanced Project Update Controller

#### Before (Problematic):
```typescript
const project = await prisma.project.update({
  where: { id },
  data: {
    ...updates, // This included segments, causing the error
    updatedAt: new Date()
  }
});
```

#### After (Fixed):
```typescript
// Separate project fields from segments
const { segments, ...projectUpdates } = updates;

// Filter allowed project fields only
const allowedProjectFields = ['title', 'description', 'status', 'currentStage'];
const filteredProjectUpdates = Object.keys(projectUpdates)
  .filter(key => allowedProjectFields.includes(key))
  .reduce((obj, key) => {
    obj[key] = projectUpdates[key];
    return obj;
  }, {} as any);

// Update project fields only
const project = await prisma.project.update({
  where: { id },
  data: {
    ...filteredProjectUpdates,
    updatedAt: new Date()
  }
});

// Handle segments separately if provided
if (segments && Array.isArray(segments)) {
  for (const segmentUpdate of segments) {
    if (segmentUpdate.id) {
      await prisma.segment.update({
        where: { id: segmentUpdate.id },
        data: { ...filteredSegmentData }
      });
    }
  }
}
```

### 2. Dedicated Segment Update Endpoint

Added a new endpoint for updating individual segments:

```typescript
// PUT /projects/:projectId/segments/:segmentId
export const updateSegment = async (req: AuthenticatedRequest, res: Response) => {
  // Verify project ownership
  // Update specific segment
  // Return updated segment
};
```

### 3. Field Filtering and Validation

#### Project Fields (Allowed):
- `title`
- `description` 
- `status`
- `currentStage`

#### Segment Fields (Allowed):
- `script`
- `videoPrompt`
- `status`
- `scriptApprovalStatus`
- `imageApprovalStatus`
- `videoApprovalStatus`
- `audioApprovalStatus`
- `finalApprovalStatus`
- `order`

## API Structure

### Project Updates
```http
PUT /api/v1/projects/:id
Content-Type: application/json

{
  "title": "Updated Project Title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "currentStage": "VIDEO_GENERATION"
}
```

### Segment Updates
```http
PUT /api/v1/projects/:projectId/segments/:segmentId
Content-Type: application/json

{
  "script": "Updated script content",
  "scriptApprovalStatus": "APPROVED",
  "videoPrompt": "Updated video prompt"
}
```

## Frontend Integration

### Project Service Enhancement
```typescript
class ProjectService {
  // Update project (fields only)
  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.project;
  }

  // Update individual segment
  async updateSegment(projectId: string, segmentId: string, data: UpdateSegmentRequest): Promise<VideoSegment> {
    const response = await apiClient.put(`/projects/${projectId}/segments/${segmentId}`, data);
    return response.data.segment;
  }
}
```

### Usage Examples

#### Update Project Metadata:
```typescript
await projectService.updateProject(projectId, {
  title: "New Title",
  status: "IN_PROGRESS"
});
```

#### Update Segment Content:
```typescript
await projectService.updateSegment(projectId, segmentId, {
  script: "Updated script",
  scriptApprovalStatus: "APPROVED"
});
```

## Benefits of This Approach

### 1. **Type Safety**
- Proper Prisma input types
- No more nested update errors
- Clear separation of concerns

### 2. **Better API Design**
- RESTful endpoints
- Specific operations for specific resources
- Easier to understand and maintain

### 3. **Performance**
- Only update what's needed
- Reduced payload sizes
- Better database query optimization

### 4. **Security**
- Field filtering prevents unwanted updates
- Proper ownership validation
- Clear audit trail

## Error Handling

### Validation Errors
```typescript
// Invalid project field
{
  "success": false,
  "error": {
    "message": "Invalid field: invalidField"
  }
}
```

### Authorization Errors
```typescript
// Project not found or not owned by user
{
  "success": false,
  "error": {
    "message": "Project not found"
  }
}
```

### Prisma Errors
```typescript
// Database constraint violations
{
  "success": false,
  "error": {
    "message": "Failed to update project"
  }
}
```

## Testing

### Unit Tests
```typescript
describe('Project Updates', () => {
  test('should update project fields only', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${projectId}`)
      .send({
        title: 'New Title',
        segments: [/* should be ignored */]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.project.title).toBe('New Title');
  });

  test('should update segment separately', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${projectId}/segments/${segmentId}`)
      .send({
        script: 'Updated script'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.segment.script).toBe('Updated script');
  });
});
```

### Integration Tests
```typescript
describe('Full Workflow', () => {
  test('should update project and segments independently', async () => {
    // Update project
    await projectService.updateProject(projectId, {
      title: 'New Title'
    });

    // Update segments
    for (const segment of segments) {
      await projectService.updateSegment(projectId, segment.id, {
        scriptApprovalStatus: 'APPROVED'
      });
    }

    // Verify updates
    const project = await projectService.getProject(projectId);
    expect(project.title).toBe('New Title');
    expect(project.segments[0].scriptApprovalStatus).toBe('APPROVED');
  });
});
```

## Migration Guide

### For Existing Code

#### Before:
```typescript
// This would cause Prisma errors
await updateProject(projectId, {
  title: 'New Title',
  segments: [
    { id: 'seg1', script: 'Updated script' }
  ]
});
```

#### After:
```typescript
// Update project fields
await updateProject(projectId, {
  title: 'New Title'
});

// Update segments separately
await updateSegment(projectId, 'seg1', {
  script: 'Updated script'
});
```

### Batch Updates
For updating multiple segments:
```typescript
const updateSegments = async (projectId: string, segmentUpdates: Array<{id: string, data: UpdateSegmentRequest}>) => {
  const promises = segmentUpdates.map(({ id, data }) => 
    projectService.updateSegment(projectId, id, data)
  );
  
  return Promise.all(promises);
};
```

## Monitoring and Debugging

### Logging
- All update operations are logged with user ID and timestamp
- Error details are captured for debugging
- Performance metrics for update operations

### Metrics to Track
- Update success/failure rates
- Average update response times
- Most frequently updated fields
- Error patterns and frequencies

This fix ensures robust, type-safe updates while maintaining good API design principles and preventing Prisma-related errors.
