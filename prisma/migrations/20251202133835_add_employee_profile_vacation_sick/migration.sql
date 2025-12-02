-- AlterTable
ALTER TABLE "ChatChannel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "breakEnd" TEXT,
ADD COLUMN     "breakStart" TEXT,
ADD COLUMN     "daysOff" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isSick" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "sickDays" INTEGER DEFAULT 0,
ADD COLUMN     "vacationDaysTotal" INTEGER DEFAULT 25,
ADD COLUMN     "vacationDaysUsed" INTEGER DEFAULT 0,
ADD COLUMN     "workEnd" TEXT,
ADD COLUMN     "workStart" TEXT;

-- CreateTable
CREATE TABLE "VacationRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VacationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VacationRequest_employeeId_idx" ON "VacationRequest"("employeeId");

-- CreateIndex
CREATE INDEX "VacationRequest_status_idx" ON "VacationRequest"("status");

-- CreateIndex
CREATE INDEX "VacationRequest_startDate_idx" ON "VacationRequest"("startDate");

-- CreateIndex
CREATE INDEX "VacationRequest_endDate_idx" ON "VacationRequest"("endDate");

-- CreateIndex
CREATE INDEX "Employee_isSick_idx" ON "Employee"("isSick");

-- AddForeignKey
ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
