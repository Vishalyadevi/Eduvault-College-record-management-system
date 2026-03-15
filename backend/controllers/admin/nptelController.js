// controllers/admin/nptelController.js
import NPTELCourse from "../../models/student/NPTELCourse.js";

// Add new NPTEL course (Admin)
export const addNPTELCourse = async (req, res) => {
  try {
    const {
      course_name,
      provider_name,
      instructor_name,
      department,
      weeks,
      grade_O_min,
      grade_A_plus_min,
      grade_A_min,
      grade_B_plus_min,
      grade_B_min,
      grade_C_min,
      created_by,
    } = req.body;

    if (!course_name || !instructor_name || !created_by) {
      return res.status(400).json({
        message: "Course name, instructor name, and creator ID are required"
      });
    }

    const course = await NPTELCourse.create({
      course_name,
      provider_name: provider_name || 'NPTEL',
      instructor_name,
      department,
      weeks: weeks || 12,
      grade_O_min: grade_O_min || 90.00,
      grade_A_plus_min: grade_A_plus_min || 80.00,
      grade_A_min: grade_A_min || 70.00,
      grade_B_plus_min: grade_B_plus_min || 60.00,
      grade_B_min: grade_B_min || 50.00,
      grade_C_min: grade_C_min || 40.00,
      created_by,
    });

    res.status(201).json({
      message: "NPTEL course added successfully",
      course,
    });
  } catch (error) {
    console.error("Error adding NPTEL course:", error);
    res.status(500).json({
      message: "Error adding course",
      error: error.message
    });
  }
};

// Update NPTEL course (Admin)
export const updateNPTELCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course_name,
      provider_name,
      instructor_name,
      department,
      weeks,
      grade_O_min,
      grade_A_plus_min,
      grade_A_min,
      grade_B_plus_min,
      grade_B_min,
      grade_C_min,
    } = req.body;

    const course = await NPTELCourse.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.update({
      course_name: course_name ?? course.course_name,
      provider_name: provider_name ?? course.provider_name,
      instructor_name: instructor_name ?? course.instructor_name,
      department: department ?? course.department,
      weeks: weeks ?? course.weeks,
      grade_O_min: grade_O_min ?? course.grade_O_min,
      grade_A_plus_min: grade_A_plus_min ?? course.grade_A_plus_min,
      grade_A_min: grade_A_min ?? course.grade_A_min,
      grade_B_plus_min: grade_B_plus_min ?? course.grade_B_plus_min,
      grade_B_min: grade_B_min ?? course.grade_B_min,
      grade_C_min: grade_C_min ?? course.grade_C_min,
    });

    res.status(200).json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      message: "Error updating course",
      error: error.message
    });
  }
};

// Delete NPTEL course (Admin)
export const deleteNPTELCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await NPTELCourse.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.destroy();

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      message: "Error deleting course",
      error: error.message
    });
  }
};

// Get all NPTEL courses (Admin & Student)
export const getAllNPTELCourses = async (req, res) => {
  try {
    console.log("📚 Fetching NPTEL courses...");

    // First, check total count without filter
    const totalCount = await NPTELCourse.count();
    console.log(`Total courses in DB: ${totalCount}`);

    // Check active courses count
    const activeCount = await NPTELCourse.count({
      where: { is_active: true }
    });
    console.log(`Active courses: ${activeCount}`);

    // Fetch courses - Try without the is_active filter first
    const courses = await NPTELCourse.findAll({
      // Remove or comment out this line temporarily to test
      // where: { is_active: true },
      order: [['createdAt', 'DESC']],
    });

    console.log(`Courses fetched: ${courses.length}`);

    res.status(200).json({
      success: true,
      count: courses.length,
      totalInDB: totalCount,
      activeInDB: activeCount,
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      message: "Error fetching courses",
      error: error.message,
      stack: error.stack // Add stack trace for debugging
    });
  }
};
// Get single course by ID
export const getNPTELCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await NPTELCourse.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      message: "Error fetching course",
      error: error.message
    });
  }
};