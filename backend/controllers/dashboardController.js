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
    const site = await prisma.site.findUnique({
      where: { id: parseInt(siteId) },
      include: {
        users: true,
        devices: {
          include: { jobs: true },
        },
      },
    });
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json(site);
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
