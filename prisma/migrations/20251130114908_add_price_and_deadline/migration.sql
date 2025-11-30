/*
  Warnings:

  - The `interval` column on the `RecurringExpense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `price` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `category` on the `Expense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `RecurringExpense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RecurringInterval" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('GEHALT', 'MIETE', 'MARKETING', 'MATERIAL', 'VERSICHERUNG', 'STEUERN', 'SONSTIGES');

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL;

-- AlterTable
ALTER TABLE "RecurringExpense" DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL,
DROP COLUMN "interval",
ADD COLUMN     "interval" "RecurringInterval" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deadline" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "RecurringExpense_category_idx" ON "RecurringExpense"("category");
