-- CreateIndex
CREATE INDEX "devices_site_id_type_idx" ON "devices"("site_id", "type");

-- CreateIndex
CREATE INDEX "devices_type_idx" ON "devices"("type");
