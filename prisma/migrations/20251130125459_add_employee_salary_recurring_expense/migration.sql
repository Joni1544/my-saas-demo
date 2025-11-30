-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "payoutDay" DROP NOT NULL,
ALTER COLUMN "payoutDay" DROP DEFAULT,
ALTER COLUMN "salary" DROP NOT NULL,
ALTER COLUMN "salary" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RecurringExpense" ADD COLUMN     "dayOfMonth" INTEGER,
ADD COLUMN     "employeeId" TEXT;

-- CreateIndex
CREATE INDEX "RecurringExpense_employeeId_idx" ON "RecurringExpense"("employeeId");

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
