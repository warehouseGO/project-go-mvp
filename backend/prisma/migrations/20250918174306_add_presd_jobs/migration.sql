-- CreateTable
CREATE TABLE "presd_jobs" (
    "id" SERIAL NOT NULL,
    "job_description" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completed_date" TIMESTAMP(3),
    "priority" "DevicePriority" NOT NULL DEFAULT 'MEDIUM',
    "remarks" TEXT,
    "site_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presd_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "presd_jobs_site_id_idx" ON "presd_jobs"("site_id");

-- CreateIndex
CREATE INDEX "presd_jobs_status_idx" ON "presd_jobs"("status");

-- CreateIndex
CREATE INDEX "presd_jobs_priority_idx" ON "presd_jobs"("priority");

-- CreateIndex
CREATE INDEX "presd_jobs_created_by_idx" ON "presd_jobs"("created_by");

-- CreateIndex
CREATE INDEX "presd_jobs_updated_by_idx" ON "presd_jobs"("updated_by");

-- CreateIndex
CREATE INDEX "presd_jobs_site_id_status_idx" ON "presd_jobs"("site_id", "status");

-- CreateIndex
CREATE INDEX "presd_jobs_site_id_priority_idx" ON "presd_jobs"("site_id", "priority");

-- CreateIndex
CREATE INDEX "presd_jobs_status_completed_date_idx" ON "presd_jobs"("status", "completed_date");

-- AddForeignKey
ALTER TABLE "presd_jobs" ADD CONSTRAINT "presd_jobs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presd_jobs" ADD CONSTRAINT "presd_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presd_jobs" ADD CONSTRAINT "presd_jobs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
