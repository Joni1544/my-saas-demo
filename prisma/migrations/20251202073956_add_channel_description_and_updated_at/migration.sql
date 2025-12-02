/*
  Warnings:

  - Added the required column `updatedAt` to the `ChatChannel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatChannel" ADD COLUMN     "description" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to set updatedAt to createdAt
UPDATE "ChatChannel" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
