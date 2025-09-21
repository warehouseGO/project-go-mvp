-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_site_id_status_idx" ON "devices"("site_id", "status");

-- Create function to calculate device status based on job statuses
CREATE OR REPLACE FUNCTION update_device_status()
RETURNS TRIGGER AS $$
DECLARE
    target_device_id INTEGER;
    job_count INTEGER;
    completed_jobs INTEGER;
    pending_jobs INTEGER;
    in_progress_jobs INTEGER;
    constraint_jobs INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Get the device ID from the updated job
    target_device_id := COALESCE(NEW.device_id, OLD.device_id);
    
    -- Count jobs by status for this device
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END),
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END),
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END),
        COUNT(CASE WHEN status = 'CONSTRAINT' THEN 1 END)
    INTO job_count, completed_jobs, pending_jobs, in_progress_jobs, constraint_jobs
    FROM jobs 
    WHERE device_id = target_device_id;
    
    -- Determine device status based on job statuses
    -- COMPLETED: All jobs are completed
    -- CONSTRAINT: At least one job has constraint status
    -- IN_PROGRESS: At least one job is in progress and no constraints
    -- PENDING: All jobs are pending or no jobs
    IF job_count = 0 THEN
        new_status := 'PENDING';
    ELSIF constraint_jobs > 0 THEN
        new_status := 'CONSTRAINT';
    ELSIF completed_jobs = job_count THEN
        new_status := 'COMPLETED';
    ELSIF in_progress_jobs > 0 THEN
        new_status := 'IN_PROGRESS';
    ELSE
        new_status := 'PENDING';
    END IF;
    
    -- Update the device status
    UPDATE devices 
    SET status = new_status::device_status
    WHERE id = target_device_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on jobs table
CREATE TRIGGER trigger_update_device_status
    AFTER INSERT OR UPDATE OR DELETE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_device_status();
