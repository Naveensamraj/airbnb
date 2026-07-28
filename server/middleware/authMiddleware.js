const jwt = require("jsonwebtoken");
const { Admin, User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication token is required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const accountType = decoded.accountType;
    const model = accountType === "admin" ? Admin : User;
    const account = await model.findById(decoded.id).select("-password");

    if (!account || !account.is_active) {
      return res
        .status(401)
        .json({ success: false, message: "Account is no longer active" });
    }

    req.user = account;
    req.accountType = accountType;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Invalid or expired token",
        error: error.message,
      });
  }
}

module.exports = {
  protect,
};
