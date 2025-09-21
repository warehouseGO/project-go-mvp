const { PrismaClient, JobStatus } = require("@prisma/client");
const prisma = new PrismaClient();

// Get constraint report for a specific site
exports.getSiteConstraintReport = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;

    // Verify user has access to this site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== parseInt(siteId)) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
    }

    // Get site details
    const site = await prisma.site.findUnique({
      where: { id: parseInt(siteId) },
      select: { id: true, name: true },
    });

    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    // Optimized query with better filtering and selective fields
    const devicesWithConstraints = await prisma.device.findMany({
      where: {
        siteId: parseInt(siteId),
        jobs: {
          some: {
            status: JobStatus.CONSTRAINT,
          },
        },
      },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        type: true,
        priority: true,
        targetDate: true,
        jobs: {
          where: {
            status: JobStatus.CONSTRAINT,
          },
          select: {
            id: true,
            name: true,
            comment: true,
            updatedAt: true,
            updater: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    });

    // Calculate total constraints
    const totalConstraints = devicesWithConstraints.reduce(
      (sum, device) => sum + device.jobs.length,
      0
    );

    // Format the response
    const report = {
      siteId: site.id,
      siteName: site.name,
      totalConstraints,
      totalDevicesWithConstraints: devicesWithConstraints.length,
      generatedAt: new Date().toISOString(),
      devices: devicesWithConstraints.map((device) => ({
        deviceId: device.id,
        deviceName: device.name,
        serialNumber: device.serialNumber,
        type: device.type,
        priority: device.priority,
        targetDate: device.targetDate,
        constraints: device.jobs.map((job) => ({
          jobId: job.id,
          jobName: job.name,
          comment: job.comment,
          updatedBy: job.updater
            ? {
                id: job.updater.id,
                name: job.updater.name,
                email: job.updater.email,
              }
            : null,
          updatedAt: job.updatedAt,
        })),
      })),
    };

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch constraint report" });
  }
};

// Get constraint report for all sites (Owner only)
exports.getAllSitesConstraintReport = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== "OWNER") {
      return res
        .status(403)
        .json({ error: "Only owners can view all sites constraint report" });
    }

    // Optimized query for all sites constraint data
    const sitesWithConstraints = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        devices: {
          where: {
            jobs: {
              some: {
                status: JobStatus.CONSTRAINT,
              },
            },
          },
          select: {
            id: true,
            name: true,
            serialNumber: true,
            type: true,
            priority: true,
            targetDate: true,
            jobs: {
              where: {
                status: JobStatus.CONSTRAINT,
              },
              select: {
                id: true,
                name: true,
                comment: true,
                updatedAt: true,
                updater: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                updatedAt: "desc",
              },
            },
          },
          orderBy: {
            priority: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate totals
    const totalConstraints = sitesWithConstraints.reduce(
      (sum, site) =>
        sum +
        site.devices.reduce(
          (deviceSum, device) => deviceSum + device.jobs.length,
          0
        ),
      0
    );

    const totalDevicesWithConstraints = sitesWithConstraints.reduce(
      (sum, site) => sum + site.devices.length,
      0
    );

    // Format the response
    const report = {
      totalConstraints,
      totalDevicesWithConstraints,
      totalSitesWithConstraints: sitesWithConstraints.filter(
        (site) => site.devices.length > 0
      ).length,
      generatedAt: new Date().toISOString(),
      sites: sitesWithConstraints
        .filter((site) => site.devices.length > 0)
        .map((site) => ({
          siteId: site.id,
          siteName: site.name,
          totalConstraints: site.devices.reduce(
            (sum, device) => sum + device.jobs.length,
            0
          ),
          totalDevicesWithConstraints: site.devices.length,
          devices: site.devices.map((device) => ({
            deviceId: device.id,
            deviceName: device.name,
            serialNumber: device.serialNumber,
            type: device.type,
            priority: device.priority,
            targetDate: device.targetDate,
            constraints: device.jobs.map((job) => ({
              jobId: job.id,
              jobName: job.name,
              comment: job.comment,
              updatedBy: job.updater
                ? {
                    id: job.updater.id,
                    name: job.updater.name,
                    email: job.updater.email,
                  }
                : null,
              updatedAt: job.updatedAt,
            })),
          })),
        })),
    };

    res.json(report);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch all sites constraint report" });
  }
};
