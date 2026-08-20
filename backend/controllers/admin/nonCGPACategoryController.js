// controllers/admin/nonCGPACategoryController.js
import { User, NonCGPACategory } from "../../models/index.js";
import { Op } from "sequelize";

// ========================
// CREATE OPERATIONS
// ========================

// Add new non-CGPA category
export const addNonCGPACategory = async (req, res) => {
  try {
    const { category_no, course_code, course_name, description, department, credits, semester, Userid } = req.body;

    // Validate required fields
    if (!category_no || !course_code || !course_name) {
      return res.status(400).json({ 
        message: "Category No, Course Code, and Course Name are required" 
      });
    }

    // Validate semester if provided
    if (semester && (semester < 1 || semester > 8)) {
      return res.status(400).json({ 
        message: "Semester must be between 1 and 8" 
      });
    }

    // Check if category_no already exists
    const existingCategory = await NonCGPACategory.findOne({ 
      where: { category_no } 
    });
    if (existingCategory) {
      return res.status(400).json({ 
        message: "Category No already exists" 
      });
    }

    // Check if course_code already exists
    const existingCode = await NonCGPACategory.findOne({ 
      where: { course_code } 
    });
    if (existingCode) {
      return res.status(400).json({ 
        message: "Course Code already exists" 
      });
    }

    // Create category
    const category = await NonCGPACategory.create({
      category_no,
      course_code,
      course_name,
      description: description || null,
      department: department || null,
      credits: credits || 0,
      semester: semester || null,
      is_active: true,
      Created_by: Userid || null,
      Updated_by: Userid || null,
    });

    res.status(201).json({
      message: "Non-CGPA category created successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error adding non-CGPA category:", error);
    res.status(500).json({ 
      message: "Error adding category", 
      error: error.message 
    });
  }
};

// ========================
// READ OPERATIONS
// ========================

// Get all non-CGPA categories
export const getAllNonCGPACategories = async (req, res) => {
  try {
    const { is_active, department, semester, page = 1, limit = 10 } = req.query;

    let whereClause = {};

    // Filter by active status
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    // Filter by department
    if (department) {
      whereClause.department = department;
    }

    // Filter by semester
    if (semester) {
      whereClause.semester = parseInt(semester);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await NonCGPACategory.findAndCountAll({
      where: whereClause,
      order: [['category_no', 'ASC']],
      offset,
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: "Non-CGPA categories retrieved successfully",
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      categories: rows,
    });
  } catch (error) {
    console.error("Error fetching non-CGPA categories:", error);
    res.status(500).json({ 
      message: "Error fetching categories" 
    });
  }
};

// Get single non-CGPA category by ID
export const getNonCGPACategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await NonCGPACategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ 
        message: "Category not found" 
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ 
      message: "Error fetching category" 
    });
  }
};

// Get category by course code
export const getNonCGPACategoryByCourseCode = async (req, res) => {
  try {
    const { courseCode } = req.params;

    const category = await NonCGPACategory.findOne({
      where: { course_code: courseCode },
    });

    if (!category) {
      return res.status(404).json({ 
        message: "Category not found" 
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ 
      message: "Error fetching category" 
    });
  }
};

// Search non-CGPA categories
export const searchNonCGPACategories = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: "Search query is required" 
      });
    }

    const categories = await NonCGPACategory.findAll({
      where: {
        [Op.or]: [
          { category_no: { [Op.like]: `%${query}%` } },
          { course_code: { [Op.like]: `%${query}%` } },
          { course_name: { [Op.like]: `%${query}%` } },
        ],
      },
      order: [['category_no', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Error searching categories:", error);
    res.status(500).json({ 
      message: "Error searching categories" 
    });
  }
};

// ========================
// UPDATE OPERATIONS
// ========================

// Update non-CGPA category
export const updateNonCGPACategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_no, course_code, course_name, description, department, credits, semester, is_active, Userid } = req.body;

    const category = await NonCGPACategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ 
        message: "Category not found" 
      });
    }

    // Validate semester if provided
    if (semester && (semester < 1 || semester > 8)) {
      return res.status(400).json({ 
        message: "Semester must be between 1 and 8" 
      });
    }

    // Check if new category_no exists (if being changed)
    if (category_no && category_no !== category.category_no) {
      const existing = await NonCGPACategory.findOne({ 
        where: { category_no } 
      });
      if (existing) {
        return res.status(400).json({ 
          message: "Category No already exists" 
        });
      }
    }

    // Check if new course_code exists (if being changed)
    if (course_code && course_code !== category.course_code) {
      const existing = await NonCGPACategory.findOne({ 
        where: { course_code } 
      });
      if (existing) {
        return res.status(400).json({ 
          message: "Course Code already exists" 
        });
      }
    }

    // Update fields
    category.category_no = category_no ?? category.category_no;
    category.course_code = course_code ?? category.course_code;
    category.course_name = course_name ?? category.course_name;
    category.description = description ?? category.description;
    category.department = department ?? category.department;
    category.credits = credits ?? category.credits;
    category.semester = semester ?? category.semester;
    category.is_active = is_active !== undefined ? is_active : category.is_active;
    category.Updated_by = Userid || null;

    await category.save();

    res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error updating category:", error);
    res.status(500).json({ 
      message: "Error updating category", 
      error: error.message 
    });
  }
};

// ========================
// DELETE OPERATIONS
// ========================

// Delete non-CGPA category
export const deleteNonCGPACategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await NonCGPACategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ 
        message: "Category not found" 
      });
    }

    const categoryNo = category.category_no;
    const courseCode = category.course_code;

    await category.destroy();

    res.status(200).json({
      message: "Category deleted successfully",
      deletedCategory: {
        id,
        category_no: categoryNo,
        course_code: courseCode,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    res.status(500).json({ 
      message: "Error deleting category", 
      error: error.message 
    });
  }
};

// Bulk delete categories
export const bulkDeleteNonCGPACategories = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: "Array of IDs is required" 
      });
    }

    const result = await NonCGPACategory.destroy({
      where: { id: ids },
    });

    res.status(200).json({
      message: `${result} categories deleted successfully`,
      deletedCount: result,
    });
  } catch (error) {
    console.error("❌ Error deleting categories:", error);
    res.status(500).json({ 
      message: "Error deleting categories", 
      error: error.message 
    });
  }
};

// ========================
// BULK OPERATIONS
// ========================

// Bulk upload categories
export const bulkUploadNonCGPACategories = async (req, res) => {
  try {
    const { categories, Userid } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ 
        message: "Categories array is required" 
      });
    }

    // Validate all categories before insertion
    for (let cat of categories) {
      if (!cat.category_no || !cat.course_code || !cat.course_name) {
        return res.status(400).json({ 
          message: "Each category must have category_no, course_code, and course_name" 
        });
      }

      // Check for duplicates
      const existing = await NonCGPACategory.findOne({
        where: {
          [Op.or]: [
            { category_no: cat.category_no },
            { course_code: cat.course_code },
          ],
        },
      });

      if (existing) {
        return res.status(400).json({ 
          message: `Duplicate found: Category No or Course Code ${cat.category_no} / ${cat.course_code}` 
        });
      }
    }

    // Add metadata to each category
    const categoriesToCreate = categories.map(cat => ({
      category_no: cat.category_no,
      course_code: cat.course_code,
      course_name: cat.course_name,
      description: cat.description || null,
      department: cat.department || null,
      credits: cat.credits || 0,
      semester: cat.semester || null,
      is_active: cat.is_active !== undefined ? cat.is_active : true,
      Created_by: Userid || null,
      Updated_by: Userid || null,
    }));

    const createdCategories = await NonCGPACategory.bulkCreate(categoriesToCreate);

    res.status(201).json({
      message: `${createdCategories.length} categories created successfully`,
      count: createdCategories.length,
      categories: createdCategories,
    });
  } catch (error) {
    console.error("❌ Error bulk uploading categories:", error);
    res.status(500).json({ 
      message: "Error uploading categories", 
      error: error.message 
    });
  }
};

// ========================
// STATISTICS & ANALYTICS
// ========================

// Get category statistics
export const getNonCGPACategoryStatistics = async (req, res) => {
  try {
    const allCategories = await NonCGPACategory.findAll();
    const activeCategories = await NonCGPACategory.findAll({
      where: { is_active: true },
    });

    const stats = {
      total: allCategories.length,
      active: activeCategories.length,
      inactive: allCategories.length - activeCategories.length,
      byDepartment: {},
      bySemester: {},
    };

    // Count by department
    allCategories.forEach(cat => {
      const dept = cat.department || 'Not Specified';
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
    });

    // Count by semester
    allCategories.forEach(cat => {
      if (cat.semester) {
        stats.bySemester[`Semester ${cat.semester}`] = (stats.bySemester[`Semester ${cat.semester}`] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ 
      message: "Error fetching statistics" 
    });
  }
};

// Get categories by department
export const getNonCGPACategoriesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const categories = await NonCGPACategory.findAll({
      where: { department },
      order: [['semester', 'ASC'], ['category_no', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      department,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ 
      message: "Error fetching categories" 
    });
  }
};

// Get categories by semester
export const getNonCGPACategoriesBySemester = async (req, res) => {
  try {
    const { semester } = req.params;

    if (semester < 1 || semester > 8) {
      return res.status(400).json({ 
        message: "Semester must be between 1 and 8" 
      });
    }

    const categories = await NonCGPACategory.findAll({
      where: { semester: parseInt(semester) },
      order: [['category_no', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      semester: parseInt(semester),
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ 
      message: "Error fetching categories" 
    });
  }
};