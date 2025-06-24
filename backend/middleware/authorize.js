const authorize = (requiredRoles) => (req, res, next) => {
  try {
    const { roles } = req.user;
    const required = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    if (!roles || !roles.some((role) => required.includes(role.roleName))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Authorization failed" });
  }
};

module.exports = authorize;
