function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    if (!roles.includes(req.user.role || req.accountType)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You do not have permission to access this resource",
        });
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
};
