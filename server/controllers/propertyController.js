const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Property, User } = require("../models");
const { createNotificationRecord } = require("./notificationController");

const uploadDir = path.join(__dirname, "..", "uploads", "properties");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `property-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

const propertyUpload = upload.array("images", 10);

function buildPropertyQuery(query) {
  const filter = { is_deleted: false };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { location: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { address: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.city) {
    filter.location = { $regex: query.city, $options: "i" };
  }

  if (query.state) {
    filter.address = { $regex: query.state, $options: "i" };
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.owner) {
    filter.owner = query.owner;
  }

  return filter;
}

function buildSort(query) {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceAsc: { daily_price: 1 },
    priceDesc: { daily_price: -1 },
    nameAsc: { name: 1 },
  };

  return sortMap[query.sort] || { createdAt: -1 };
}

async function getPropertyOwner(req, res, property) {
  if (!property.owner) return null;
  const owner = await User.findById(property.owner).select("-password");
  return owner;
}

exports.uploadMiddleware = propertyUpload;

exports.createProperty = async (req, res) => {
  try {
    const payload = req.body;

    if (payload.name && payload.address) {
      const nameRegex = new RegExp(`^${payload.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const addressRegex = new RegExp(`^${payload.address.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const existingProperty = await Property.findOne({
        name: nameRegex,
        address: addressRegex,
        is_deleted: false,
      });

      if (existingProperty) {
        return res.status(409).json({
          success: false,
          message: "A property with the same name and address already exists",
        });
      }
    }

    const property = await Property.create({
      ...payload,
      owner: req.user._id,
      gallery: [],
      is_approved: req.user.role === "admin",
    });

    return res.status(201).json({ success: true, data: property });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Property creation failed",
      error: error.message,
    });
  }
};

exports.getProperties = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildPropertyQuery(req.query);
    const sort = buildSort(req.query);

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("owner", "full_name email role")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch properties",
      error: error.message,
    });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      is_deleted: false,
    }).populate("owner", "full_name email role");
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const owner = await getPropertyOwner(req, res, property);
    return res.status(200).json({ success: true, data: { property, owner } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch property",
      error: error.message,
    });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      is_deleted: false,
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      property.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own properties",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "location",
      "address",
      "capacity",
      "bedrooms",
      "bathrooms",
      "daily_price",
      "weekly_price",
      "monthly_price",
      "security_deposit",
      "cleaning_fee",
      "status",
      "amenities",
      "rules",
      "cover_photo",
      "gallery",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );
    return res.status(200).json({ success: true, data: updatedProperty });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Property update failed",
      error: error.message,
    });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only admins can delete properties" });
    }

    const property = await Property.findOne({
      _id: req.params.id,
      is_deleted: false,
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    property.is_deleted = true;
    property.deleted_at = new Date();
    await property.save();

    return res
      .status(200)
      .json({ success: true, message: "Property deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Property deletion failed",
      error: error.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      is_deleted: false,
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      property.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own property status",
      });
    }

    property.status = req.body.status;
    await property.save();

    return res.status(200).json({ success: true, data: property });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Status update failed",
      error: error.message,
    });
  }
};

exports.approveProperty = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can approve or reject properties",
      });
    }

    const property = await Property.findOne({
      _id: req.params.id,
      is_deleted: false,
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    property.is_approved = req.body.approved === true;
    await property.save();

    await createNotificationRecord({
      user: property.owner,
      title: property.is_approved
        ? "Property approved"
        : "Property update requires review",
      message: property.is_approved
        ? `${property.name} has been approved and is now visible to guests.`
        : `${property.name} was rejected and needs changes before it can be published.`,
      type: "property",
      metadata: { propertyId: property._id },
    }).catch(() => null);

    return res.status(200).json({ success: true, data: property });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Approval update failed",
      error: error.message,
    });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      is_deleted: false,
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      property.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own property images",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one image is required" });
    }

    const imagePaths = req.files.map(
      (file) => `/uploads/properties/${file.filename}`,
    );
    property.gallery = [...property.gallery, ...imagePaths];
    if (!property.cover_photo) {
      property.cover_photo = imagePaths[0];
    }
    await property.save();

    return res
      .status(200)
      .json({ success: true, data: { gallery: property.gallery } });
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ success: false, message: "File size exceeds the 5MB limit" });
    }
    return res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
};
