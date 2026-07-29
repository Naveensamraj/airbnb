const Expense = require("../models/Expense");

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ expense_date: -1, createdAt: -1 });
    return res.json({
      success: true,
      count: expenses.length,
      data: expenses.map((e) => ({
        id: e._id.toString(),
        property_id: e.property ? e.property.toString() : "manual",
        property_name: e.property_name,
        category: e.category,
        custom_category: e.category === "other" ? (e.custom_category || e.customCategory || null) : null,
        customCategory: e.category === "other" ? (e.customCategory || e.custom_category || null) : null,
        amount: e.amount,
        description: e.description,
        expense_date: e.expense_date,
        created_at: e.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const { property_name, category, custom_category, customCategory, amount, description, expense_date } = req.body;

    if (!property_name || !property_name.trim()) {
      return res.status(400).json({ success: false, message: "Property name is required" });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    const finalCustomCat = (custom_category || customCategory || "").trim();

    if (category === "other" && !finalCustomCat) {
      return res.status(400).json({
        success: false,
        message: "Custom Category is required when Category is 'Other'",
      });
    }

    const newExpense = new Expense({
      property_name: property_name.trim(),
      category: category.toLowerCase(),
      customCategory: category === "other" ? finalCustomCat : null,
      custom_category: category === "other" ? finalCustomCat : null,
      amount: Number(amount) || 0,
      description: (description || "").trim(),
      expense_date: expense_date || new Date().toISOString().slice(0, 10),
    });

    await newExpense.save();

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: {
        id: newExpense._id.toString(),
        property_id: "manual",
        property_name: newExpense.property_name,
        category: newExpense.category,
        custom_category: newExpense.custom_category,
        customCategory: newExpense.customCategory,
        amount: newExpense.amount,
        description: newExpense.description,
        expense_date: newExpense.expense_date,
        created_at: newExpense.createdAt,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { property_name, category, custom_category, customCategory, amount, description, expense_date } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const targetCategory = (category || expense.category).toLowerCase();
    const finalCustomCat = (custom_category !== undefined ? custom_category : (customCategory !== undefined ? customCategory : expense.custom_category)) || "";

    if (targetCategory === "other" && (!finalCustomCat || !finalCustomCat.trim())) {
      return res.status(400).json({
        success: false,
        message: "Custom Category is required when Category is 'Other'",
      });
    }

    if (property_name) expense.property_name = property_name.trim();
    expense.category = targetCategory;
    expense.customCategory = targetCategory === "other" ? finalCustomCat.trim() : null;
    expense.custom_category = targetCategory === "other" ? finalCustomCat.trim() : null;
    if (amount !== undefined) expense.amount = Number(amount) || 0;
    if (description !== undefined) expense.description = description.trim();
    if (expense_date) expense.expense_date = expense_date;

    await expense.save();

    return res.json({
      success: true,
      message: "Expense updated successfully",
      data: {
        id: expense._id.toString(),
        property_id: "manual",
        property_name: expense.property_name,
        category: expense.category,
        custom_category: expense.custom_category,
        customCategory: expense.customCategory,
        amount: expense.amount,
        description: expense.description,
        expense_date: expense.expense_date,
        created_at: expense.createdAt,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    return res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
