const { PrismaClient, Role, UserStatus } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getUsers = async (req, res) => {
  try {
    const { role, siteId, subordinateId } = req.query;
    const where = {};
    if (role) where.role = role;
    if (siteId) where.siteId = parseInt(siteId);
    if (subordinateId) where.superiorId = parseInt(subordinateId);
    const users = await prisma.user.findMany({ where });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.getPendingUsers = async (req, res) => {
  const { superiorId } = req.query;
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: UserStatus.PENDING, superiorId: parseInt(superiorId) },
    });
    res.json(pendingUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Find the user and their superior
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { superior: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Get the superior's siteId (if any)
    const siteId = user.superior ? user.superior.siteId : null;
    // Approve the user and set their siteId
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: UserStatus.ACTIVE, siteId },
    });
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve user" });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, siteId } = req.body;
    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role, siteId },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign role" });
  }
};

exports.getHierarchy = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        superior: true,
        subordinates: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hierarchy" });
  }
};

exports.assignSubordinate = async (req, res) => {
  try {
    const { subordinateIds, superiorId } = req.body;
    if (!Array.isArray(subordinateIds) || subordinateIds.length === 0) {
      return res
        .status(400)
        .json({ error: "subordinateIds must be a non-empty array" });
    }
    if (!superiorId) {
      return res.status(400).json({ error: "superiorId is required" });
    }
    const updated = await prisma.user.updateMany({
      where: { id: { in: subordinateIds.map(Number) } },
      data: { superiorId: parseInt(superiorId) },
    });
    res.json({ count: updated.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign subordinates" });
  }
};
