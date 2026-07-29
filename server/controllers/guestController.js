const mongoose = require("mongoose");
const { User, Booking, Payment } = require("../models");

function nightsBetween(d1, d2) {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 1;
  return Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
}

async function computeGuestMetrics(guestId, guestEmail) {
  const query = {
    $or: [],
  };
  if (guestId && mongoose.Types.ObjectId.isValid(guestId)) {
    query.$or.push({ guest: guestId });
  }
  if (guestEmail) {
    query.$or.push({ guest_email: guestEmail.toLowerCase() });
  }

  if (query.$or.length === 0) {
    return {
      bookings: [],
      payments: [],
      total_bookings: 0,
      active_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      pending_bookings: 0,
      last_booking_date: null,
      last_check_in: null,
      last_check_out: null,
      total_nights_stayed: 0,
      favourite_property: "N/A",
      total_paid: 0,
      pending_amount: 0,
      advance_paid: 0,
      refund_amount: 0,
      outstanding_balance: 0,
      preferred_payment_method: "UPI",
      last_payment_date: null,
      total_spent: 0,
      avg_booking_value: 0,
      avg_stay_duration: 0,
      id_proof_type: "",
      id_proof_number: "",
      id_proof_file: "",
      id_proof_mime_type: "",
      id_proof_original_name: "",
      id_proof_size: 0,
    };
  }

  const bookings = await Booking.find(query)
    .populate("property", "name cover_photo location owner")
    .sort({ createdAt: -1 });

  const bookingIds = bookings.map((b) => b._id);

  const payments = await Payment.find({
    $or: [
      { booking: { $in: bookingIds } },
      ...(guestId && mongoose.Types.ObjectId.isValid(guestId)
        ? [{ user: guestId }]
        : []),
    ],
  }).sort({ createdAt: -1 });

  const total_bookings = bookings.length;
  let active_bookings = 0;
  let completed_bookings = 0;
  let cancelled_bookings = 0;
  let pending_bookings = 0;
  let total_nights_stayed = 0;
  let total_spent = 0;
  let advance_paid = 0;
  let outstanding_balance = 0;

  const propertyCounts = {};
  let latestBookingDate = null;
  let latestCheckIn = null;
  let latestCheckOut = null;

  let latestIdProof = {
    type: "",
    number: "",
    file: "",
    mime: "",
    originalName: "",
    size: 0,
  };

  bookings.forEach((b) => {
    if (["active", "approved", "confirmed"].includes(b.status)) {
      active_bookings += 1;
    } else if (["completed", "checked_out"].includes(b.status)) {
      completed_bookings += 1;
    } else if (["cancelled", "rejected"].includes(b.status)) {
      cancelled_bookings += 1;
    } else {
      pending_bookings += 1;
    }

    if (b.status !== "cancelled" && b.status !== "rejected") {
      const n = nightsBetween(b.check_in, b.check_out);
      total_nights_stayed += n;
      total_spent += b.total_amount || 0;
      advance_paid += b.advance_paid || 0;
      outstanding_balance += b.balance_due || 0;
    }

    const propName = b.property_name || b.property?.name || "Property";
    propertyCounts[propName] = (propertyCounts[propName] || 0) + 1;

    if (!latestBookingDate || new Date(b.createdAt) > new Date(latestBookingDate)) {
      latestBookingDate = b.createdAt;
    }
    if (!latestCheckIn || new Date(b.check_in) > new Date(latestCheckIn)) {
      latestCheckIn = b.check_in;
    }
    if (!latestCheckOut || new Date(b.check_out) > new Date(latestCheckOut)) {
      latestCheckOut = b.check_out;
    }

    if (b.id_proof_file || b.id_proof_number) {
      latestIdProof = {
        type: b.id_proof_type || latestIdProof.type,
        number: b.id_proof_number || latestIdProof.number,
        file: b.id_proof_file || latestIdProof.file,
        mime: b.id_proof_mime_type || latestIdProof.mime,
        originalName: b.id_proof_original_name || latestIdProof.originalName,
        size: b.id_proof_size || latestIdProof.size,
      };
    }
  });

  let favourite_property = "N/A";
  let maxCount = 0;
  Object.entries(propertyCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favourite_property = name;
    }
  });

  let total_paid = advance_paid;
  let refund_amount = 0;
  const methodCounts = {};
  let last_payment_date = null;

  payments.forEach((p) => {
    if (p.status === "completed" || p.status === "paid") {
      total_paid += p.amount || 0;
    } else if (p.status === "refunded") {
      refund_amount += p.amount || 0;
    }

    if (p.method) {
      methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
    }

    if (!last_payment_date || new Date(p.createdAt) > new Date(last_payment_date)) {
      last_payment_date = p.createdAt;
    }
  });

  let preferred_payment_method = "UPI";
  let maxMethodCount = 0;
  Object.entries(methodCounts).forEach(([m, count]) => {
    if (count > maxMethodCount) {
      maxMethodCount = count;
      preferred_payment_method = m.toUpperCase();
    }
  });

  const avg_booking_value = total_bookings > 0 ? Math.round(total_spent / total_bookings) : 0;
  const avg_stay_duration = total_bookings > 0 ? Number((total_nights_stayed / total_bookings).toFixed(1)) : 0;

  return {
    bookings,
    payments,
    total_bookings,
    active_bookings,
    completed_bookings,
    cancelled_bookings,
    pending_bookings,
    last_booking_date: latestBookingDate ? new Date(latestBookingDate).toISOString().split("T")[0] : null,
    last_check_in: latestCheckIn ? new Date(latestCheckIn).toISOString().split("T")[0] : null,
    last_check_out: latestCheckOut ? new Date(latestCheckOut).toISOString().split("T")[0] : null,
    total_nights_stayed,
    favourite_property,
    total_paid,
    pending_amount: outstanding_balance,
    advance_paid,
    refund_amount,
    outstanding_balance,
    preferred_payment_method,
    last_payment_date: last_payment_date ? new Date(last_payment_date).toISOString().split("T")[0] : null,
    total_spent,
    avg_booking_value,
    avg_stay_duration,
    id_proof_type: latestIdProof.type,
    id_proof_number: latestIdProof.number,
    id_proof_file: latestIdProof.file,
    id_proof_mime_type: latestIdProof.mime,
    id_proof_original_name: latestIdProof.originalName,
    id_proof_size: latestIdProof.size,
  };
}

exports.getGuests = async (req, res) => {
  try {
    const users = await User.find({ role: "tenant" }).sort({ createdAt: -1 });

    const guestProfiles = await Promise.all(
      users.map(async (user) => {
        const metrics = await computeGuestMetrics(user._id, user.email);
        return {
          id: user._id.toString(),
          name: user.full_name,
          email: user.email,
          phone: user.phone || "",
          alt_phone: user.alt_phone || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          postal_code: user.postal_code || "",
          emergency_contact_name: user.emergency_contact_name || "",
          emergency_contact_phone: user.emergency_contact_phone || "",
          avatar_url: user.avatar_url || "",
          status: user.status || (user.is_active === false ? "inactive" : "active"),
          is_blacklisted: user.status === "blacklisted",
          id_proof_type: user.id_proof_type || metrics.id_proof_type || "Passport",
          id_proof_number: user.id_proof_number || metrics.id_proof_number || "",
          id_proof_file: user.id_proof_file || metrics.id_proof_file || "",
          id_proof_mime_type: user.id_proof_mime_type || metrics.id_proof_mime_type || "",
          id_proof_original_name: user.id_proof_original_name || metrics.id_proof_original_name || "",
          id_proof_size: user.id_proof_size || metrics.id_proof_size || 0,
          guest_notes: user.guest_notes || "",
          admin_notes: user.admin_notes || "",
          total_bookings: metrics.total_bookings,
          active_bookings: metrics.active_bookings,
          completed_bookings: metrics.completed_bookings,
          cancelled_bookings: metrics.cancelled_bookings,
          pending_bookings: metrics.pending_bookings,
          last_booking_date: metrics.last_booking_date,
          last_check_in: metrics.last_check_in,
          last_check_out: metrics.last_check_out,
          total_nights_stayed: metrics.total_nights_stayed,
          favourite_property: metrics.favourite_property,
          total_paid: metrics.total_paid,
          pending_amount: metrics.pending_amount,
          advance_paid: metrics.advance_paid,
          refund_amount: metrics.refund_amount,
          outstanding_balance: metrics.outstanding_balance,
          preferred_payment_method: metrics.preferred_payment_method,
          last_payment_date: metrics.last_payment_date,
          total_spent: metrics.total_spent,
          avg_booking_value: metrics.avg_booking_value,
          avg_stay_duration: metrics.avg_stay_duration,
          lifetime_since: new Date(user.createdAt).toLocaleDateString(),
          last_visit: metrics.last_check_out || metrics.last_booking_date || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
    );

    return res.status(200).json({ success: true, data: guestProfiles });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch guests",
      error: error.message,
    });
  }
};

exports.getGuestById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Guest not found" });
    }

    const metrics = await computeGuestMetrics(user._id, user.email);

    const guestProfile = {
      id: user._id.toString(),
      name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      alt_phone: user.alt_phone || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      postal_code: user.postal_code || "",
      emergency_contact_name: user.emergency_contact_name || "",
      emergency_contact_phone: user.emergency_contact_phone || "",
      avatar_url: user.avatar_url || "",
      status: user.status || (user.is_active === false ? "inactive" : "active"),
      is_blacklisted: user.status === "blacklisted",
      id_proof_type: user.id_proof_type || metrics.id_proof_type || "Passport",
      id_proof_number: user.id_proof_number || metrics.id_proof_number || "",
      id_proof_file: user.id_proof_file || metrics.id_proof_file || "",
      id_proof_mime_type: user.id_proof_mime_type || metrics.id_proof_mime_type || "",
      id_proof_original_name: user.id_proof_original_name || metrics.id_proof_original_name || "",
      id_proof_size: user.id_proof_size || metrics.id_proof_size || 0,
      guest_notes: user.guest_notes || "",
      admin_notes: user.admin_notes || "",
      total_bookings: metrics.total_bookings,
      active_bookings: metrics.active_bookings,
      completed_bookings: metrics.completed_bookings,
      cancelled_bookings: metrics.cancelled_bookings,
      pending_bookings: metrics.pending_bookings,
      last_booking_date: metrics.last_booking_date,
      last_check_in: metrics.last_check_in,
      last_check_out: metrics.last_check_out,
      total_nights_stayed: metrics.total_nights_stayed,
      favourite_property: metrics.favourite_property,
      total_paid: metrics.total_paid,
      pending_amount: metrics.pending_amount,
      advance_paid: metrics.advance_paid,
      refund_amount: metrics.refund_amount,
      outstanding_balance: metrics.outstanding_balance,
      preferred_payment_method: metrics.preferred_payment_method,
      last_payment_date: metrics.last_payment_date,
      total_spent: metrics.total_spent,
      avg_booking_value: metrics.avg_booking_value,
      avg_stay_duration: metrics.avg_stay_duration,
      lifetime_since: new Date(user.createdAt).toLocaleDateString(),
      last_visit: metrics.last_check_out || metrics.last_booking_date || null,
      bookings: metrics.bookings,
      payments: metrics.payments,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({ success: true, data: guestProfile });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest profile",
      error: error.message,
    });
  }
};

exports.createGuest = async (req, res) => {
  try {
    const { name, email, phone, address, ...rest } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "A user with this email already exists" });
    }

    const user = await User.create({
      full_name: name,
      email: email.toLowerCase(),
      password: "Password123!", // default guest password
      role: "tenant",
      phone,
      address,
      ...rest,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.full_name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        status: user.status || "active",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create guest",
      error: error.message,
    });
  }
};

exports.updateGuest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Guest not found" });
    }

    const allowedFields = [
      "name",
      "full_name",
      "email",
      "phone",
      "alt_phone",
      "address",
      "city",
      "state",
      "country",
      "postal_code",
      "emergency_contact_name",
      "emergency_contact_phone",
      "id_proof_type",
      "id_proof_number",
      "id_proof_file",
      "id_proof_mime_type",
      "id_proof_original_name",
      "id_proof_size",
      "status",
      "guest_notes",
      "admin_notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "name" || field === "full_name") {
          user.full_name = req.body[field];
        } else {
          user[field] = req.body[field];
        }
      }
    });

    if (req.body.is_blacklisted !== undefined) {
      user.status = req.body.is_blacklisted ? "blacklisted" : "active";
    }

    await user.save();

    const metrics = await computeGuestMetrics(user._id, user.email);

    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.full_name,
        email: user.email,
        phone: user.phone || "",
        alt_phone: user.alt_phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
        postal_code: user.postal_code || "",
        emergency_contact_name: user.emergency_contact_name || "",
        emergency_contact_phone: user.emergency_contact_phone || "",
        avatar_url: user.avatar_url || "",
        status: user.status || "active",
        is_blacklisted: user.status === "blacklisted",
        id_proof_type: user.id_proof_type || metrics.id_proof_type || "Passport",
        id_proof_number: user.id_proof_number || metrics.id_proof_number || "",
        id_proof_file: user.id_proof_file || metrics.id_proof_file || "",
        guest_notes: user.guest_notes || "",
        admin_notes: user.admin_notes || "",
        total_bookings: metrics.total_bookings,
        total_spent: metrics.total_spent,
        last_visit: metrics.last_check_out || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update guest profile",
      error: error.message,
    });
  }
};

exports.toggleBlacklist = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Guest not found" });
    }

    user.status = user.status === "blacklisted" ? "active" : "blacklisted";
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        status: user.status,
        is_blacklisted: user.status === "blacklisted",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle guest status",
      error: error.message,
    });
  }
};

exports.deleteGuest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Guest not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Guest deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete guest",
      error: error.message,
    });
  }
};
