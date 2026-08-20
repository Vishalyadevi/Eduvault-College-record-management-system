
import { User, StudentDetails, Scholarship } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";


export const addScholarship = async (req, res) => {
  try {
    const {
      name,
      provider,
      type,
      customType,
      year,
      status,
      appliedDate,
      receivedAmount,
      receivedDate,
    } = req.body;

    // Robust User ID retrieval
    const Userid = req.user?.Userid || req.body?.Userid || req.body?.UserId;

    console.log("Add Scholarship Payload:", req.body);
    console.log("Resolved Userid:", Userid);

    // Validate User ID
    if (!Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user details
    const user = await User.findByPk(Userid);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student email not found" });
    }

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    // Create scholarship
    const scholarship = await Scholarship.create({
      Userid,
      name,
      provider,
      type,
      customType: type === "Other" ? customType : null,
      year,
      status,
      appliedDate,
      receivedAmount: status === "Received" ? parseFloat(receivedAmount) : null,
      receivedDate: status === "Received" ? receivedDate : null,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: user.userId,
      Updated_by: user.userId,
    });


    // Send email to tutor
    const emailResponse = await sendEmail({
      from: user.userMail,
      to: student.tutorEmail,
      subject: "New Scholarship Pending Approval",
      text: `Dear Tutor,

A student has submitted a new scholarship for your approval. Please find the details below:

Student registerNumber: ${student.registerNumber}
Student Name: ${user.userName || "N/A"}
Scholarship Name: ${name}
Provider: ${provider}
Type: ${type}${type === "Other" ? ` (${customType})` : ""}
Year: ${year}
Status: ${status}
Applied Date: ${appliedDate}
Received Amount: ${status === "Received" ? `₹${receivedAmount}` : "Not Applicable"}
Received Date: ${status === "Received" ? receivedDate : "Not Applicable"}

The scholarship is currently pending your approval. Please review the details and either approve or reject the scholarship.

Best Regards,
Scholarship Management System

Note: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`,
    });

    // Handle email sending errors
    if (!emailResponse.success) {
      console.error("⚠️ Failed to send email:", emailResponse.error);
    }

    // Return success response
    res.status(201).json({
      message: "Scholarship submitted for approval. Tutor notified.",
      scholarship,
    });
  } catch (error) {
    console.error("❌ Error adding scholarship:", error);
    res.status(500).json({ message: "Error adding scholarship", error });
  }
};

// Update a scholarship// Update a scholarship
export const updateScholarship = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    provider,
    type,
    customType,
    year,
    status,
    appliedDate,
    receivedAmount,
    receivedDate,
  } = req.body;

  const Userid = req.user?.Userid || req.body?.Userid || req.body?.UserId;

  console.log("Update Scholarship - Target ID:", id);
  console.log("Update Scholarship - Resolved Userid:", Userid);

  try {


    // Find the scholarship by ID
    const scholarship = await Scholarship.findByPk(id);
    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    if (scholarship.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this scholarship" });
    }


    // Find the user and student details
    const user = await User.findByPk(Userid);

    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Validate receivedAmount and receivedDate if status is "Received"
    if (status === "Received") {
      if (!receivedAmount || isNaN(parseFloat(receivedAmount))) {
        return res.status(400).json({ message: "Received amount is required and must be a valid number" });
      }
      if (!receivedDate || isNaN(Date.parse(receivedDate))) {
        return res.status(400).json({ message: "Received date is required and must be a valid date" });
      }
    }

    // Update scholarship details
    scholarship.name = name ?? scholarship.name;
    scholarship.provider = provider ?? scholarship.provider;
    scholarship.type = type ?? scholarship.type;
    scholarship.customType = type === "Other" ? customType : null;
    scholarship.year = year ?? scholarship.year;
    scholarship.status = status ?? scholarship.status;
    scholarship.appliedDate = appliedDate ?? scholarship.appliedDate;
    scholarship.receivedAmount = status === "Received" ? parseFloat(receivedAmount) : null;
    scholarship.receivedDate = status === "Received" ? receivedDate : null;
    scholarship.Updated_by = Userid;
    scholarship.pending = true;
    scholarship.tutor_approval_status = false;
    scholarship.Approved_by = null;
    scholarship.approved_at = null;

    // Save the updated scholarship
    await scholarship.save();

    // Send email to tutor if tutor's email is available
    if (student.tutorEmail) {
      const emailSubject = "Scholarship Updated - Requires Review";
      const emailText = `Dear Tutor,

A student has updated their scholarship details. Please review the updated details:

Student registerNumber: ${student.registerNumber}
Student Name: ${user.userName || "N/A"}
Scholarship Name: ${scholarship.name}
Provider: ${scholarship.provider}
Type: ${scholarship.type}${scholarship.type === "Other" ? ` (${scholarship.customType})` : ""}
Year: ${scholarship.year}
Status: ${scholarship.status}
Applied Date: ${scholarship.appliedDate}
Received Amount: ${scholarship.status === "Received" ? `₹${scholarship.receivedAmount}` : "Not Applicable"}
Received Date: ${scholarship.status === "Received" ? scholarship.receivedDate : "Not Applicable"}

This scholarship is now pending approval. Please review the details.

Best Regards,
Scholarship Management System

Note: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`;

      const emailResponse = await sendEmail({
        from: user.userMail,
        to: student.tutorEmail,
        subject: emailSubject,
        text: emailText,
      });

      if (!emailResponse.success) {
        console.error("⚠️ Failed to send email:", emailResponse.error);
      }
    } else {
      console.warn("⚠️ Tutor email not found. Email notification skipped.");
    }

    // Return success response
    res.status(200).json({
      message: "Scholarship updated successfully, tutor notified.",
      scholarship,
    });
  } catch (error) {
    console.error("❌ Error updating scholarship:", error);
    res.status(500).json({ message: "Error updating scholarship", error: error.message });
  }
};
// Get pending scholarships
export const getPendingScholarships = async (req, res) => {
  try {
    const pendingScholarships = await Scholarship.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "student", // Use the correct alias for the student association
          attributes: ["userId", "userName", "userMail"], // Use correct column names
          include: [
            {
              model: StudentDetails,
              as: "studentDetails", // Alias for the student details
              attributes: ["registerNumber", "staffId"], // Include registerNumber and staffId
            },
          ],
        },
      ],
    });



    // Format the response to include all scholarship details, username, and registerNumber
    const formattedScholarships = pendingScholarships.map((scholarship) => {
      const { student, ...rest } = scholarship.get({ plain: true }); // Destructure student


      return {
        ...rest, // Include all fields from the Scholarship model
        username: student?.userName || "N/A", // Use userName (fallback to "N/A" if undefined)
        email: student?.userMail || "N/A", // Use userMail as email
        registerNumber: student?.studentDetails?.registerNumber || "N/A", // Include registerNumber (fallback to "N/A" if undefined)
        staffId: student?.studentDetails?.staffId || "N/A", // Include staffId (fallback to "N/A" if undefined)
      };
    });



    res.status(200).json({ success: true, scholarships: formattedScholarships });
  } catch (error) {
    console.error("Error fetching pending scholarships:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending scholarships" });
  }
};

// Get approved scholarships
export const getApprovedScholarships = async (req, res) => {
  try {


    const userId = req.user?.Userid || req.body?.UserId || req.query?.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }


    const approvedScholarships = await Scholarship.findAll({
      where: { Userid: userId }, // Filter by Userid only to include both pending and approved
      order: [["createdAt", "DESC"]],
    });


    return res.status(200).json(approvedScholarships);
  } catch (error) {
    console.error("Error fetching approved scholarships:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a scholarship
export const deleteScholarship = async (req, res) => {
  try {
    const { id } = req.params;

    const scholarship = await Scholarship.findByPk(id);
    if (!scholarship) return;

    const student = await StudentDetails.findOne({ where: { Userid: scholarship.Userid } });
    const user = await User.findByPk(scholarship.Userid);

    if (!user || !student) return;

    await Scholarship.destroy({ where: { id } });

    sendEmail({
      to: user.userMail,
      subject: "Scholarship Deleted Notification",
      text: `Dear ${user.userName || "Student"},

Your scholarship has been removed.

- **Name**: ${scholarship.name}  
- **Provider**: ${scholarship.provider}  
- **Type**: ${scholarship.type}${scholarship.type === "Other" ? ` (${scholarship.customType})` : ""}  
- **Year**: ${scholarship.year}  
- **Status**: ${scholarship.status}  

If this was an error, contact **tutorsjf@gmail.com**.

Best,  
Scholarship Management System`,
    });

    sendEmail({
      to: student.tutorEmail,
      subject: "Scholarship Deleted Notification",
      text: `Dear Tutor,

The following scholarship submitted by your student has been deleted:

- **Student registerNumber**: ${student.registerNumber}  
- **Student Name**: ${user.userName || "N/A"}  
- **Scholarship Name**: ${scholarship.name}  
- **Provider**: ${scholarship.provider}  
- **Type**: ${scholarship.type}${scholarship.type === "Other" ? ` (${scholarship.customType})` : ""}  
- **Year**: ${scholarship.year}  
- **Status**: ${scholarship.status}  

If you need further details, contact **tutorsjf@gmail.com**.

Best,  
Scholarship Management System`,
    });

    res.status(200).json({ message: "Scholarship deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting scholarship:", error);
    res.status(500).json({ message: "Error deleting scholarship", error });
  }
};