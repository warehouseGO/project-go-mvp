-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "site_supervisor_id" INTEGER;

-- CreateIndex
CREATE INDEX "devices_site_id_idx" ON "devices"("site_id");

-- CreateIndex
CREATE INDEX "devices_site_supervisor_id_idx" ON "devices"("site_supervisor_id");

-- CreateIndex
CREATE INDEX "devices_assigned_to_idx" ON "devices"("assigned_to");

-- CreateIndex
CREATE INDEX "devices_serial_number_idx" ON "devices"("serial_number");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_site_supervisor_id_fkey" FOREIGN KEY ("site_supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
