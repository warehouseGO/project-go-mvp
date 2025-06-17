const { PrismaClient, Role, UserStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, superiorId } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        superiorId,
        role: Role.SITE_SUPERVISOR, // Default role, can be changed later
        status: UserStatus.PENDING,
      },
    });
    res.status(201).json({
      message: "Registration successful, pending approval",
      user: { id: user.id, email: user.email, status: user.status },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.status !== "ACTIVE")
      return res.status(403).json({ error: "User not active" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    // Build roles array for JWT
    const roles = [
      {
        roleName: user.role,
        siteId: user.siteId,
        siteName: null, // Can be populated with join if needed
        permissions: [], // To be filled based on role
      },
    ];
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = async (req, res) => {
  // Stateless JWT: logout is handled on client by deleting token
  res.json({ message: "Logged out" });
};

exports.me = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      siteId: user.siteId,
      superiorId: user.superiorId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
