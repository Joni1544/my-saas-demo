-- AlterTable
ALTER TABLE "VacationRequest" ADD COLUMN     "leaveReason" TEXT NOT NULL DEFAULT 'Urlaub';

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyReport_tenantId_idx" ON "DailyReport"("tenantId");

-- CreateIndex
CREATE INDEX "DailyReport_reportDate_idx" ON "DailyReport"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_tenantId_reportDate_key" ON "DailyReport"("tenantId", "reportDate");

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
