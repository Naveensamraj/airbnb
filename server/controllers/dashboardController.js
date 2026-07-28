const { User, Property, Booking, Payment, Notification } = require("../models");

function buildRevenueSeries(revenueData) {
  return revenueData.map((item) => ({
    month: item._id.month,
    total: item.total,
    count: item.count,
  }));
}

function getDateRange(query) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;

  if (from && to && from > to) {
    throw new Error("Start date must be before end date");
  }

  return { from, to };
}

function getCountValue(result) {
  return result[0]?.count || 0;
}

function getTotalValue(result) {
  return result[0]?.total || 0;
}

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsersResult,
      totalPropertiesResult,
      totalBookingsResult,
      totalRevenueResult,
      pendingApprovalsResult,
      occupiedPropertiesResult,
      availablePropertiesResult,
      monthlyRevenue,
      recentBookings,
      recentPayments,
      recentNotifications,
    ] = await Promise.all([
      User.aggregate([{ $count: "count" }]),
      Property.aggregate([
        { $match: { is_deleted: false } },
        { $count: "count" },
      ]),
      Booking.aggregate([{ $count: "count" }]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Property.aggregate([
        { $match: { is_approved: false, is_deleted: false } },
        { $count: "count" },
      ]),
      Property.aggregate([
        { $match: { status: "occupied", is_deleted: false } },
        { $count: "count" },
      ]),
      Property.aggregate([
        { $match: { status: "available", is_deleted: false } },
        { $count: "count" },
      ]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: { month: { $substr: ["$createdAt", 0, 7] } },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.find()
        .populate("property", "name")
        .populate("guest", "full_name email")
        .sort({ createdAt: -1 })
        .limit(5),
      Payment.find()
        .populate("booking", "status")
        .populate("property", "name")
        .populate("user", "full_name email")
        .sort({ createdAt: -1 })
        .limit(5),
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: getCountValue(totalUsersResult),
          totalProperties: getCountValue(totalPropertiesResult),
          totalBookings: getCountValue(totalBookingsResult),
          totalRevenue: getTotalValue(totalRevenueResult),
          pendingApprovals: getCountValue(pendingApprovalsResult),
          occupiedProperties: getCountValue(occupiedPropertiesResult),
          availableProperties: getCountValue(availablePropertiesResult),
        },
        monthlyRevenue: buildRevenueSeries(monthlyRevenue),
        recentBookings,
        recentPayments,
        recentNotifications,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard data",
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsersResult,
      totalPropertiesResult,
      totalBookingsResult,
      totalRevenueResult,
      pendingApprovalsResult,
      occupiedPropertiesResult,
      availablePropertiesResult,
    ] = await Promise.all([
      User.aggregate([{ $count: "count" }]),
      Property.aggregate([
        { $match: { is_deleted: false } },
        { $count: "count" },
      ]),
      Booking.aggregate([{ $count: "count" }]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Property.aggregate([
        { $match: { is_approved: false, is_deleted: false } },
        { $count: "count" },
      ]),
      Property.aggregate([
        { $match: { status: "occupied", is_deleted: false } },
        { $count: "count" },
      ]),
      Property.aggregate([
        { $match: { status: "available", is_deleted: false } },
        { $count: "count" },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: getCountValue(totalUsersResult),
        totalProperties: getCountValue(totalPropertiesResult),
        totalBookings: getCountValue(totalBookingsResult),
        totalRevenue: getTotalValue(totalRevenueResult),
        pendingApprovals: getCountValue(pendingApprovalsResult),
        occupiedProperties: getCountValue(occupiedPropertiesResult),
        availableProperties: getCountValue(availablePropertiesResult),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard stats",
      error: error.message,
    });
  }
};

exports.getDashboardRevenue = async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query);
    const match = { status: "paid" };

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }

    const revenue = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { month: { $substr: ["$createdAt", 0, 7] } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res
      .status(200)
      .json({ success: true, data: buildRevenueSeries(revenue) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch revenue chart data",
      error: error.message,
    });
  }
};

exports.getDashboardRecent = async (req, res) => {
  try {
    const [recentBookings, recentPayments, recentNotifications] =
      await Promise.all([
        Booking.find()
          .populate("property", "name")
          .populate("guest", "full_name email")
          .sort({ createdAt: -1 })
          .limit(10),
        Payment.find()
          .populate("booking", "status")
          .populate("property", "name")
          .populate("user", "full_name email")
          .sort({ createdAt: -1 })
          .limit(10),
        Notification.find({ user: req.user._id })
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    return res.status(200).json({
      success: true,
      data: { recentBookings, recentPayments, recentNotifications },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch recent dashboard items",
      error: error.message,
    });
  }
};
