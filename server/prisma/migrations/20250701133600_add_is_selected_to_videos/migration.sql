-- AlterTable
-- Add isSelected field to videos table to enable video selection on frontend
ALTER TABLE "videos" ADD COLUMN "isSelected" BOOLEAN NOT NULL DEFAULT false;
