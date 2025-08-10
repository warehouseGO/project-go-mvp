-- CreateEnum
CREATE TYPE "DevicePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "priority" "DevicePriority" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "devices_priority_idx" ON "devices"("priority");
