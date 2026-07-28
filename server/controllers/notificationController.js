const { Notification } = require("../models");

const NOTIFICATION_TYPES = ["booking", "payment", "property", "system"];

function buildNotificationFilter(reqUser, query) {
  const filter = {};

  if (reqUser && (reqUser.role === "tenant" || reqUser.role === "owner")) {
    filter.user = reqUser._id;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.read !== undefined) {
    filter.is_read = query.read === "true";
  }

  return filter;
}

async function createNotificationRecord({
  user,
  title,
  message,
  type = "system",
  metadata = {},
}) {
  if (!user || !title || !message) {
    return null;
  }

  const recipientId =
    user && typeof user === "object" && user._id ? user._id : user;
  if (!recipientId) {
    return null;
  }

  const normalizedType = NOTIFICATION_TYPES.includes(type) ? type : "system";
  return Notification.create({
    user: recipientId,
    title,
    message,
    type: normalizedType,
    metadata: metadata || {},
  });
}

exports.createNotificationRecord = createNotificationRecord;

exports.createNotification = async (req, res) => {
  try {
    const { user, title, message, type, metadata } = req.body;
    const targetUser = user || req.user._id;

    if (!title || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Title and message are required" });
    }

    if (
      req.user.role !== "admin" &&
      targetUser.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create notifications for yourself",
      });
    }

    const notification = await createNotificationRecord({
      user: targetUser,
      title,
      message,
      type,
      metadata,
    });

    if (!notification) {
      return res.status(400).json({
        success: false,
        message: "Notification could not be created",
      });
    }

    return res.status(201).json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Notification creation failed",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildNotificationFilter(req.user, req.query);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("user", "full_name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (
      notification.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this notification",
      });
    }

    notification.is_read = true;
    await notification.save();
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to mark notification as read",
      error: error.message,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, is_read: false },
      { is_read: true },
    );
    return res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read",
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (
      notification.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this notification",
      });
    }

    await Notification.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Notification deletion failed",
      error: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      is_read: false,
    });
    return res
      .status(200)
      .json({ success: true, data: { unread_count: count } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch unread count",
      error: error.message,
    });
  }
};
