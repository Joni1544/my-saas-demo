-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'NEEDS_REASSIGNMENT';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "leaveReason" TEXT,
ADD COLUMN     "nextAvailableDate" TIMESTAMP(3);
