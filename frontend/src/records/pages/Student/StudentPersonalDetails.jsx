import { useState, useEffect } from "react";
import { FaEdit, FaSave, FaTimes, FaPlus, FaCamera, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import API from "../../../api";
import { useAuth } from "../auth/AuthContext";
import FamilyPhotoCropModal from "../../components/FamilyPhotoCropModal";

const StudentPersonalDetails = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("personal");

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedRelationIndex, setSelectedRelationIndex] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

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

  const populateFormData = (data) => {
    if (!data) return;
    setFormData({
      registerNumber: data?.registerNumber || data?.studentUser?.userNumber || data?.userNumber || user?.userNumber || "",
      username: data?.studentUser?.username || data?.studentName || user?.userName || "",
      email: data?.studentUser?.email || user?.userMail || "",
      role: data?.studentUser?.role || user?.role || "",
      status: data?.studentUser?.status || "Active",
      blood_group: data?.blood_group || "O+",
      date_of_birth: data?.date_of_birth
        ? new Date(data.date_of_birth).toISOString().split("T")[0]
        : "",
      date_of_joining: data?.date_of_joining
        ? new Date(data.date_of_joining).toISOString().split("T")[0]
        : "",
      batch: data?.batch || "",
      tutorEmail: data?.tutorEmail || "",
      personal_email: data?.personal_email || "",
      first_graduate: data?.first_graduate || "No",
      aadhar_card_no: data?.aadhar_card_no || "",
      student_type: data?.student_type || "Day-Scholar",
      mother_tongue: data?.mother_tongue || "",
      religion: data?.religion || "Hindu",
      caste: data?.caste || "",
      community: data?.community || "OBC",
      gender: data?.gender || "Female",
      seat_type: data?.seat_type || "Counselling",
      counselling_round: data?.counselling_round || "",
      admission_quota: data?.admission_quota || "",
      address_type: data?.address_type || "",
      section: data?.section || "",
      city: data?.city || "",
      pincode: data?.pincode || "",
      personal_phone: data?.personal_phone || "",
      departmentId: data?.studentUser?.department?.departmentId || data?.departmentId || data?.department?.departmentId || user?.departmentId || "",
      departmentName: data?.studentUser?.department?.departmentName || data?.department?.departmentName || user?.department?.departmentName || "",
      course: data?.course || "B.E",
      semester: data?.semester || "",
      staffid: data?.staffId || "",
      staffname: data?.staffAdvisor?.username || "",
      bank_name: data?.studentUser?.bankDetails?.bank_name || "",
      branch_name: data?.studentUser?.bankDetails?.branch_name || "",
      bank_address: data?.studentUser?.bankDetails?.address || "",
      account_type: data?.studentUser?.bankDetails?.account_type || "",
      account_no: data?.studentUser?.bankDetails?.account_no || "",
      ifsc_code: data?.studentUser?.bankDetails?.ifsc_code || "",
      micr_code: data?.studentUser?.bankDetails?.micr_code || "",
      umis_number: data?.umis_number || "",
      abc_id: data?.abc_id || data?.abcId || "",
      nad_id: data?.nad_id || data?.nadId || "",
      parents_phone: data?.parents_phone || "",
      lateral_entry: data?.lateral_entry || "No",
      student_district: data?.student_district || "",
      student_state: data?.student_state || "",
      address: data?.address || "",
      present_address: data?.present_address || "",
      permanent_address: data?.permanent_address || "",
      sixteen_digit_reg_no: data?.sixteen_digit_reg_no || "",
      nationality: data?.nationality || "Indian",
      relations: data?.studentUser?.relationDetails?.map((relation) => ({
        id: relation?.id,
        relationship: relation?.relationship,
        name: relation?.relation_name,
        age: relation?.relation_age,
        qualification: relation?.relation_qualification,
        occupation: relation?.relation_occupation,
        income: relation?.relation_income,
        phone: relation?.relation_phone,
        email: relation?.relation_email,
        photo: relation?.relation_photo || "/uploads/default.jpg",
      })) || [],
    });
  };

  useEffect(() => {
    if (student) {
      populateFormData(student);
    }
  }, [student]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (student) {
      populateFormData(student);
    }
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

  const resolveImageUrl = (path) => {
    if (!path || path === "/uploads/default.jpg") return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const backendOrigin = API.defaults.baseURL.replace(/\/api$/, "");
    return `${backendOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const handleOpenCropModal = (index) => {
    setSelectedRelationIndex(index);
    setCropModalOpen(true);
  };

  const handleSaveRelationPhoto = (photoUrl) => {
    if (selectedRelationIndex !== null) {
      handleRelationChange(selectedRelationIndex, "photo", photoUrl);
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
          qualification: "",
          occupation: "",
          income: "",
          phone: "",
          email: "",
          photo: "/uploads/default.jpg",
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

  const handleRemoveRelation = (index) => {
    setFormData((prevState) => {
      const updatedRelations = (prevState.relations || []).filter((_, i) => i !== index);
      return { ...prevState, relations: updatedRelations };
    });
  };

  const renderField = ({ label, name, type = "text", readOnly = false, options = null, placeholder = "" }) => {
    const value = formData[name] ?? "";
    const fieldReadOnly = readOnly || !isEditing;

    const baseInputClass =
      "w-full h-10 px-3 py-2 text-sm rounded-md border shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 truncate";
    const readOnlyClass = `${baseInputClass} bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed`;
    const editableClass = `${baseInputClass} bg-white border-gray-300 text-gray-900`;

    return (
      <div key={name || label} className="flex flex-col">
        <label
          className="h-5 flex items-center text-sm font-medium text-gray-700 mb-1 truncate"
          title={label}
        >
          {label}
        </label>
        {fieldReadOnly ? (
          <input
            type="text"
            name={name}
            value={value || "N/A"}
            readOnly
            title={value || "N/A"}
            className={readOnlyClass}
          />
        ) : options ? (
          <select
            name={name}
            value={value}
            onChange={handleInputChange}
            className={editableClass}
          >
            {options.map((opt) => (
              <option
                key={opt}
                value={
                  opt === "Select Round" ||
                  opt === "Select Admission Quota" ||
                  opt === "Select Address Type"
                    ? ""
                    : opt
                }
              >
                {opt}
              </option>
            ))}
          </select>
        ) : type === "date" ? (
          <input
            type="date"
            name={name}
            value={value}
            onChange={handleInputChange}
            className={editableClass}
          />
        ) : (
          <input
            type="text"
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            title={value}
            className={editableClass}
          />
        )}
      </div>
    );
  };

  const renderPersonalDetails = () => (
    <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-4" onSubmit={(e) => e.preventDefault()}>
      {/* Row 1 */}
      {renderField({ label: "Reg No", name: "registerNumber", readOnly: true })}
      {renderField({ label: "Username", name: "username" })}
      {renderField({ label: "Student Status", name: "status", readOnly: true })}
      {renderField({ label: "Email", name: "email" })}

      {/* Row 2 */}
      {renderField({ label: "Course", name: "course", readOnly: true })}
      {renderField({ label: "Department Name", name: "departmentName", readOnly: true })}
      {renderField({ label: "Batch", name: "batch", readOnly: true })}
      {renderField({ label: "Semester", name: "semester", readOnly: true })}

      {/* Row 3 */}
      {renderField({ label: "Section", name: "section" })}
      {renderField({ label: "Tutor Name", name: "staffname", readOnly: true })}
      {renderField({ label: "Tutor Email", name: "tutorEmail", readOnly: true })}
      {renderField({ label: "Date of Birth", name: "date_of_birth", type: "date" })}

      {/* Row 4 */}
      {renderField({ label: "Date of Joining", name: "date_of_joining", type: "date" })}
      {renderField({ label: "Personal Email", name: "personal_email" })}
      {renderField({ label: "Phone", name: "personal_phone" })}
      {renderField({ label: "Parents Phone", name: "parents_phone" })}

      {/* Row 5 */}
      {renderField({ label: "16-Digit Reg No", name: "sixteen_digit_reg_no" })}
      {renderField({ label: "EMIS Number", name: "umis_number" })}
      {renderField({ label: "ABC ID", name: "abc_id" })}
      {renderField({ label: "NAD ID", name: "nad_id" })}

      {/* Row 6 */}
      {renderField({ label: "Aadhar Card No", name: "aadhar_card_no" })}
      {renderField({ label: "Nationality", name: "nationality" })}
      {renderField({ label: "Mother Tongue", name: "mother_tongue" })}
      {renderField({ label: "Caste", name: "caste" })}

      {/* Row 7 */}
      {renderField({ label: "Seat Type", name: "seat_type", options: ["Counselling", "Management"] })}
      {renderField({ label: "Counselling Round", name: "counselling_round", options: ["Select Round", "Round 1", "Round 2", "Round 3", "Management"] })}
      {renderField({ label: "Admission Quota", name: "admission_quota", options: ["Select Admission Quota", "Government Quota", "Management Quota", "7.5% Govt School Quota", "Sports Quota", "NRI Quota"] })}
      {renderField({ label: "Address Type", name: "address_type", options: ["Select Address Type", "Urban", "Rural", "Semi-Urban"] })}

      {/* Row 8 */}
      {renderField({ label: "Present Address", name: "present_address" })}
      {renderField({ label: "Permanent Address", name: "permanent_address" })}
      {renderField({ label: "City", name: "city" })}
      {renderField({ label: "District", name: "student_district" })}

      {/* Row 9 */}
      {renderField({ label: "State", name: "student_state" })}
      {renderField({ label: "Pincode", name: "pincode" })}
      {renderField({ label: "First Graduate", name: "first_graduate", options: ["No", "Yes"] })}
      {renderField({ label: "Lateral Entry", name: "lateral_entry", options: ["No", "Yes"] })}

      {/* Row 10 */}
      {renderField({ label: "Blood Group", name: "blood_group", options: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] })}
      {renderField({ label: "Student Type", name: "student_type", options: ["Day-Scholar", "Hosteller"] })}
      {renderField({ label: "Religion", name: "religion", options: ["Hindu", "Muslim", "Christian", "Others"] })}
      {renderField({ label: "Community", name: "community", options: ["OBC", "BC", "MBC", "SC", "ST", "General", "Others"] })}

      {/* Row 11 */}
      {renderField({ label: "Gender", name: "gender", options: ["Female", "Male", "Transgender"] })}
    </form>
  );

  const renderFamilyDetails = () => (
    <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
      <table className="w-full border-collapse border border-gray-300 min-w-[950px]">
        <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
          <tr>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[75px]">Photo</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[130px]">Relationship</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[150px]">Name</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[80px]">Age</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[140px]">Qualification</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[140px]">Occupation</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[120px]">Income</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[140px]">Phone</th>
            <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[180px]">Email</th>
            {isEditing && <th className="border border-gray-300 px-3 py-3 text-center align-middle whitespace-nowrap min-w-[70px]">Action</th>}
          </tr>
        </thead>
        <tbody>
          {(formData.relations || []).map((relation, index) => {
            const photoUrl = resolveImageUrl(relation.photo);
            return (
              <tr key={relation.id || index} className="bg-white hover:bg-gray-50 transition">
                {/* Photo Field (Front Column) */}
                <td className="border border-gray-300 px-2 py-3 text-center align-middle">
                  <div className="relative group inline-block">
                    {photoUrl && !imgErrors[index] ? (
                      <img
                        src={photoUrl}
                        alt={relation.name || relation.relationship || "Family photo"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 shadow-sm mx-auto"
                        onError={() => setImgErrors((prev) => ({ ...prev, [index]: true }))}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center border-2 border-indigo-200 shadow-sm mx-auto">
                        {relation.name ? relation.name.charAt(0).toUpperCase() : <FaCamera className="text-indigo-400" />}
                      </div>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleOpenCropModal(index)}
                        className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-md transition transform hover:scale-110"
                        title="Upload & Adjust Photo"
                      >
                        <FaCamera className="text-xs" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Relationship Field */}
                <td className="border border-gray-300 p-2 text-center align-middle">
                  <select
                    value={relation.relationship || ""}
                    onChange={(e) => handleRelationChange(index, "relationship", e.target.value)}
                    className={`w-full text-center border rounded px-2.5 py-1.5 text-sm ${isEditing
                      ? "bg-white border-gray-400 focus:ring-2 focus:ring-indigo-500"
                      : "bg-gray-100 border-gray-300"
                      }`}
                    disabled={!isEditing}
                  >
                    <option value="">Select</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Spouse">Spouse</option>
                  </select>
                </td>

                {/* Remaining Fields */}
                {[
                  { key: "name", placeholder: "Enter name" },
                  { key: "age", placeholder: "Enter age" },
                  { key: "qualification", placeholder: "Enter qualification" },
                  { key: "occupation", placeholder: "Enter occupation" },
                  { key: "income", placeholder: "Enter income" },
                  { key: "phone", placeholder: "Enter phone" },
                  { key: "email", placeholder: "Enter email" },
                ].map(({ key, placeholder }, idx) => (
                  <td key={idx} className="border border-gray-300 p-2 text-center align-middle">
                    <input
                      type="text"
                      value={
                        isEditing
                          ? relation[key] || ""
                          : relation[key] === null || relation[key] === ""
                            ? "-"
                            : relation[key]
                      }
                      onChange={(e) => handleRelationChange(index, key, e.target.value)}
                      readOnly={!isEditing}
                      placeholder={isEditing ? placeholder : ""}
                      className={`w-full text-center border rounded px-2.5 py-1.5 text-sm ${isEditing
                        ? "bg-white border-gray-400 focus:ring-2 focus:ring-indigo-500"
                        : "bg-gray-100 border-gray-300"
                        }`}
                    />
                  </td>
                ))}

                {/* Delete Action Column */}
                {isEditing && (
                  <td className="border border-gray-300 p-2 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => handleRemoveRelation(index)}
                      className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition"
                      title="Delete row"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderBankDetails = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-4">
      {renderField({ label: "Bank Name", name: "bank_name" })}
      {renderField({ label: "Branch Name", name: "branch_name" })}
      {renderField({ label: "Address", name: "bank_address" })}
      {renderField({ label: "Account Number", name: "account_no" })}
      {renderField({ label: "IFSC Code", name: "ifsc_code" })}
      {renderField({ label: "MICR Code", name: "micr_code" })}
      {renderField({ label: "Account Type", name: "account_type", options: ["Savings", "Current"] })}
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

      {/* Family Photo Adjust/Crop Modal */}
      <FamilyPhotoCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedRelationIndex(null);
        }}
        onSave={handleSaveRelationPhoto}
        initialImage={
          selectedRelationIndex !== null && formData.relations?.[selectedRelationIndex]
            ? formData.relations[selectedRelationIndex].photo
            : null
        }
        relationTitle={
          selectedRelationIndex !== null && formData.relations?.[selectedRelationIndex]
            ? formData.relations[selectedRelationIndex].name || formData.relations[selectedRelationIndex].relationship || "Family Member"
            : "Family Member"
        }
      />
    </div>
  );
};

export default StudentPersonalDetails;