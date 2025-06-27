const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDevices = async (req, res) => {
  try {
    const { userId } = req.user;
    const where = { siteSupervisorId: parseInt(userId) };
    const devices = await prisma.device.findMany({
      where,
      include: {
        jobs: true,
      },
    });
    const subordinates = await prisma.user.findMany({
      where: { superiorId: parseInt(userId) },
    });
    res.json({ devices, subordinates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};

exports.createDevice = async (req, res) => {
  try {
    const {
      serialNumber,
      name,
      type,
      subtype,
      siteId,
      attributes,
      siteSupervisorId,
      assignedTo, // cluster supervisor
      jobs = [], // array of { name, status, comment }
    } = req.body;
    const { userId } = req.user; // Assume JWT payload includes userId

    const device = await prisma.device.create({
      data: {
        serialNumber,
        name,
        type,
        subtype,
        siteId: parseInt(siteId),
        createdBy: userId,
        attributes,
        siteSupervisorId: siteSupervisorId ? parseInt(siteSupervisorId) : null,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        jobs: {
          create: jobs.map((job) => ({
            name: job.name,
            status: job.status || "IN_PROGRESS",
            comment: job.comment || null,
          })),
        },
      },
      include: { jobs: true },
    });
    res.status(201).json(device);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create device" });
  }
};

exports.getDeviceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await prisma.device.findUnique({
      where: { id: parseInt(id) },
      include: { jobs: true },
    });
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      subtype,
      attributes,
      siteSupervisorId,
      assignedTo,
      jobs = [],
    } = req.body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update device fields
      const updatedDevice = await tx.device.update({
        where: { id: parseInt(id) },
        data: {
          name,
          type,
          subtype,
          attributes,
          siteSupervisorId: siteSupervisorId
            ? parseInt(siteSupervisorId)
            : undefined,
          assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
        },
      });

      // 2. Handle jobs
      // Fetch existing jobs
      const existingJobs = await tx.job.findMany({
        where: { deviceId: parseInt(id) },
      });
      const existingJobIds = existingJobs.map((j) => j.id);
      const sentJobIds = jobs.filter((j) => j.id).map((j) => j.id);

      // a. Delete jobs not present in the request
      const jobsToDelete = existingJobIds.filter(
        (jid) => !sentJobIds.includes(jid)
      );
      if (jobsToDelete.length > 0) {
        await tx.job.deleteMany({ where: { id: { in: jobsToDelete } } });
      }

      // b. Update or create jobs
      for (const job of jobs) {
        if (job.id) {
          // Update existing job
          await tx.job.update({
            where: { id: job.id },
            data: {
              name: job.name,
              status: job.status,
              comment: job.comment || null,
            },
          });
        } else {
          // Create new job
          await tx.job.create({
            data: {
              deviceId: parseInt(id),
              name: job.name,
              status: job.status || "IN_PROGRESS",
              comment: job.comment || null,
            },
          });
        }
      }

      // Return updated device with jobs
      return tx.device.findUnique({
        where: { id: parseInt(id) },
        include: { jobs: true },
      });
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update device and jobs" });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      // Delete jobs first (for safety, even though cascade is set)
      await tx.job.deleteMany({ where: { deviceId: parseInt(id) } });
      // Delete device
      await tx.device.delete({ where: { id: parseInt(id) } });
    });
    res.json({ message: "Device and its jobs deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete device" });
  }
};

exports.assignDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const device = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { assignedTo: parseInt(assignedTo) },
    });
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign device" });
  }
};

// Bulk assign devices to a site supervisor
exports.assignDevicesToSiteSupervisor = async (req, res) => {
  try {
    const { deviceIds, siteSupervisorId } = req.body;

    // deviceIds: array of device ids
    const updated = await prisma.device.updateMany({
      where: { id: { in: deviceIds.map((id) => parseInt(id)) } },
      data: { siteSupervisorId: parseInt(siteSupervisorId) },
    });
    res.json({ message: "Devices assigned", count: updated.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign devices" });
  }
};

// Bulk assign devices to a cluster supervisor
exports.assignDevicesToClusterSupervisor = async (req, res) => {
  try {
    const { deviceIds, clusterSupervisorId } = req.body; // deviceIds: array of device ids
    const updated = await prisma.device.updateMany({
      where: { id: { in: deviceIds.map((id) => parseInt(id)) } },
      data: { assignedTo: parseInt(clusterSupervisorId) },
    });
    res.json({ message: "Devices assigned", count: updated.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign devices" });
  }
};

// Add jobs to a device
exports.addJobsToDevice = async (req, res) => {
  try {
    const { id } = req.params; // device id
    const { jobs } = req.body; // array of { name, status, comment }
    const createdJobs = await prisma.job.createMany({
      data: jobs.map((job) => ({
        deviceId: parseInt(id),
        name: job.name,
        status: job.status || "IN_PROGRESS",
        comment: job.comment || null,
      })),
    });
    res.json({ message: "Jobs added", count: createdJobs.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add jobs" });
  }
};

// Update a job for a device
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { name, status, comment } = req.body;
    const job = await prisma.job.update({
      where: { id: parseInt(jobId) },
      data: { name, status, comment },
    });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update job" });
  }
};

// Delete a job from a device
exports.deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    await prisma.job.delete({ where: { id: parseInt(jobId) } });
    res.json({ message: "Job deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete job" });
  }
};
