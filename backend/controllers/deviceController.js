const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDevices = async (req, res) => {
  try {
    const { role, siteId, userId } = req.query;
    let where = {};
    if (role === "SITE_INCHARGE") {
      where = { siteId: parseInt(siteId) };
    } else if (role === "CLUSTER_SUPERVISOR" || role === "SITE_SUPERVISOR") {
      where = { assignedTo: parseInt(userId) };
    }
    const devices = await prisma.device.findMany({ where });
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};

exports.createDevice = async (req, res) => {
  try {
    const { serialNumber, name, type, subtype, siteId, attributes } = req.body;
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
      },
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
    const { name, type, subtype, attributes } = req.body;
    const device = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { name, type, subtype, attributes },
    });
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update device" });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.device.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Device deleted" });
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
