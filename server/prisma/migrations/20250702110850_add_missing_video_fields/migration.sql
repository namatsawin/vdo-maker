-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';
