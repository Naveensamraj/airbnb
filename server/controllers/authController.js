const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Admin, User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_SECRET ||
  "dev_refresh_secret";
const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function buildPayload(user, accountType) {
  return {
    id: user._id.toString(),
    accountType,
    role: accountType === "admin" ? "admin" : user.role,
    email: user.email,
  };
}

function signAccessToken(user, accountType) {
  return jwt.sign(buildPayload(user, accountType), JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function signRefreshToken(user, accountType) {
  return jwt.sign(
    { ...buildPayload(user, accountType), tokenType: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL },
  );
}

function sanitizeUser(user, accountType) {
  const base = {
    id: user._id.toString(),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
    is_active: user.is_active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (accountType === "admin") {
    return { ...base, role: "admin" };
  }

  return {
    ...base,
    role: user.role,
    avatar_url: user.avatar_url || "",
  };
}

function sendAuthResponse(res, user, accountType, statusCode = 200) {
  const accessToken = signAccessToken(user, accountType);
  const refreshToken = signRefreshToken(user, accountType);

  return res.status(statusCode).json({
    success: true,
    data: {
      user: sanitizeUser(user, accountType),
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
    },
  });
}

async function findAccountByEmail(email, accountType) {
  if (accountType === "admin") {
    return Admin.findOne({ email }).select("+password");
  }
  return User.findOne({ email }).select("+password");
}

async function findAccountById(id, accountType) {
  if (accountType === "admin") {
    return Admin.findById(id).select("-password");
  }
  return User.findById(id).select("-password");
}

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid admin credentials" });
    }

    if (!admin.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Admin account is disabled" });
    }

    return sendAuthResponse(res, admin, "admin", 200);
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Admin login failed",
        error: error.message,
      });
  }
};

exports.register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      address,
      role = "tenant",
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({
          success: false,
          message: "User already exists with this email",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
    });

    return sendAuthResponse(res, user, "user", 201);
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "User account is disabled" });
    }

    return sendAuthResponse(res, user, "user", 200);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Login failed", error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    if (decoded.tokenType !== "refresh") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const accountType = decoded.accountType;
    const account =
      accountType === "admin"
        ? await Admin.findById(decoded.id).select("-password")
        : await User.findById(decoded.id).select("-password");

    if (!account || !account.is_active) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Session expired. Please log in again.",
        });
    }

    return sendAuthResponse(res, account, accountType, 200);
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Refresh token failed",
        error: error.message,
      });
  }
};

exports.getMe = async (req, res) => {
  try {
    const accountType = req.accountType;
    const account = await findAccountById(req.user._id, accountType);

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: { user: sanitizeUser(account, accountType) },
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to fetch profile",
        error: error.message,
      });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const accountType = req.accountType;
    const model = accountType === "admin" ? Admin : User;
    const allowedUpdates = ["full_name", "phone", "address", "avatar_url"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.email && req.body.email !== req.user.email) {
      const duplicate = await model.findOne({
        email: req.body.email,
        _id: { $ne: req.user._id },
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      updates.email = req.body.email;
    }

    const updatedAccount = await model.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true },
    );
    if (!updatedAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: { user: sanitizeUser(updatedAccount, accountType) },
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Profile update failed",
        error: error.message,
      });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const accountType = req.accountType;
    const model = accountType === "admin" ? Admin : User;
    const account = await model.findById(req.user._id).select("+password");

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const isValid = await bcrypt.compare(
      req.body.currentPassword,
      account.password,
    );
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    account.password = await bcrypt.hash(req.body.newPassword, 12);
    await account.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Password change failed",
        error: error.message,
      });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const accountType = req.body.accountType || "user";
    const model = accountType === "admin" ? Admin : User;
    const account = await model.findOne({ email: req.body.email });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "No account found for that email" });
    }

    return res.status(200).json({
      success: true,
      message:
        "If the email exists, password reset instructions would be sent shortly.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Forgot password request failed",
        error: error.message,
      });
  }
};

exports.logout = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Logout failed", error: error.message });
  }
};
