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
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
        devices: true,
      },
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
    const {
      name,
      location,
      description,
      siteInCharge,
      siteSupervisors = [],
      clusterSupervisors = [],
    } = req.body;
    const { userId } = req.user; // Owner's userId

    const result = await prisma.$transaction(async (tx) => {
      // Check if site exists and user is owner
      const existingSite = await tx.site.findUnique({
        where: { id: parseInt(id) },
        include: { createdBy: true },
      });
      if (!existingSite) {
        throw new Error("Site not found");
      }
      if (existingSite.createdById !== userId) {
        throw new Error("Only the site creator can update this site");
      }

      // 1. Update site details
      const updatedSite = await tx.site.update({
        where: { id: parseInt(id) },
        data: { name, location, description },
      });

      // 2. Clear existing assignments for this site
      await tx.user.updateMany({
        where: { siteId: parseInt(id) },
        data: { siteId: null, superiorId: null },
      });

      // 3. Assign new site in-charge
      if (siteInCharge) {
        await tx.user.updateMany({
          where: { email: siteInCharge },
          data: {
            siteId: parseInt(id),
            role: "SITE_INCHARGE",
            superiorId: userId,
          },
        });
      }

      // 4. Get the site in-charge user for setting as superior
      let siteInChargeUser = null;
      if (siteInCharge) {
        siteInChargeUser = await tx.user.findFirst({
          where: { email: siteInCharge },
        });
      }

      // 5. Assign site supervisors
      if (siteSupervisors.length > 0) {
        await tx.user.updateMany({
          where: { email: { in: siteSupervisors } },
          data: {
            siteId: parseInt(id),
            role: "SITE_SUPERVISOR",
            superiorId: siteInChargeUser ? siteInChargeUser.id : null,
          },
        });
      }

      // 6. Assign cluster supervisors
      if (clusterSupervisors.length > 0) {
        await tx.user.updateMany({
          where: { email: { in: clusterSupervisors } },
          data: {
            siteId: parseInt(id),
            role: "CLUSTER_SUPERVISOR",
            superiorId: siteInChargeUser ? siteInChargeUser.id : null,
          },
        });
      }

      return { site: updatedSite };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Site not found") {
      res.status(404).json({ error: "Site not found" });
    } else if (err.message === "Only the site creator can update this site") {
      res
        .status(403)
        .json({ error: "Only the site creator can update this site" });
    } else {
      res.status(500).json({ error: "Failed to update site" });
    }
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

// Delete site and all related data
exports.deleteSite = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if site exists and user is owner
      const site = await tx.site.findUnique({
        where: { id: parseInt(id) },
        include: { createdBy: true },
      });
      if (!site) {
        throw new Error("Site not found");
      }
      if (site.createdById !== userId) {
        throw new Error("Only the site creator can delete this site");
      }
      // Delete jobs (cascade from devices)
      await tx.job.deleteMany({
        where: {
          device: {
            siteId: parseInt(id),
          },
        },
      });
      // Delete devices
      await tx.device.deleteMany({
        where: { siteId: parseInt(id) },
      });
      // Update users to remove site association (set siteId to null)
      await tx.user.updateMany({
        where: { siteId: parseInt(id) },
        data: { siteId: null },
      });
      // Delete the site
      await tx.site.delete({
        where: { id: parseInt(id) },
      });
      return { message: "Site deleted successfully" };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Site not found") {
      res.status(404).json({ error: "Site not found" });
    } else if (err.message === "Only the site creator can delete this site") {
      res
        .status(403)
        .json({ error: "Only the site creator can delete this site" });
    } else {
      res.status(500).json({ error: "Failed to delete site" });
    }
  }
};
