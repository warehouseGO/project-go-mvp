const authorize = (requiredRole) => (req, res, next) => {
  try {
    const { roles } = req.user;
    if (!roles || !roles.some((role) => role.roleName === requiredRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Authorization failed" });
  }
};

module.exports = authorize;
