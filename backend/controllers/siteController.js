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

// Assign existing users to a new site by email
exports.fullAssignSite = async (req, res) => {
  const {
    site,
    siteInCharge,
    siteSupervisors = [],
    clusterSupervisors = [],
  } = req.body;
  const { userId } = req.user; // Owner's userId
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create site
      const createdSite = await tx.site.create({
        data: {
          name: site.name,
          location: site.location,
          description: site.description,
          createdById: userId,
        },
      });
      // 2. Assign site in-charge
      const siteInChargeUser = await tx.user.updateMany({
        where: { email: siteInCharge },
        data: {
          siteId: createdSite.id,
          role: "SITE_INCHARGE",
          superiorId: userId,
        },
      });
      // 3. Assign site supervisors
      const supervisorUsers = await Promise.all(
        siteSupervisors.map((email) =>
          tx.user.updateMany({
            where: { email },
            data: {
              siteId: createdSite.id,
              role: "SITE_SUPERVISOR",
              superiorId: null, // will set below
            },
          })
        )
      );
      // 4. Assign cluster supervisors
      const clusterUsers = await Promise.all(
        clusterSupervisors.map((email) =>
          tx.user.updateMany({
            where: { email },
            data: {
              siteId: createdSite.id,
              role: "CLUSTER_SUPERVISOR",
              superiorId: null, // will set below
            },
          })
        )
      );
      // Set superiorId for supervisors and cluster supervisors
      const siteInChargeRecord = await tx.user.findFirst({
        where: { email: siteInCharge },
      });
      await tx.user.updateMany({
        where: {
          email: { in: siteSupervisors },
        },
        data: {
          superiorId: siteInChargeRecord ? siteInChargeRecord.id : null,
        },
      });

      return { site: createdSite };
    });
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign users to site" });
  }
};
