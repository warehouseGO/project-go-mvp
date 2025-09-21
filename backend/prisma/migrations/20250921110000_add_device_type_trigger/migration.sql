-- Create function to automatically set device_type when job is created or updated
CREATE OR REPLACE FUNCTION set_job_device_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the device type from the associated device
    SELECT type INTO NEW.device_type
    FROM devices 
    WHERE id = NEW.device_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER set_job_device_type_on_insert
    BEFORE INSERT ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_job_device_type();

-- Create trigger for UPDATE operations (when device_id changes)
CREATE TRIGGER set_job_device_type_on_update
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    WHEN (OLD.device_id IS DISTINCT FROM NEW.device_id)
    EXECUTE FUNCTION set_job_device_type();
