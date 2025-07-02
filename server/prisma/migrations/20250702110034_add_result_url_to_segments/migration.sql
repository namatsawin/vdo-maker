/*
  Warnings:

  - You are about to drop the column `isSelected` on the `videos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "segments" ADD COLUMN     "result_url" TEXT;

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "isSelected";
