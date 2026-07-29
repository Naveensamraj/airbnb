const mongoose = require("mongoose");
const { Booking, Property, User } = require("../models");
const { createNotificationRecord } = require("./notificationController");

const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "active",
  "completed",
  "cancelled",
];

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date provided");
  }
  return parsed;
}

function buildBookingFilter(query, reqUser) {
  const filter = {};

  if (query.search) {
    filter.$or = [
      { property_name: { $regex: query.search, $options: "i" } },
      { guest_name: { $regex: query.search, $options: "i" } },
      { guest_email: { $regex: query.search, $options: "i" } },
      { notes: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.property) {
    filter.property = query.property;
  }

  if (query.tenant) {
    filter.guest = query.tenant;
  }

  if (query.from || query.to) {
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;

    if (from && to && from > to) {
      throw new Error("Start date must be before end date");
    }

    if (from && to) {
      filter.check_in = { $lte: to };
      filter.check_out = { $gte: from };
    } else if (from) {
      filter.check_out = { $gte: from };
    } else if (to) {
      filter.check_in = { $lte: to };
    }
  }

  if (reqUser && reqUser.role === "tenant") {
    filter.guest = reqUser._id;
  }

  if (reqUser && reqUser.role === "owner") {
    filter.property = { $in: [] };
  }

  return filter;
}

function buildSort(query) {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    checkinAsc: { check_in: 1 },
    checkinDesc: { check_in: -1 },
    amountAsc: { total_amount: 1 },
    amountDesc: { total_amount: -1 },
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

async function updatePropertyStatus(
  propertyId,
  bookingStatus,
  excludeBookingId = null,
  session = null,
) {
  if (!propertyId) {
    return;
  }

  const property = await Property.findById(propertyId).session(session);
  if (!property) {
    return;
  }

  const activeBookings = await Booking.find({
    property: propertyId,
    _id: { $ne: excludeBookingId },
    status: { $in: ["pending", "approved", "active"] },
  }).session(session);

  let nextStatus = property.status;

  if (bookingStatus === "approved") {
    nextStatus = "reserved";
  } else if (bookingStatus === "active") {
    nextStatus = "occupied";
  } else if (["rejected", "cancelled", "completed"].includes(bookingStatus)) {
    nextStatus = activeBookings.length > 0 ? property.status : "available";
  }

  if (property.status !== nextStatus) {
    await Property.findByIdAndUpdate(
      propertyId,
      { status: nextStatus },
      { session, runValidators: true },
    );
  }
}

async function checkBookingConflict({
  propertyId,
  startDate,
  endDate,
  excludeBookingId = null,
  session = null,
}) {
  if (!propertyId || !startDate || !endDate) {
    return null;
  }

  return Booking.findOne({
    property: propertyId,
    _id: { $ne: excludeBookingId },
    status: { $nin: ["rejected", "cancelled"] },
    $or: [
      { check_in: { $lt: endDate }, check_out: { $gt: startDate } },
      { check_in: { $gte: startDate, $lt: endDate } },
      { check_out: { $gt: startDate, $lte: endDate } },
    ],
  }).session(session);
}

async function authorizeBookingAccess(req, booking) {
  if (!booking) {
    return false;
  }

  if (req.user.role === "admin") {
    return true;
  }

  if (booking.guest && booking.guest.toString() === req.user._id.toString()) {
    return true;
  }

  if (req.user.role === "owner") {
    const propertyRef =
      booking.property &&
      typeof booking.property === "object" &&
      booking.property !== null
        ? booking.property
        : await Property.findById(booking.property).select("owner");

    const propertyOwnerId =
      propertyRef && propertyRef.owner
        ? propertyRef.owner.toString()
        : propertyRef && propertyRef.toString
          ? propertyRef.toString()
          : null;

    return propertyOwnerId === req.user._id.toString();
  }

  return false;
}

async function getBookingWithDetails(bookingId) {
  return Booking.findById(bookingId)
    .populate("property", "name cover_photo owner status")
    .populate("guest", "full_name email role phone");
}

exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      property: propertyId,
      check_in,
      check_out,
      num_guests,
      total_amount,
      advance_paid,
      ...rest
    } = req.body;

    const startDate = parseDate(check_in);
    const endDate = parseDate(check_out);

    if (!propertyId || !startDate || !endDate) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Property, check-in, and check-out dates are required",
      });
    }

    if (startDate >= endDate) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    const property = await Property.findById(propertyId).session(session);
    if (!property) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const conflict = await checkBookingConflict({
      propertyId,
      startDate,
      endDate,
      session,
    });

    if (conflict) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "Property is not available for the requested dates",
      });
    }

    const nights = Math.max(
      1,
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
    );
    const computedTotal = total_amount ?? property.daily_price * nights;
    const computedAdvance = advance_paid ?? 0;

    const fileFields = req.file
      ? {
          id_proof_file: `/uploads/id_proofs/${req.file.filename}`,
          idProofFile: `/uploads/id_proofs/${req.file.filename}`,
          id_proof_mime_type: req.file.mimetype,
          idProofMimeType: req.file.mimetype,
          id_proof_original_name: req.file.originalname,
          idProofOriginalName: req.file.originalname,
          id_proof_size: req.file.size,
          idProofSize: req.file.size,
        }
      : {};

    const booking = await Booking.create(
      [
        {
          property: propertyId,
          guest: req.user._id,
          property_name: property.name,
          property_cover: property.cover_photo,
          guest_name: req.body.guest_name || req.user.full_name,
          guest_email: req.body.guest_email || req.user.email,
          guest_phone: req.body.guest_phone || req.user.phone,
          check_in: startDate,
          check_out: endDate,
          status: req.body.status || "pending",
          total_amount: computedTotal,
          advance_paid: computedAdvance,
          balance_due: computedTotal - computedAdvance,
          num_guests,
          ...rest,
          ...fileFields,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    await createNotificationRecord({
      user: property.owner,
      title: "New booking request",
      message: `${req.user.full_name || "A guest"} requested a booking for ${property.name}`,
      type: "booking",
      metadata: { bookingId: booking[0]._id, propertyId: property._id },
    }).catch(() => null);

    return res.status(201).json({ success: true, data: booking[0] });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Booking creation failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getBookings = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildBookingFilter(req.query, req.user);

    if (req.user.role === "owner") {
      const ownedProperties = await getAccessiblePropertyIds(req.user);
      filter.property = { $in: ownedProperties };
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("property", "name cover_photo owner status")
        .populate("guest", "full_name email role phone")
        .sort(buildSort(req.query))
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings",
      error: error.message,
    });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await getBookingWithDetails(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (!(await authorizeBookingAccess(req, booking))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this booking",
      });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch booking",
      error: error.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (!(await authorizeBookingAccess(req, booking))) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this booking",
      });
    }

    const allowedFields = [
      "check_in",
      "check_out",
      "num_guests",
      "notes",
      "id_proof_type",
      "id_proof_number",
      "id_proof_file",
      "id_proof_mime_type",
      "id_proof_original_name",
      "id_proof_size",
      "idProofFile",
      "idProofMimeType",
      "idProofOriginalName",
      "idProofSize",
      "guest_phone",
      "guest_name",
      "guest_email",
      "total_amount",
      "advance_paid",
      "status",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.file) {
      const filePath = `/uploads/id_proofs/${req.file.filename}`;
      updates.id_proof_file = filePath;
      updates.idProofFile = filePath;
      updates.id_proof_mime_type = req.file.mimetype;
      updates.idProofMimeType = req.file.mimetype;
      updates.id_proof_original_name = req.file.originalname;
      updates.idProofOriginalName = req.file.originalname;
      updates.id_proof_size = req.file.size;
      updates.idProofSize = req.file.size;
    } else if (req.body.remove_id_proof === "true" || req.body.remove_id_proof === true) {
      updates.id_proof_file = "";
      updates.idProofFile = "";
      updates.id_proof_mime_type = "";
      updates.idProofMimeType = "";
      updates.id_proof_original_name = "";
      updates.idProofOriginalName = "";
      updates.id_proof_size = 0;
      updates.idProofSize = 0;
    }

    if (updates.check_in || updates.check_out) {
      const startDate = updates.check_in
        ? parseDate(updates.check_in)
        : booking.check_in;
      const endDate = updates.check_out
        ? parseDate(updates.check_out)
        : booking.check_out;

      if (startDate >= endDate) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Check-out date must be after check-in date",
        });
      }

      const conflict = await checkBookingConflict({
        propertyId: booking.property,
        startDate,
        endDate,
        excludeBookingId: booking._id,
        session,
      });

      if (conflict) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: "Property is not available for the requested dates",
        });
      }
    }

    if (
      updates.total_amount !== undefined ||
      updates.advance_paid !== undefined
    ) {
      const totalAmount = updates.total_amount ?? booking.total_amount;
      const advancePaid = updates.advance_paid ?? booking.advance_paid;
      updates.balance_due = totalAmount - advancePaid;
    }

    Object.assign(booking, updates);
    await booking.save({ session });
    await session.commitTransaction();

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Booking update failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (!(await authorizeBookingAccess(req, booking))) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this booking",
      });
    }

    if (["cancelled", "rejected", "completed"].includes(booking.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "This booking cannot be cancelled again",
      });
    }

    booking.status = "cancelled";
    await booking.save({ session });
    await updatePropertyStatus(
      booking.property,
      "cancelled",
      booking._id,
      session,
    );
    await session.commitTransaction();

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Booking cancellation failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Booking deletion failed",
      error: error.message,
    });
  }
};

exports.approveBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "owner") {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only admins or property owners can approve bookings",
      });
    }

    booking.status = "approved";
    await booking.save({ session });
    await updatePropertyStatus(
      booking.property,
      "approved",
      booking._id,
      session,
    );
    await session.commitTransaction();

    const property = await Property.findById(booking.property).select("name");
    await createNotificationRecord({
      user: booking.guest,
      title: "Booking approved",
      message: `Your booking for ${property?.name || "the property"} has been approved.`,
      type: "booking",
      metadata: { bookingId: booking._id, propertyId: booking.property },
    }).catch(() => null);

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Booking approval failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.rejectBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "owner") {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only admins or property owners can reject bookings",
      });
    }

    booking.status = "rejected";
    await booking.save({ session });
    await updatePropertyStatus(
      booking.property,
      "rejected",
      booking._id,
      session,
    );
    await session.commitTransaction();

    const property = await Property.findById(booking.property).select("name");
    await createNotificationRecord({
      user: booking.guest,
      title: "Booking rejected",
      message: `Your booking for ${property?.name || "the property"} was not approved.`,
      type: "booking",
      metadata: { bookingId: booking._id, propertyId: booking.property },
    }).catch(() => null);

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Booking rejection failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.updateBookingStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (!(await authorizeBookingAccess(req, booking))) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this booking status",
      });
    }

    const requestedStatus = req.body.status;
    if (!BOOKING_STATUSES.includes(requestedStatus)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking status" });
    }

    booking.status = requestedStatus;
    await booking.save({ session });
    await updatePropertyStatus(
      booking.property,
      requestedStatus,
      booking._id,
      session,
    );
    await session.commitTransaction();

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Booking status update failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getBookingHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildBookingFilter(req.query, req.user);

    if (req.user.role === "tenant") {
      filter.guest = req.user._id;
    }

    if (req.user.role === "owner") {
      const ownedProperties = await getAccessiblePropertyIds(req.user);
      filter.property = { $in: ownedProperties };
    }

    const [history, total] = await Promise.all([
      Booking.find(filter)
        .populate("property", "name cover_photo owner status")
        .populate("guest", "full_name email role phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: history,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch booking history",
      error: error.message,
    });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { property: propertyId, from, to } = req.query;
    if (!propertyId || !from || !to) {
      return res.status(400).json({
        success: false,
        message: "Property, from, and to dates are required",
      });
    }

    const startDate = parseDate(from);
    const endDate = parseDate(to);

    if (!startDate || !endDate || startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "Valid from and to dates are required",
      });
    }

    const conflicts = await Booking.find({
      property: propertyId,
      status: { $nin: ["rejected", "cancelled"] },
      $or: [
        { check_in: { $lt: endDate }, check_out: { $gt: startDate } },
        { check_in: { $gte: startDate, $lt: endDate } },
        { check_out: { $gt: startDate, $lte: endDate } },
      ],
    }).select("check_in check_out status");

    return res.status(200).json({
      success: true,
      available: conflicts.length === 0,
      conflicts,
      requested_dates: { from: startDate, to: endDate },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Availability check failed",
      error: error.message,
    });
  }
};
