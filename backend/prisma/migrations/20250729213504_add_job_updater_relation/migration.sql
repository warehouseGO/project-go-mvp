-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
