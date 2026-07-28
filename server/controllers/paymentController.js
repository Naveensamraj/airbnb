const mongoose = require("mongoose");
const { Payment, Booking, Property, User } = require("../models");
const { createNotificationRecord } = require("./notificationController");

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "overdue"];
const PAYMENT_METHODS = [
  "cash",
  "upi",
  "bank_transfer",
  "credit_card",
  "debit_card",
];

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date provided");
  }
  return parsed;
}

function buildPaymentFilter(query, reqUser) {
  const filter = {};

  if (query.search) {
    filter.$or = [
      { receipt_number: { $regex: query.search, $options: "i" } },
      { guest_name: { $regex: query.search, $options: "i" } },
      { property_name: { $regex: query.search, $options: "i" } },
      { notes: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.method) {
    filter.method = query.method;
  }

  if (query.property) {
    filter.property = query.property;
  }

  if (query.tenant) {
    filter.user = query.tenant;
  }

  if (query.from || query.to) {
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;

    if (from && to && from > to) {
      throw new Error("Start date must be before end date");
    }

    if (from && to) {
      filter.createdAt = { $lte: to, $gte: from };
    } else if (from) {
      filter.createdAt = { $gte: from };
    } else if (to) {
      filter.createdAt = { $lte: to };
    }
  }

  if (reqUser && reqUser.role === "tenant") {
    filter.user = reqUser._id;
  }

  return filter;
}

function buildSort(query) {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amountAsc: { amount: 1 },
    amountDesc: { amount: -1 },
    dueAsc: { due_date: 1 },
    dueDesc: { due_date: -1 },
  };

  return sortMap[query.sort] || { createdAt: -1 };
}

async function getAccessiblePropertyIds(reqUser) {
  if (!reqUser || reqUser.role !== "owner") {
    return [];
  }

  const properties = await Property.find({ owner: reqUser._id }).select("_id");
  return properties.map((property) => property._id);
}

function generateReceiptNumber() {
  return `RCPT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function buildReceiptData(payment) {
  return {
    receipt_number: payment.receipt_number,
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
    type: payment.type,
    generated_at: new Date().toISOString(),
    booking_id: payment.booking?.toString?.() || payment.booking,
    property_name: payment.property_name,
    guest_name: payment.guest_name,
  };
}

async function authorizePaymentAccess(req, payment) {
  if (!payment) {
    return false;
  }

  if (req.user.role === "admin") {
    return true;
  }

  if (payment.user && payment.user.toString() === req.user._id.toString()) {
    return true;
  }

  if (req.user.role === "owner") {
    const propertyId =
      payment.property &&
      typeof payment.property === "object" &&
      payment.property !== null
        ? payment.property._id || payment.property
        : payment.property;
    if (!propertyId) {
      return false;
    }
    const property = await Property.findById(propertyId).select("owner");
    return (
      property &&
      property.owner &&
      property.owner.toString() === req.user._id.toString()
    );
  }

  return false;
}

exports.createPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      booking: bookingId,
      amount,
      method,
      type,
      status,
      billing_period,
      due_date,
      notes,
    } = req.body;

    if (!bookingId || !amount) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Booking and amount are required" });
    }

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const property = await Property.findById(booking.property).session(session);
    if (!property) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const existingPayment = await Payment.findOne({
      booking: bookingId,
      billing_period:
        billing_period ||
        (due_date
          ? new Date(due_date).toISOString().slice(0, 7)
          : new Date().toISOString().slice(0, 7)),
      type: type || "advance",
    }).session(session);

    if (existingPayment) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "A payment for this booking and billing period already exists",
      });
    }

    const normalizedStatus = PAYMENT_STATUSES.includes(status)
      ? status
      : "pending";
    const normalizedMethod = PAYMENT_METHODS.includes(method) ? method : "upi";
    const parsedDueDate = due_date ? parseDate(due_date) : null;
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create(
      [
        {
          booking: bookingId,
          property: booking.property,
          user: req.user._id,
          guest_name: req.user.full_name || booking.guest_name,
          property_name: property.name,
          type: type || "advance",
          amount,
          method: normalizedMethod,
          status: normalizedStatus,
          receipt_number: receiptNumber,
          billing_period:
            billing_period ||
            (parsedDueDate
              ? parsedDueDate.toISOString().slice(0, 7)
              : new Date().toISOString().slice(0, 7)),
          due_date: parsedDueDate,
          notes,
          paid_at: normalizedStatus === "paid" ? new Date() : null,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    const createdPayment = payment[0];

    if (createdPayment.status === "paid") {
      await createNotificationRecord({
        user: req.user._id,
        title: "Payment received",
        message: `Payment of ${createdPayment.amount} received for your booking.`,
        type: "payment",
        metadata: { paymentId: createdPayment._id, bookingId: bookingId },
      }).catch(() => null);

      if (
        property.owner &&
        property.owner.toString() !== req.user._id.toString()
      ) {
        await createNotificationRecord({
          user: property.owner,
          title: "Payment received",
          message: `A payment of ${createdPayment.amount} was received for ${property.name}.`,
          type: "payment",
          metadata: { paymentId: createdPayment._id, bookingId: bookingId },
        }).catch(() => null);
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        ...createdPayment.toObject(),
        receipt: buildReceiptData(createdPayment),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Payment creation failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getPayments = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildPaymentFilter(req.query, req.user);

    if (req.user.role === "owner") {
      const ownedProperties = await getAccessiblePropertyIds(req.user);
      filter.property = { $in: ownedProperties };
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("booking", "check_in check_out status")
        .populate("property", "name")
        .populate("user", "full_name email role")
        .sort(buildSort(req.query))
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    const data = payments.map((payment) => ({
      ...payment.toObject(),
      is_overdue:
        payment.status === "pending" &&
        payment.due_date &&
        new Date(payment.due_date) < new Date(),
      receipt: buildReceiptData(payment),
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments",
      error: error.message,
    });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("booking", "check_in check_out status")
      .populate("property", "name")
      .populate("user", "full_name email role");

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (!(await authorizePaymentAccess(req, payment))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this payment",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...payment.toObject(),
        is_overdue:
          payment.status === "pending" &&
          payment.due_date &&
          new Date(payment.due_date) < new Date(),
        receipt: buildReceiptData(payment),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment",
      error: error.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (!(await authorizePaymentAccess(req, payment))) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this payment",
      });
    }

    const allowedFields = [
      "amount",
      "method",
      "status",
      "notes",
      "type",
      "due_date",
      "billing_period",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.method && !PAYMENT_METHODS.includes(updates.method)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }

    if (updates.status && !PAYMENT_STATUSES.includes(updates.status)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment status" });
    }

    if (updates.status === "paid") {
      updates.paid_at = new Date();
    }

    Object.assign(payment, updates);
    await payment.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      data: { ...payment.toObject(), receipt: buildReceiptData(payment) },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Payment update failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    await Payment.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payment deletion failed",
      error: error.message,
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildPaymentFilter(req.query, req.user);

    if (req.user.role === "tenant") {
      filter.user = req.user._id;
    }

    if (req.user.role === "owner") {
      const ownedProperties = await getAccessiblePropertyIds(req.user);
      filter.property = { $in: ownedProperties };
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("booking", "check_in check_out status")
        .populate("property", "name")
        .populate("user", "full_name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment history",
      error: error.message,
    });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
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

    return res.status(200).json({ success: true, data: revenue });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Revenue report failed",
      error: error.message,
    });
  }
};

exports.getOutstanding = async (req, res) => {
  try {
    const filter = { status: { $in: ["pending", "overdue", "failed"] } };
    const payments = await Payment.find(filter)
      .populate("booking", "check_in check_out status")
      .populate("property", "name")
      .populate("user", "full_name email role")
      .sort({ due_date: 1 });

    const outstanding = payments.map((payment) => ({
      ...payment.toObject(),
      is_overdue:
        payment.status === "pending" &&
        payment.due_date &&
        new Date(payment.due_date) < new Date(),
    }));

    const totalOutstanding = outstanding.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        totalOutstanding,
        count: outstanding.length,
        payments: outstanding,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch outstanding payments",
      error: error.message,
    });
  }
};
