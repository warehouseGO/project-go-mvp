-- CreateIndex
CREATE INDEX "devices_created_by_idx" ON "devices"("created_by");

-- CreateIndex
CREATE INDEX "devices_site_id_priority_idx" ON "devices"("site_id", "priority");

-- CreateIndex
CREATE INDEX "devices_site_id_site_supervisor_id_idx" ON "devices"("site_id", "site_supervisor_id");

-- CreateIndex
CREATE INDEX "jobs_device_id_idx" ON "jobs"("device_id");

-- CreateIndex
CREATE INDEX "jobs_updated_by_idx" ON "jobs"("updated_by");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_device_id_status_idx" ON "jobs"("device_id", "status");

-- CreateIndex
CREATE INDEX "jobs_status_updated_at_idx" ON "jobs"("status", "updated_at");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_site_id_idx" ON "users"("site_id");

-- CreateIndex
CREATE INDEX "users_superior_id_idx" ON "users"("superior_id");

-- CreateIndex
CREATE INDEX "users_role_site_id_idx" ON "users"("role", "site_id");

-- CreateIndex
CREATE INDEX "users_status_superior_id_idx" ON "users"("status", "superior_id");
