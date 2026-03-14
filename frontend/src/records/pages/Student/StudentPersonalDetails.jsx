import { useState, useEffect } from "react";
import { FaEdit, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import API from "../../../api";
import { useAuth } from "../auth/AuthContext";

const StudentPersonalDetails = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const response = await API.get("/student"); // Fixed route to match backend

        console.log("Fetched student data:", response.data);
        if (response.data) {
          setStudent(response.data);
        } else {
          // Handle null/empty response as "No data yet"
          setStudent({});
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
        // Fail silently - treat as no data yet
        setStudent({});
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentDetails();
    }
  }, [user]);

  useEffect(() => {
    if (student) {
      setFormData({
        registerNumber: student?.registerNumber || "",
        username: student?.studentUser?.username || "",
        email: student?.studentUser?.email || "",
        role: student?.studentUser?.role || "",
        status: student?.studentUser?.status || "",
        blood_group: student?.blood_group || "O+",
        date_of_birth: student?.date_of_birth
          ? new Date(student.date_of_birth).toISOString().split("T")[0]
          : null,
        batch: student?.batch || "",
        tutorEmail: student?.tutorEmail || "",
        personal_email: student?.personal_email || "",
        first_graduate: student?.first_graduate || "No",
        aadhar_card_no: student?.aadhar_card_no || "",
        student_type: student?.student_type || "Day-Scholar",
        mother_tongue: student?.mother_tongue || "",
        religion: student?.religion || "Hindu",
        caste: student?.caste || "",
        community: student?.community || "OBC",
        gender: student?.gender || "Female",
        seat_type: student?.seat_type || "Counselling",
        section: student?.section || "",
        city: student?.city || "",
        pincode: student?.pincode || "",
        personal_phone: student?.personal_phone || "",
        departmentId: student?.departmentId || "",
        departmentName: student?.studentUser?.department?.departmentName || "",
        course: "B.E",
        semester: student?.semester || "",
        staffid: student?.staffId || "",
        staffname: student?.staffAdvisor?.username || "",
        bank_name: student?.studentUser?.bankDetails?.bank_name || "",
        branch_name: student?.studentUser?.bankDetails?.branch_name || "",
        bank_address: student?.studentUser?.bankDetails?.address || "",
        account_type: student?.studentUser?.bankDetails?.account_type || "",
        account_no: student?.studentUser?.bankDetails?.account_no || "",
        ifsc_code: student?.studentUser?.bankDetails?.ifsc_code || "",
        micr_code: student?.studentUser?.bankDetails?.micr_code || "",
        relations: student?.studentUser?.relationDetails?.map((relation) => ({
          relationship: relation?.relationship,
          name: relation?.relation_name,
          age: relation?.relation_age,
          occupation: relation?.relation_occupation,
          income: relation?.relation_income,
          phone: relation?.relation_phone,
          email: relation?.relation_email,
          photo: relation?.relation_photo || "/uploads/default.jpg",
        })) || [],
      });
    }
  }, [student]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveClick = async () => {
    try {
      if (formData.ifsc_code) {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(formData.ifsc_code)) {
          setError("Invalid IFSC Code format (e.g., ABCD0123456).");
          return;
        }
      }

      if (formData.micr_code) {
        const micrRegex = /^[0-9]{9}$/;
        if (!micrRegex.test(formData.micr_code)) {
          setError("MICR Code must be exactly 9 digits.");
          return;
        }
      }

      const updatedRelations = (formData.relations || []).map((relation) => ({
        ...relation,
        income: relation.income || "0",
        phone: relation.phone?.trim() || "",
        email: relation.email?.trim() || "",
      }));

      const updatedData = {
        ...formData,
        relations: updatedRelations,
      };

      await API.put("/student/update", updatedData);

      const response = await API.get("/student");
      setStudent(response.data);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error("❌ Update failed:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to update student details.");
    }
  };

  const handleAddRelation = () => {
    setFormData((prevState) => {
      const newRelations = [
        ...(prevState.relations || []),
        {
          relationship: "",
          name: "",
          age: "",
          occupation: "",
          income: "",
          phone: "",
          email: "",
        },
      ];
      return { ...prevState, relations: newRelations };
    });
  };

  const handleRelationChange = (index, field, value) => {
    setFormData((prevState) => {
      const updatedRelations = prevState.relations.map((relation, i) =>
        i === index ? { ...relation, [field]: value } : relation
      );
      return { ...prevState, relations: updatedRelations };
    });
  };

  const renderPersonalDetails = () => (
    <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[
        { label: "Reg No", name: "registerNumber", readOnly: true },
        { label: "Username", name: "username" },
        { label: "Email", name: "email" },
        { label: "Course", name: "course", readOnly: true },
        { label: "Department Name", name: "departmentName", readOnly: true },
        { label: "Batch", name: "batch", readOnly: true },
        { label: "Semester", name: "semester" },
        { label: "Section", name: "section" },
        { label: "Tutor Name", name: "staffname", readOnly: true },
        { label: "Tutor Email", name: "tutorEmail" },
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={field.readOnly || !isEditing}
            className={`border rounded px-3 py-2 ${field.readOnly || !isEditing
              ? "bg-gray-100 border-gray-300 cursor-not-allowed"
              : "bg-white border-gray-400"
              }`}
          />
        </div>
      ))}

      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
        {!isEditing ? (
          <div className="border rounded px-3 py-2 bg-gray-100 cursor-not-allowed">
            {formData.date_of_birth || "N/A"}
          </div>
        ) : (
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth ?? ""}
            onChange={handleInputChange}
            className="border rounded px-3 py-2 bg-white border-gray-400"
          />
        )}
      </div>

      {[
        { label: "Personal Email", name: "personal_email" },
        { label: "Phone", name: "personal_phone" },
        { label: "Aadhar Card No", name: "aadhar_card_no" },
        { label: "Mother Tongue", name: "mother_tongue" },
        { label: "Caste", name: "caste" },
        { label: "City", name: "city" },
        { label: "Pincode", name: "pincode" },
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={`border rounded px-3 py-2 ${isEditing
              ? "bg-white border-gray-400"
              : "bg-gray-100 border-gray-300"
              }`}
            placeholder={isEditing ? `Enter ${field.label.toLowerCase()}` : ""}
          />
        </div>
      ))}

      {[
        { label: "First Graduate", name: "first_graduate", options: ["Yes", "No"] },
        { label: "Blood Group", name: "blood_group", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
        { label: "Student Type", name: "student_type", options: ["Day-Scholar", "Hosteller"] },
        { label: "Religion", name: "religion", options: ["Hindu", "Muslim", "Christian", "Others"] },
        { label: "Community", name: "community", options: ["General", "OBC", "SC", "ST", "Others"] },
        { label: "Gender", name: "gender", options: ["Male", "Female", "Transgender"] },
        { label: "Seat Type", name: "seat_type", options: ["Counselling", "Management"] },
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          {!isEditing ? (
            <div className="border rounded px-3 py-2 bg-gray-100 border-gray-300">
              {formData[field.name] || "N/A"}
            </div>
          ) : (
            <select
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 bg-white border-gray-400"
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </form>
  );

  const renderFamilyDetails = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
          <tr>
            <th className="border border-gray-300 p-3 text-left">Relationship</th>
            <th className="border border-gray-300 p-3 text-left">Name</th>
            <th className="border border-gray-300 p-3 text-left">Age</th>
            <th className="border border-gray-300 p-3 text-left">Occupation</th>
            <th className="border border-gray-300 p-3 text-left">Income</th>
            <th className="border border-gray-300 p-3 text-left">Phone</th>
            <th className="border border-gray-300 p-3 text-left">Email</th>
          </tr>
        </thead>
        <tbody>
          {(formData.relations || []).map((relation, index) => (
            <tr key={relation.id || index} className="bg-white hover:bg-gray-50 transition">
              <td className="border border-gray-300 p-3">
                <select
                  value={relation.relationship || ""}
                  onChange={(e) => handleRelationChange(index, "relationship", e.target.value)}
                  className={`w-full border rounded px-2 py-1 ${isEditing
                    ? "bg-white border-gray-400"
                    : "bg-gray-100 border-gray-300"
                    }`}
                  disabled={!isEditing}
                >
                  <option value="">Select</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </td>
              {["name", "age", "occupation", "income", "phone", "email"].map((field, idx) => (
                <td key={idx} className="border border-gray-300 p-3">
                  <input
                    type="text"
                    value={
                      isEditing
                        ? relation[field] || ""
                        : relation[field] === null || relation[field] === ""
                          ? "-"
                          : relation[field]
                    }
                    onChange={(e) => handleRelationChange(index, field, e.target.value)}
                    readOnly={!isEditing}
                    placeholder={isEditing ? `Enter ${field}` : ""}
                    className={`w-full border rounded px-2 py-1 ${isEditing
                      ? "bg-white border-gray-400"
                      : "bg-gray-100 border-gray-300"
                      }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBankDetails = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Bank Name", name: "bank_name" },
        { label: "Branch Name", name: "branch_name" },
        { label: "Address", name: "bank_address" },
        { label: "Account Number", name: "account_no" },
        { label: "IFSC Code", name: "ifsc_code" },
        { label: "MICR Code", name: "micr_code" },
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!isEditing}
            placeholder={isEditing ? `Enter ${field.label.toLowerCase()}` : ""}
            className={`border rounded px-3 py-2 ${isEditing
              ? "bg-white border-gray-400"
              : "bg-gray-100 border-gray-300"
              }`}
          />
        </div>
      ))}

      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-600">Account Type</label>
        {isEditing ? (
          <select
            name="account_type"
            value={formData.account_type || "Savings"}
            onChange={handleInputChange}
            className="border rounded px-3 py-2 bg-white border-gray-400"
          >
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        ) : (
          <input
            type="text"
            name="account_type"
            value={formData.account_type || ""}
            readOnly
            className="border rounded px-3 py-2 bg-gray-100 border-gray-300"
          />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading student details...</p>
        </div>
      </div>
    );
  }

  // Error block removed to handle errors silently as requested

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Student Personal Details
      </h2>

      <div className="flex justify-end mb-6">
        {!isEditing ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEditClick}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
          >
            <FaEdit className="inline-block mr-2" /> Edit
          </motion.button>
        ) : (
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveClick}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              <FaSave className="inline-block mr-2" /> Save
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelClick}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              <FaTimes className="inline-block mr-2" /> Cancel
            </motion.button>
            {activeTab === "family" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddRelation}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                <FaPlus className="inline-block mr-2" /> Add Relation
              </motion.button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-6 mb-6">
        {["personal", "family", "bank"].map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded text-lg font-medium transition ${activeTab === tab
              ? "bg-gradient-to-r from-indigo-600 to-indigo-600 text-white shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            {tab === "personal" && "Personal Details"}
            {tab === "family" && "Family Details"}
            {tab === "bank" && "Bank Details"}
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        {activeTab === "personal" && renderPersonalDetails()}
        {activeTab === "family" && renderFamilyDetails()}
        {activeTab === "bank" && renderBankDetails()}
      </motion.div>
    </div>
  );
};

export default StudentPersonalDetails;