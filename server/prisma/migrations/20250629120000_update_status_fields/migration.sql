-- Remove status field from images table
ALTER TABLE "images" DROP COLUMN "status";

-- Remove status field from videos table
ALTER TABLE "videos" DROP COLUMN "status";

-- Remove status field from audios table
ALTER TABLE "audios" DROP COLUMN "status";

-- Update project status values - convert IN_PROGRESS and FAILED to DRAFT
UPDATE "projects" SET "status" = 'DRAFT' WHERE "status" IN ('IN_PROGRESS', 'FAILED');

-- Update segment status values - convert PENDING to DRAFT
UPDATE "segments" SET "status" = 'DRAFT' WHERE "status" = 'PENDING';
UPDATE "segments" SET "scriptApprovalStatus" = 'DRAFT' WHERE "scriptApprovalStatus" = 'PENDING';
UPDATE "segments" SET "imageApprovalStatus" = 'DRAFT' WHERE "imageApprovalStatus" = 'PENDING';
UPDATE "segments" SET "videoApprovalStatus" = 'DRAFT' WHERE "videoApprovalStatus" = 'PENDING';
UPDATE "segments" SET "audioApprovalStatus" = 'DRAFT' WHERE "audioApprovalStatus" = 'PENDING';
UPDATE "segments" SET "finalApprovalStatus" = 'DRAFT' WHERE "finalApprovalStatus" = 'PENDING';
