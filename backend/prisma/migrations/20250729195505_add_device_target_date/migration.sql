-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "target_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "devices_target_date_idx" ON "devices"("target_date");
