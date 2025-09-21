const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDevices = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      page = 1,
      limit = 20,
      search = "",
      type = "",
      priority = "",
      status = "",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = { siteSupervisorId: parseInt(userId) };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) where.type = type;
    if (priority) where.priority = priority;

    // Add job status filtering if needed
    if (status) {
      where.jobs = {
        some: { status: status },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.device.count({ where });

    // Get devices with pagination
    const devices = await prisma.device.findMany({
      where,
      include: {
        jobs: {
          select: {
            id: true,
            name: true,
            status: true,
            comment: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limitNum,
    });

    // Get subordinates (this could also be paginated if needed)
    const subordinates = await prisma.user.findMany({
      where: { superiorId: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      devices,
      subordinates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
    });
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
      siteId,
      attributes,
      siteSupervisorId,
      assignedTo, // cluster supervisor
      priority = "MEDIUM", // default priority
      targetDate, // target completion date
      jobs = [], // array of { name, status, comment }
    } = req.body;
    const { userId } = req.user; // Assume JWT payload includes userId

    const device = await prisma.device.create({
      data: {
        serialNumber,
        name,
        type,
        siteId: parseInt(siteId),
        createdBy: userId,
        attributes,
        priority,
        targetDate: targetDate ? new Date(targetDate) : null,
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
      attributes,
      siteSupervisorId,
      assignedTo,
      priority,
      targetDate,
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
          attributes,
          priority,
          targetDate: targetDate ? new Date(targetDate) : null,
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

// Bulk create devices from Excel import
exports.bulkCreateDevices = async (req, res) => {
  try {
    const { devices, siteId } = req.body;
    const { userId } = req.user;

    if (!devices || !Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ error: "Devices array is required" });
    }

    // Verify user has permission to create devices for this site
    // const site = await prisma.site.findFirst({
    //   where: {
    //     id: parseInt(siteId),
    //     siteInChargeId: parseInt(userId),
    //   },
    // });

    // if (!site) {
    //   return res
    //     .status(403)
    //     .json({ error: "Not authorized to create devices for this site" });
    // }

    // Validate devices data
    const validationErrors = [];
    devices.forEach((device, index) => {
      if (!device.serialNumber) {
        validationErrors.push(`Device ${index + 1}: Serial number is required`);
      }
      if (!device.name) {
        validationErrors.push(`Device ${index + 1}: Name is required`);
      }
      if (!device.type) {
        validationErrors.push(`Device ${index + 1}: Type is required`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Check for duplicate serial numbers
    const serialNumbers = devices.map((d) => d.serialNumber);
    const existingDevices = await prisma.device.findMany({
      where: {
        serialNumber: { in: serialNumbers },
      },
      select: { serialNumber: true },
    });

    const existingSerials = existingDevices.map((d) => d.serialNumber);
    const duplicates = serialNumbers.filter((sn) =>
      existingSerials.includes(sn)
    );

    if (duplicates.length > 0) {
      return res.status(400).json({
        error: "Duplicate serial numbers found",
        duplicates,
      });
    }

    // Optimized bulk creation with batch operations
    const createdDevices = await prisma.$transaction(async (tx) => {
      // Prepare all device data for batch creation
      const deviceDataArray = devices.map((deviceData) => ({
        serialNumber: deviceData.serialNumber,
        name: deviceData.name,
        type: deviceData.type,
        priority: deviceData.priority || "MEDIUM",
        targetDate: deviceData.targetDate
          ? new Date(deviceData.targetDate)
          : null,
        siteId: parseInt(siteId),
        siteSupervisorId: deviceData.siteSupervisorId
          ? parseInt(deviceData.siteSupervisorId)
          : null,
        assignedTo: deviceData.assignedTo
          ? parseInt(deviceData.assignedTo)
          : null,
        attributes: deviceData.attributes || {},
        createdBy: parseInt(userId),
      }));

      // Batch create all devices
      await tx.device.createMany({
        data: deviceDataArray,
        skipDuplicates: true, // Skip duplicates instead of failing
      });

      // Get the created devices with their IDs
      const devicesWithIds = await tx.device.findMany({
        where: {
          siteId: parseInt(siteId),
          serialNumber: { in: devices.map((d) => d.serialNumber) },
        },
        select: { id: true, serialNumber: true },
      });

      // Create a map for quick lookup
      const deviceMap = new Map(
        devicesWithIds.map((d) => [d.serialNumber, d.id])
      );

      // Prepare all job data for batch creation
      const jobDataArray = [];
      devices.forEach((deviceData) => {
        if (deviceData.jobs && Array.isArray(deviceData.jobs)) {
          const deviceId = deviceMap.get(deviceData.serialNumber);
          if (deviceId) {
            deviceData.jobs.forEach((jobData) => {
              jobDataArray.push({
                name: jobData.name,
                status: "IN_PROGRESS",
                deviceId: deviceId,
              });
            });
          }
        }
      });

      // Batch create all jobs
      if (jobDataArray.length > 0) {
        await tx.job.createMany({
          data: jobDataArray,
        });
      }

      return devicesWithIds;
    });

    res.json({
      message: `Successfully created ${createdDevices.length} devices`,
      devices: createdDevices,
      count: createdDevices.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create devices" });
  }
};

// Get unique device types for a specific site
exports.getDeviceTypesBySite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId } = req.user;

    // Verify user has access to this site
    const site = await prisma.site.findFirst({
      where: {
        id: parseInt(siteId),
        OR: [
          { siteInChargeId: parseInt(userId) },
          { users: { some: { id: parseInt(userId) } } },
        ],
      },
    });

    if (!site) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this site" });
    }

    // Get unique device types for the site using the composite index
    const deviceTypes = await prisma.device.findMany({
      where: {
        siteId: parseInt(siteId),
      },
      select: {
        type: true,
      },
      distinct: ["type"],
    });

    res.json({
      siteId: parseInt(siteId),
      siteName: site.name,
      deviceTypes: deviceTypes,
      totalTypes: deviceTypes.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch device types" });
  }
};
