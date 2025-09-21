-- Add device_type column with default value first
ALTER TABLE "jobs" ADD COLUMN "device_type" TEXT;

-- Update device_type from the associated device
UPDATE "jobs" 
SET "device_type" = (
  SELECT "type" 
  FROM "devices" 
  WHERE "devices"."id" = "jobs"."device_id"
);

-- Make device_type NOT NULL after populating it
ALTER TABLE "jobs" ALTER COLUMN "device_type" SET NOT NULL;

-- CreateIndex
CREATE INDEX "jobs_device_type_idx" ON "jobs"("device_type");

-- CreateIndex
CREATE INDEX "jobs_device_type_status_idx" ON "jobs"("device_type", "status");
