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
      where: { status: UserStatus.PENDING, superiorId },
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
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: UserStatus.ACTIVE },
    });
    res.json(user);
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
    const { subordinateId, superiorId } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(subordinateId) },
      data: { superiorId: parseInt(superiorId) },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign subordinate" });
  }
};
