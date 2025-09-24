const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.ownerDashboard = async (req, res) => {
  try {
    const sites = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      include: {
        createdSites: true,
      },
    });
    res.json(sites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch owner dashboard data" });
  }
};

exports.siteInChargeDashboard = async (req, res) => {
  try {
    const { siteId } = req.params;
    const siteIdInt = parseInt(siteId);

    // Get site basic info
    const site = await prisma.site.findUnique({
      where: { id: siteIdInt },
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            phone: true,
            superiorId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!site) return res.status(404).json({ error: "Site not found" });

    // Always get all devices - frontend will handle filtering and pagination
    const devices = await prisma.device.findMany({
      where: { siteId: siteIdInt },
      select: {
        id: true,
        serialNumber: true,
        name: true,
        type: true,
        priority: true,
        status: true,
        targetDate: true,
        siteSupervisorId: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true,
        attributes: true,
        jobs: {
          select: {
            id: true,
            name: true,
            deviceType: true,
            status: true,
            comment: true,
            updatedAt: true,
            updatedBy: true,
          },
        },
      },
      // Order by priority (desc) then recency
      orderBy: [
        { priority: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Get unique device types for filtering
    const deviceTypes = await prisma.device.findMany({
      where: { siteId: siteIdInt },
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    });

    // Get device status counts for analytics
    const statusCounts = await prisma.device.groupBy({
      by: ["status"],
      where: { siteId: siteIdInt },
      _count: { status: true },
    });

    res.json({
      ...site,
      devices,
      deviceTypes: deviceTypes.map((dt) => dt.type),
      statusCounts,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch site in-charge dashboard data" });
  }
};

exports.siteSupervisorDashboard = async (req, res) => {
  try {
    const { userId } = req.user; // Assume JWT payload includes userId
    const subordinates = await prisma.user.findMany({
      where: { superiorId: userId },
      include: {
        assignedDevices: {
          include: { jobs: true },
        },
        subordinates: true,
      },
    });
    res.json(subordinates);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch site supervisor dashboard data" });
  }
};

exports.clusterSupervisorDashboard = async (req, res) => {
  try {
    const { userId } = req.user; // Assume JWT payload includes userId
    const devices = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedDevices: {
          include: { jobs: true },
        },
      },
    });
    res.json(devices);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch cluster supervisor dashboard data" });
  }
};
