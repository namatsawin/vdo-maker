# Type Compatibility Fixes

## Overview
This document outlines the type compatibility issues that were identified and resolved between the frontend and backend of the VDO Maker application.

## Issues Identified

### 1. Segment Type Mismatch
**Problem**: Frontend `VideoSegment` and backend `Segment` (Prisma model) had different structures:

**Frontend VideoSegment:**
```typescript
interface VideoSegment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
  duration: number; // Missing in backend
  approvalStatus: ApprovalStatus; // Different from backend status
  imageApprovalStatus?: ApprovalStatus; // Missing in backend
  videoApprovalStatus?: ApprovalStatus; // Missing in backend
  audioApprovalStatus?: ApprovalStatus; // Missing in backend
  createdAt: string;
  updatedAt: string;
}
```

**Backend Segment (Prisma):**
```typescript
model Segment {
  id: string;
  order: number;
  script: string;
  videoPrompt: string;
  status: string; // Generic status, not approval-specific
  // Missing individual approval statuses
  // Missing duration field
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### 2. Project Structure Differences
**Problem**: Frontend expected `currentStage` field and different status values.

### 3. Media Asset Structure
**Problem**: Frontend expected nested media assets with different structure than backend relations.

## Solutions Implemented

### 1. Created Shared Types Package
- **Location**: `/shared-types/index.ts`
- **Purpose**: Single source of truth for all types used by both frontend and backend
- **Key Types**:
  - `Project`
  - `VideoSegment`
  - `MediaAsset`
  - `ApprovalStatus`
  - `ProjectStatus`
  - `WorkflowStage`

### 2. Updated Prisma Schema
**Changes Made**:
```sql
-- Added currentStage field to Project
ALTER TABLE projects ADD COLUMN currentStage TEXT DEFAULT 'SCRIPT_GENERATION';

-- Added individual approval status fields to Segment
ALTER TABLE segments ADD COLUMN scriptApprovalStatus TEXT DEFAULT 'DRAFT';
ALTER TABLE segments ADD COLUMN imageApprovalStatus TEXT DEFAULT 'DRAFT';
ALTER TABLE segments ADD COLUMN videoApprovalStatus TEXT DEFAULT 'DRAFT';
ALTER TABLE segments ADD COLUMN audioApprovalStatus TEXT DEFAULT 'DRAFT';
ALTER TABLE segments ADD COLUMN finalApprovalStatus TEXT DEFAULT 'DRAFT';

-- Updated status field default values
UPDATE segments SET status = 'DRAFT' WHERE status = 'PENDING';
```

### 3. Created Type Mappers
**Location**: `/server/src/utils/typeMappers.ts`
**Purpose**: Convert Prisma models to frontend-compatible types

**Key Functions**:
- `mapProject()`: Converts Prisma Project to frontend Project
- `mapVideoSegment()`: Converts Prisma Segment to frontend VideoSegment
- `mapMediaAsset()`: Converts Prisma Image/Video/Audio to frontend MediaAsset
- `calculateCurrentStage()`: Determines project stage based on segment statuses
- `calculateProjectStatus()`: Determines project status based on segment statuses

### 4. Updated Controllers
**Changes**:
- All API responses now use mapped types
- Automatic calculation of `currentStage` and `status` fields
- Proper type annotations using shared types

### 5. Updated Frontend Services
**Changes**:
- Import types from shared types package
- Remove duplicate type definitions
- Use consistent type names

## Migration Applied

```bash
npx prisma migrate dev --name "add-approval-statuses-and-current-stage"
```

This migration:
- Added `currentStage` to Project table
- Added individual approval status fields to Segment table
- Updated existing data to use new status values

## Benefits

### 1. Type Safety
- Compile-time type checking between frontend and backend
- Prevents runtime errors due to type mismatches
- IntelliSense support for all shared types

### 2. Maintainability
- Single source of truth for types
- Changes to types automatically propagate to both frontend and backend
- Reduced code duplication

### 3. Developer Experience
- Clear type definitions
- Better error messages
- Consistent API contracts

### 4. Data Consistency
- Automatic calculation of derived fields (currentStage, status)
- Consistent approval workflow states
- Proper media asset relationships

## Usage Examples

### Backend Controller
```typescript
import { mapProject } from '../utils/typeMappers';
import { Project, UpdateProjectRequest } from '../types';

export const getProject = async (req: AuthenticatedRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id },
    include: {
      segments: {
        include: { images: true, videos: true, audios: true }
      }
    }
  });
  
  const mappedProject = mapProject(project);
  res.json({ success: true, data: { project: mappedProject } });
};
```

### Frontend Service
```typescript
import { Project, CreateProjectRequest } from '@/types';

async createProject(data: CreateProjectRequest): Promise<Project> {
  const response = await apiClient.post('/projects', data);
  return response.data.project; // Fully typed!
}
```

## Next Steps

### 1. Update Frontend Components
- Update components to use new type structure
- Handle new approval status fields
- Update UI to reflect new workflow stages

### 2. Add Validation
- Add runtime validation using shared types
- Implement proper error handling for type mismatches

### 3. Testing
- Add integration tests to verify type compatibility
- Test API responses match expected types
- Validate database migrations

### 4. Documentation
- Update API documentation with new types
- Create type reference documentation
- Add examples for common use cases

## Files Modified

### Created
- `/shared-types/index.ts` - Shared type definitions
- `/shared-types/package.json` - Package configuration
- `/server/src/utils/typeMappers.ts` - Type mapping utilities
- `/server/prisma/migrations/20250628170122_add_approval_statuses_and_current_stage/` - Database migration

### Modified
- `/server/prisma/schema.prisma` - Updated database schema
- `/server/src/types/index.ts` - Re-export shared types
- `/server/src/controllers/projectController.ts` - Use type mappers
- `/frontend/src/types/index.ts` - Re-export shared types
- `/frontend/src/services/projectService.ts` - Use shared types

## Verification

To verify the fixes are working:

1. **Build both projects**:
   ```bash
   cd frontend && npm run build
   cd ../server && npm run build
   ```

2. **Check TypeScript compilation**:
   - No type errors should occur
   - All imports should resolve correctly

3. **Test API endpoints**:
   - Create a project via API
   - Verify response structure matches frontend expectations
   - Test segment updates and status changes

4. **Database consistency**:
   - Check that calculated fields update correctly
   - Verify approval status workflow functions properly

The type compatibility issues have been resolved, providing a solid foundation for continued development with full type safety between frontend and backend.
