import { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaSave, FaTimes, FaPlus, FaCamera, FaRedo, FaUndo, FaSync, FaUserCircle } from "react-icons/fa";
import { MdOutlineDragIndicator } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../api";
import { useAuth } from "../auth/AuthContext";

/* ─── Photo Crop Modal ────────────────────────────────────────────────── */
const PhotoCropModal = ({ onSave, onCancel, existingPhoto }) => {
  const [imgSrc, setImgSrc] = useState(existingPhoto || null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const CIRCLE_SIZE = 200;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target.result);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgSrc) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CIRCLE_SIZE, CIRCLE_SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(0, 0, CIRCLE_SIZE, CIRCLE_SIZE);
      ctx.translate(CIRCLE_SIZE / 2 + offset.x, CIRCLE_SIZE / 2 + offset.y);
      ctx.rotate((rotation * Math.PI) / 180);
      const scale = zoom;
      const imgAspect = img.width / img.height;
      let drawW, drawH;
      if (imgAspect > 1) {
        drawH = CIRCLE_SIZE * scale;
        drawW = drawH * imgAspect;
      } else {
        drawW = CIRCLE_SIZE * scale;
        drawH = drawW / imgAspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    };
    img.src = imgSrc;
  }, [imgSrc, zoom, offset, rotation]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => { if (dragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setDragging(false);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FaUserCircle /> Adjust Photo for Family Member
          </div>
          <button onClick={onCancel} className="text-white hover:text-gray-200"><FaTimes size={16} /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {!imgSrc ? (
            <div
              onClick={() => fileInputRef.current.click()}
              className="cursor-pointer flex flex-col items-center justify-center rounded-full border-2 border-dashed border-purple-400 bg-gray-50 text-purple-500 hover:bg-purple-50 transition"
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            >
              <FaCamera size={32} className="mb-2" />
              <span className="text-xs font-medium text-center px-4">Click to choose image</span>
              <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP formats</span>
            </div>
          ) : (
            <canvas
              ref={canvasRef} width={CIRCLE_SIZE} height={CIRCLE_SIZE}
              className="rounded-full cursor-grab active:cursor-grabbing shadow-lg border-4 border-purple-200"
              style={{ borderRadius: "50%" }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            />
          )}
          {imgSrc && (
            <>
              <div className="w-full flex items-center gap-3 px-2">
                <span className="text-gray-400 text-xs">🔍</span>
                <input type="range" min="0.5" max="3" step="0.01" value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 accent-purple-600" />
                <span className="text-xs text-gray-500 w-10 text-right">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded-full px-4 py-1">
                <MdOutlineDragIndicator /> Drag image to position • Scroll to zoom
              </div>
              <div className="flex items-center justify-between w-full px-2">
                <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
                  <FaUserCircle size={12} /> Change Image
                </button>
                <div className="flex items-center gap-3 text-gray-400">
                  <button onClick={() => setRotation((r) => r - 90)} title="Rotate Left" className="hover:text-purple-600 transition"><FaUndo size={14} /></button>
                  <button onClick={() => { setOffset({ x: 0, y: 0 }); setZoom(1); setRotation(0); }} title="Reset" className="hover:text-purple-600 transition"><FaSync size={14} /></button>
                  <button onClick={() => setRotation((r) => r + 90)} title="Rotate Right" className="hover:text-purple-600 transition"><FaRedo size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleApply} disabled={!imgSrc}
            className="px-5 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2">
            ✓ Apply & Save Photo
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────────────── */
const StudentPersonalDetails = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [cropModalIndex, setCropModalIndex] = useState(null);

  // Draft state for family details — changes only committed on Save
  const [draftRelations, setDraftRelations] = useState([]);
  const [savedRelations, setSavedRelations] = useState([]);

  /* ── Map API response → formData ──────────────────────────────────── */
  const mapStudentToForm = (s) => {
    if (!s) return {};
    return {
      // Read-only identity fields — try every possible path the API returns
      registerNumber: s.registerNumber || "",
      username:       s.studentUser?.username || s.studentName || "",
      email:          s.studentUser?.email || "",
      status:         s.studentUser?.status || "Active",
      course:         s.course || "B.E",
      departmentName: s.studentUser?.department?.departmentName || s.departmentName || "",
      batch:          s.batch ? String(s.batch) : "",
      semester:       s.semester ? String(s.semester) : "",

      // Editable student fields
      section:             s.section || "",
      student_type:        s.student_type || "",
      gender:              s.gender || "",
      date_of_birth:       s.date_of_birth ? new Date(s.date_of_birth).toISOString().split("T")[0] : "",
      nationality:         s.nationality || "Indian",
      sixteen_digit_reg_no: s.sixteen_digit_reg_no || "",
      emis_number:         s.emis_number || "",
      abc_id:              s.abc_id || "",
      nad_id:              s.nad_id || "",
      seat_type:           s.seat_type || "",
      admission_quota:     s.admission_quota || "",
      first_graduate:      s.first_graduate || "",
      lateral_entry:       s.lateral_entry || "",
      date_of_joining:     s.date_of_joining ? new Date(s.date_of_joining).toISOString().split("T")[0] : "",

      // Tutor — read-only, fetched from staffAdvisor association
      staffname:  s.staffAdvisor?.username || "",
      tutorEmail: s.staffAdvisor?.email || "",

      personal_email:   s.personal_email || "",
      personal_phone:   s.personal_phone || "",
      parents_phone:    s.parents_phone || "",
      address_type:     s.address_type || "",
      present_address:  s.present_address || "",
      permanent_address: s.permanent_address || "",
      city:             s.city || "",
      student_district: s.student_district || "",
      student_state:    s.student_state || "",
      pincode:          s.pincode || "",
      aadhar_card_no:   s.aadhar_card_no || "",
      blood_group:      s.blood_group || "",
      mother_tongue:    s.mother_tongue || "",
      religion:         s.religion || "",
      caste:            s.caste || "",
      community:        s.community || "",
      departmentId:     s.departmentId || "",

      // Bank
      bank_name:    s.studentUser?.bankDetails?.bank_name || "",
      branch_name:  s.studentUser?.bankDetails?.branch_name || "",
      bank_address: s.studentUser?.bankDetails?.address || "",
      account_type: s.studentUser?.bankDetails?.account_type || "",
      account_no:   s.studentUser?.bankDetails?.account_no || "",
      ifsc_code:    s.studentUser?.bankDetails?.ifsc_code || "",
      micr_code:    s.studentUser?.bankDetails?.micr_code || "",
      umis_number:  s.umis_number || "",
    };
  };

  const mapRelations = (s) =>
    (s?.studentUser?.relationDetails || []).map((r) => ({
      id:           r.id,
      relationship: r.relationship || "",
      name:         r.relation_name || "",
      age:          r.relation_age ? String(r.relation_age) : "",
      qualification: r.relation_qualification || "",
      occupation:   r.relation_occupation || "",
      income:       r.relation_income || "",
      phone:        r.relation_phone || "",
      email:        r.relation_email || "",
      photo:        r.relation_photo || null,
      _deleted:     false,
    }));

  /* ── Fetch ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const response = await API.get("/student");
        console.log("API response:", response.data);
        const s = response.data;
        setStudent(s);
        setFormData(mapStudentToForm(s));
        const rels = mapRelations(s);
        setSavedRelations(rels);
        setDraftRelations(rels);
      } catch (err) {
        console.error("Fetch error:", err);
        setStudent({});
        setFormData({});
        setSavedRelations([]);
        setDraftRelations([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStudentDetails();
  }, [user]);

  /* ── Edit mode start/cancel ───────────────────────────────────────── */
  const handleEditClick = () => {
    // Reset draft to saved on edit start
    setDraftRelations(savedRelations.map((r) => ({ ...r, _deleted: false })));
    setIsEditing(true);
    setError(null);
  };

  const handleCancelClick = () => {
    // Discard all draft changes — revert family to saved
    setDraftRelations(savedRelations.map((r) => ({ ...r, _deleted: false })));
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Validate ─────────────────────────────────────────────────────── */
  const validate = () => {
    if (formData.personal_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personal_email.trim())) {
      return "Invalid Personal Email format (e.g., student@example.com).";
    }
    if (formData.pincode?.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      return "Pincode must be exactly 6 digits.";
    }
    if (formData.date_of_birth?.trim() && new Date(formData.date_of_birth) > new Date()) {
      return "Date of Birth cannot be in the future.";
    }
    if (formData.aadhar_card_no?.trim() && !/^\d{12}$/.test(formData.aadhar_card_no.trim())) {
      return "Aadhaar Card No must be exactly 12 digits (numbers only).";
    }
    if (formData.sixteen_digit_reg_no?.trim() && !/^\d{16}$/.test(formData.sixteen_digit_reg_no.trim())) {
      return "16-Digit Reg No must be exactly 16 digits (numbers only).";
    }
    if (formData.personal_phone?.trim() && !/^\d{10}$/.test(formData.personal_phone.trim())) {
      return "Personal Phone number must be exactly 10 digits (numbers only).";
    }
    if (formData.parents_phone?.trim() && !/^\d{10}$/.test(formData.parents_phone.trim())) {
      return "Parents Phone number must be exactly 10 digits (numbers only).";
    }
    if (formData.abc_id?.trim() && !/^[a-zA-Z0-9]{12}$/.test(formData.abc_id.trim())) {
      return "ABC ID must be exactly 12 characters (alphanumeric).";
    }
    if (formData.emis_number?.trim() && !/^\d{10,16}$/.test(formData.emis_number.trim())) {
      return "EMIS Number must be between 10 and 16 digits (numbers only).";
    }
    if (formData.nad_id?.trim() && !/^[a-zA-Z0-9]{8,16}$/.test(formData.nad_id.trim())) {
      return "NAD ID must be between 8 and 16 characters.";
    }
    if (formData.ifsc_code?.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code.trim())) {
      return "Invalid IFSC Code format (e.g., SBIN0001234).";
    }
    if (formData.micr_code?.trim() && !/^\d{9}$/.test(formData.micr_code.trim())) {
      return "MICR Code must be exactly 9 digits.";
    }
    // Validate draft relations
    for (const rel of draftRelations) {
      const hasAnyField = rel.name?.trim() || rel.phone?.trim() || rel.email?.trim() || rel.occupation?.trim() || rel.qualification?.trim() || rel.photo;
      if (hasAnyField && (!rel.relationship || !rel.relationship.trim())) {
        return "Please select a Relationship (e.g., Father, Mother, Sibling) for all added family members.";
      }
      if (rel.phone?.trim() && !/^\d{10}$/.test(rel.phone.trim())) {
        return `Invalid phone number for ${rel.relationship || "relation"}. Must be 10 digits.`;
      }
      if (rel.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rel.email.trim())) {
        return `Invalid email format for ${rel.relationship || "relation"}.`;
      }
    }
    return null;
  };

  /* ── Save ─────────────────────────────────────────────────────────── */
  const handleSaveClick = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);
    try {
      const activeRelations = draftRelations
        .filter((r) => r.relationship && r.relationship.trim())
        .map((r) => ({
          ...r,
          income: r.income || "0",
          phone:  r.phone?.trim() || "",
          email:  r.email?.trim() || "",
        }));

      await API.put("/student/update", { ...formData, relations: activeRelations });

      const response = await API.get("/student");
      const s = response.data;
      setStudent(s);
      setFormData(mapStudentToForm(s));
      const rels = mapRelations(s);
      setSavedRelations(rels);
      setDraftRelations(rels);
      setIsEditing(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to update student details.";
      setError(msg);
    }
  };

  /* ── Family draft handlers ────────────────────────────────────────── */
  const handleAddRelation = () => {
    setDraftRelations((prev) => [
      ...prev,
      { relationship: "", name: "", age: "", qualification: "", occupation: "", income: "", phone: "", email: "", photo: null, _deleted: false, _isNew: true },
    ]);
  };

  const handleRelationChange = (index, field, value) => {
    setDraftRelations((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  // Remove row from draft relations — clicking Cancel restores saved relations, clicking Save commits deletion
  const handleDeleteRelation = (index) => {
    setDraftRelations((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSave = (index, dataUrl) => {
    handleRelationChange(index, "photo", dataUrl);
    setCropModalIndex(null);
  };

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const isEmptyVal = (v, fieldDef) => {
    if (!v || String(v).trim() === "") return true;
    if (fieldDef?.type === "select") {
      return (fieldDef.options || []).slice(0, 1).some((o) => o.startsWith("Select") || o.startsWith("Enter"));
    }
    return false;
  };
  const textColor = (v) => (v && String(v).trim() ? "text-gray-900" : "text-gray-400");

  /* ── Personal Details ─────────────────────────────────────────────── */
  const renderPersonalDetails = () => {
    const fields = [
      { label: "Reg No",          name: "registerNumber",     readOnly: true },
      { label: "Name",            name: "username",           readOnly: true },
      { label: "Student Status",  name: "status",             readOnly: true },
      { label: "Email",           name: "email",              readOnly: true },
      { label: "Course",          name: "course",             readOnly: true },
      { label: "Department Name", name: "departmentName",     readOnly: true },
      { label: "Batch",           name: "batch",              placeholder: "Enter batch" },
      { label: "Semester",        name: "semester",           readOnly: true },
      { label: "Section",         name: "section",            placeholder: "Enter section" },
      { label: "Student Type",    name: "student_type",       type: "select", options: ["Select Student Type", "Day-Scholar", "Hosteller"] },
      { label: "Gender",          name: "gender",             type: "select", options: ["Select Gender", "Female", "Male", "Transgender"] },
      { label: "Date of Birth",   name: "date_of_birth",      type: "date" },
      { label: "Nationality",     name: "nationality",        placeholder: "Enter nationality" },
      { label: "16-Digit Reg No", name: "sixteen_digit_reg_no", placeholder: "Enter 16-digit reg no" },
      { label: "EMIS Number",     name: "emis_number",        placeholder: "Enter emis number" },
      { label: "ABC ID",          name: "abc_id",             placeholder: "Enter abc id" },
      { label: "NAD ID",          name: "nad_id",             placeholder: "Enter nad id" },
      { label: "Seat Type",       name: "seat_type",          type: "select", options: ["Select Seat Type", "Round 1 - Councelling", "Round 2 - Councelling", "Round 3 - Councelling", "Management"] },
      { label: "Admission Quota", name: "admission_quota",    type: "select", options: ["Select Admission Quota", "Government Quota", "Management Quota", "7.5% Government School Quota", "Sports Quota", "PMSSS Quota", "FG Quota"] },
      { label: "First Graduate",  name: "first_graduate",     type: "select", options: ["Select", "Yes", "No"] },
      { label: "Lateral Entry",   name: "lateral_entry",      type: "select", options: ["Select", "No", "Yes"] },
      { label: "Date of Joining", name: "date_of_joining",    type: "date" },
      { label: "Tutor Name",      name: "staffname",          readOnly: true },
      { label: "Tutor Email",     name: "tutorEmail",         readOnly: true },
      { label: "Personal Email",  name: "personal_email",     placeholder: "Enter personal email" },
      { label: "Phone",           name: "personal_phone",     placeholder: "Enter phone" },
      { label: "Parents Phone",   name: "parents_phone",      placeholder: "Enter parents phone" },
      { label: "Address Type",    name: "address_type",       type: "select", options: ["Select Address Type", "Rural", "Urban", "Semi-Urban"] },
      { label: "Present Address",   name: "present_address",    placeholder: "Enter present address" },
      { label: "Permanent Address", name: "permanent_address",  placeholder: "Enter permanent address" },
      { label: "City",            name: "city",               placeholder: "Enter city" },
      { label: "District",        name: "student_district",   placeholder: "Enter district" },
      { label: "State",           name: "student_state",      placeholder: "Enter state" },
      { label: "Pincode",         name: "pincode",            placeholder: "Enter pincode" },
      { label: "Aadhaar Card No", name: "aadhar_card_no",     placeholder: "Enter aadhaar card no" },
      { label: "Blood Group",     name: "blood_group",        type: "select", options: ["Select Blood Group", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { label: "Mother Tongue",   name: "mother_tongue",      placeholder: "Enter mother tongue" },
      { label: "Religion",        name: "religion",           type: "select", options: ["Select Religion", "Hindu", "Muslim", "Christian", "Others"] },
      { label: "Caste",           name: "caste",              type: "select", options: ["Select Caste", "OC", "BC", "MBC", "SC", "ST", "Others"] },
      { label: "Community",       name: "community",          placeholder: "Enter community" },
    ];

    const base = "h-10 w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";

    return (
      <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {fields.map((field, idx) => {
          const disabled = field.readOnly || !isEditing;
          const val = formData[field.name] ?? "";
          const isPlaceholder = !val || (field.type === "select" && (field.options?.[0] === val || !val));
          const tc = isPlaceholder ? "text-gray-400" : "text-gray-900";

          return (
            <div key={idx} className="flex flex-col min-w-0">
              <label className="text-xs font-semibold text-gray-500 mb-1 block truncate">{field.label}</label>
              {field.type === "select" ? (
                <select name={field.name} value={val} onChange={handleInputChange} disabled={disabled}
                  className={`${base} ${tc} ${disabled ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "bg-white border-gray-300"}`}>
                  {field.options.map((opt) => {
                    const isPlaceholderOpt = opt.startsWith("Select") || opt.startsWith("Enter");
                    return <option key={opt} value={isPlaceholderOpt ? "" : opt} className="text-gray-900">{opt}</option>;
                  })}
                </select>
              ) : field.type === "date" ? (
                <input type="date" name={field.name} value={val} onChange={handleInputChange} disabled={disabled}
                  className={`${base} ${tc} ${disabled ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "bg-white border-gray-300"}`} />
              ) : (
                <input type="text" name={field.name} value={val} onChange={handleInputChange}
                  readOnly={disabled} placeholder={field.placeholder || ""}
                  className={`${base} ${tc} ${disabled ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "bg-white border-gray-300"} placeholder-gray-400`} />
              )}
            </div>
          );
        })}
      </form>
    );
  };

  /* ── Family Details ───────────────────────────────────────────────── */
  const renderFamilyDetails = () => {
    const headers = ["Photo", "Relationship", "Name", "Age", "Qualification", "Occupation", "Income", "Phone", "Email"];
    if (isEditing) {
      headers.push("Action");
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-sm" style={{ tableLayout: "fixed", minWidth: 900 }}>
          <colgroup>
            <col style={{ width: "72px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "64px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "160px" }} />
            {isEditing && <col style={{ width: "70px" }} />}
          </colgroup>
          <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
            <tr>
              {headers.map((h) => (
                <th key={h} className="border border-indigo-500 px-2 py-3 text-center text-xs font-semibold tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draftRelations.length === 0 && (
              <tr>
                <td colSpan={isEditing ? 10 : 9} className="text-center py-10 text-gray-400">
                  No family members added. {isEditing && <>Click <strong>Add Relation</strong> to begin.</>}
                </td>
              </tr>
            )}
            {draftRelations.map((relation, index) => {
              const hasPhoto = relation.photo;
              return (
                <tr key={index} className="bg-white hover:bg-indigo-50 transition">
                  {/* Photo */}
                  <td className="border border-gray-200 px-2 py-2 text-center">
                    <div className="flex justify-center">
                      <div
                        className={`relative rounded-full overflow-hidden border-2 border-indigo-300 bg-gray-100 ${isEditing ? "cursor-pointer hover:border-indigo-500 group" : ""} transition`}
                        style={{ width: 52, height: 52 }}
                        onClick={() => isEditing && setCropModalIndex(index)}
                        title={isEditing ? "Click to set photo" : ""}
                      >
                        {hasPhoto ? (
                          <img src={relation.photo} alt="relation" className="w-full h-full object-cover" />
                        ) : (
                          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <circle cx="26" cy="26" r="26" fill="#e0e7ff" />
                            <ellipse cx="26" cy="20" rx="8" ry="9" fill="#a5b4fc" />
                            <path d="M7 47c0-10.493 8.507-19 19-19s19 8.507 19 19" fill="#a5b4fc" />
                          </svg>
                        )}
                        {isEditing && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-full">
                            <FaCamera className="text-white" size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Relationship */}
                  <td className="border border-gray-200 px-2 py-2 text-center">
                    <select
                      value={relation.relationship || ""}
                      onChange={(e) => handleRelationChange(index, "relationship", e.target.value)}
                      disabled={!isEditing}
                      className={`w-full rounded px-2 py-1.5 text-xs text-center border ${isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 cursor-not-allowed"} ${relation.relationship ? "text-gray-900" : "text-gray-400"}`}
                    >
                      <option value="">Select</option>
                      {["Father", "Mother", "Guardian", "Sibling"].map((r) => (
                        <option key={r} value={r} className="text-gray-900">{r}</option>
                      ))}
                    </select>
                  </td>

                  {/* Text columns */}
                  {["name", "age", "qualification", "occupation", "income", "phone", "email"].map((field) => (
                    <td key={field} className="border border-gray-200 px-2 py-2 text-center">
                      <input
                        type="text"
                        value={relation[field] || ""}
                        onChange={(e) => handleRelationChange(index, field, e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? `Enter ${field}` : ""}
                        className={`w-full rounded px-2 py-1.5 text-xs text-center border ${isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 cursor-not-allowed"} ${relation[field] ? "text-gray-900" : "text-gray-400"} placeholder-gray-400 truncate`}
                      />
                    </td>
                  ))}

                  {/* Action - rendered ONLY when isEditing is true */}
                  {isEditing && (
                    <td className="border border-gray-200 px-2 py-2 text-center">
                      <button onClick={() => handleDeleteRelation(index)} title="Delete row"
                        className="mx-auto flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
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
  };

  /* ── Bank Details ─────────────────────────────────────────────────── */
  const renderBankDetails = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Bank Name",      name: "bank_name" },
        { label: "Branch Name",    name: "branch_name" },
        { label: "Address",        name: "bank_address" },
        { label: "Account Number", name: "account_no" },
        { label: "IFSC Code",      name: "ifsc_code" },
        { label: "MICR Code",      name: "micr_code" },
      ].map((field, index) => {
        const val = formData[field.name] || "";
        return (
          <div key={index} className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">{field.label}</label>
            <input type="text" name={field.name} value={val} onChange={handleInputChange}
              readOnly={!isEditing} placeholder={isEditing ? `Enter ${field.label.toLowerCase()}` : ""}
              className={`border rounded px-3 py-2 text-sm ${isEditing ? "bg-white border-gray-400" : "bg-gray-100 border-gray-300 cursor-not-allowed"} ${textColor(val)} placeholder-gray-400`} />
          </div>
        );
      })}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-600 mb-1">Account Type</label>
        {isEditing ? (
          <select name="account_type" value={formData.account_type || ""} onChange={handleInputChange}
            className={`border rounded px-3 py-2 bg-white border-gray-400 text-sm ${textColor(formData.account_type)}`}>
            <option value="">Select Account Type</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        ) : (
          <input type="text" value={formData.account_type || ""} readOnly
            className={`border rounded px-3 py-2 bg-gray-100 border-gray-300 text-sm cursor-not-allowed ${textColor(formData.account_type)}`} />
        )}
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading student details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Student Personal Details
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end mb-6">
        {!isEditing ? (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleEditClick}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition">
            <FaEdit className="inline-block mr-2" /> Edit
          </motion.button>
        ) : (
          <div className="flex space-x-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition">
              <FaSave className="inline-block mr-2" /> Save
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancelClick}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg transition">
              <FaTimes className="inline-block mr-2" /> Cancel
            </motion.button>
            {activeTab === "family" && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddRelation}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition">
                <FaPlus className="inline-block mr-2" /> Add Relation
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-6 mb-6">
        {["personal", "family", "bank"].map((tab) => (
          <motion.button key={tab} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded text-lg font-medium transition ${activeTab === tab ? "bg-gradient-to-r from-indigo-600 to-indigo-600 text-white shadow-lg" : "bg-gray-200 hover:bg-gray-300"}`}>
            {tab === "personal" && "Personal Details"}
            {tab === "family" && "Family Details"}
            {tab === "bank" && "Bank Details"}
          </motion.button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg">
        {activeTab === "personal" && renderPersonalDetails()}
        {activeTab === "family" && renderFamilyDetails()}
        {activeTab === "bank" && renderBankDetails()}
      </motion.div>

      {/* Photo Crop Modal */}
      <AnimatePresence>
        {cropModalIndex !== null && (
          <PhotoCropModal
            existingPhoto={draftRelations[cropModalIndex]?.photo || null}
            onSave={(dataUrl) => handlePhotoSave(cropModalIndex, dataUrl)}
            onCancel={() => setCropModalIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentPersonalDetails;