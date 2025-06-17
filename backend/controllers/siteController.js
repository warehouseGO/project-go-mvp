const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getSites = async (req, res) => {
  try {
    const { role, userId } = req.query;
    let where = {};

    const sites = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { createdSites: true },
    });
    res.json(sites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sites" });
  }
};

exports.createSite = async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const { userId } = req.user; // Assume JWT payload includes userId
    const site = await prisma.site.create({
      data: {
        name,
        location,
        description,
        createdById: userId,
      },
    });
    res.status(201).json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create site" });
  }
};

exports.getSiteDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await prisma.site.findUnique({
      where: { id: parseInt(id) },
      include: { users: true, devices: true },
    });
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch site details" });
  }
};

exports.updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description } = req.body;
    const site = await prisma.site.update({
      where: { id: parseInt(id) },
      data: { name, location, description },
    });
    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update site" });
  }
};
