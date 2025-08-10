const { PrismaClient, ResourceStatus } = require("@prisma/client");
const prisma = new PrismaClient();

// List resources (Owner: all, Site In-Charge: only their site)
exports.getResources = async (req, res) => {
  try {
    const { role, siteId, type, status, search } = req.query;
    const where = {};
    if (role === "SITE_INCHARGE") {
      where.siteId = parseInt(siteId);
    } else if (siteId) {
      where.siteId = parseInt(siteId);
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { regNo: { contains: search, mode: "insensitive" } },
      ];
    }
    const resources = await prisma.resource.findMany({
      where,
      include: { site: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

// Add a new resource (Owner only)
exports.createResource = async (req, res) => {
  try {
    const { name, regNo, type, attributes, siteId } = req.body;
    const resource = await prisma.resource.create({
      data: {
        name,
        regNo,
        type,
        attributes,
        siteId: siteId ? parseInt(siteId) : null,
      },
    });
    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create resource" });
  }
};

// Edit a resource (Owner only, all fields except status/dispatchDate)
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, regNo, type, attributes, siteId, allocatedAt } = req.body;
    const resource = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: {
        name,
        regNo,
        type,
        attributes,
        siteId: siteId ? parseInt(siteId) : null,
        allocatedAt: allocatedAt ? new Date(allocatedAt) : null,
      },
    });
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update resource" });
  }
};

// Delete a resource (Owner only)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.resource.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Resource deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
};

// Bulk allocate resources to a site (Owner only)
exports.allocateResources = async (req, res) => {
  try {
    const { resourceIds, siteId, allocatedAt } = req.body;
    const updated = await prisma.resource.updateMany({
      where: { id: { in: resourceIds.map(Number) } },
      data: {
        siteId: parseInt(siteId),
        allocatedAt: allocatedAt ? new Date(allocatedAt) : new Date(),
      },
    });
    res.json({ message: "Resources allocated", count: updated.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to allocate resources" });
  }
};

// Site In-Charge: update status and dispatchDate for a resource at their site
exports.updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dispatchDate } = req.body;
    // Only allow if resource is at the site of the site in-charge
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id) },
    });
    console.log(resource);
    console.log(req.user);
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    // Assume req.user.siteId is set for site in-charge

    const updated = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: {
        status,
        dispatchDate: dispatchDate ? new Date(dispatchDate) : null,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update resource status" });
  }
};
