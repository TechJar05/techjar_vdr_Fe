import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaUpload, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Button from "../../components/Style/Button";
import Toastbar from "../../components/Style/Toastbar";
import apiRequest from "../../utils/apiClient";
import { API_BASE_URL } from "../../config/apiConfig";

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "success", message: "" }), 3000);
  };

  return (
    <div style={styles.container}>
      {toast.show && <Toastbar message={toast.message} type={toast.type} />}
      
      <div style={styles.header}>
        <h2 style={styles.title}>Settings</h2>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "tag" && styles.activeTab) }}
          onClick={() => setActiveTab("tag")}
        >
          Tag
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "profile" && styles.activeTab) }}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "resetPassword" && styles.activeTab) }}
          onClick={() => setActiveTab("resetPassword")}
        >
          Reset Password
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === "profile" && <ProfileSection showToast={showToast} />}
        {activeTab === "resetPassword" && <ResetPasswordSection showToast={showToast} />}
        {activeTab === "tag" && <TagSection showToast={showToast} />}
      </div>
    </div>
  );
};

// Profile Section
const ProfileSection = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    contactNo: "",
    expiryDate: "",
    logoUrl: null,
    availableSpaceMB: 2048,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/settings/profile");
      setProfile(data);
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      showToast(err.message || "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch(`${API_BASE_URL}/settings/profile/logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setProfile((prev) => ({ ...prev, logoUrl: data.logoUrl }));
      setLogoPreview(data.logoUrl);
      showToast("Logo uploaded successfully", "success");
    } catch (err) {
      console.error("Logo upload failed", err);
      showToast(err.message || "Logo upload failed", "error");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdate = async () => {
    if (!profile.firstName || !profile.lastName || !profile.email || !profile.companyName) {
      showToast("Please fill all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      await apiRequest("/settings/profile", {
        method: "PUT",
        body: {
          companyName: profile.companyName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          address: profile.address,
          contactNo: profile.contactNo,
          expiryDate: profile.expiryDate || null,
        },
      });
      showToast("Profile updated successfully", "success");
    } catch (err) {
      console.error("Update failed", err);
      showToast(err.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    const newEmail = prompt("Enter new email address:");
    if (!newEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    apiRequest("/settings/profile/change-email", {
      method: "POST",
      body: { newEmail },
    })
      .then(() => {
        showToast("Email change request sent. Please check your email.", "success");
        setProfile((prev) => ({ ...prev, email: newEmail }));
      })
      .catch((err) => {
        console.error("Change email failed", err);
        showToast(err.message || "Failed to change email", "error");
      });
  };

  return (
    <div style={styles.section}>
      <div style={styles.profileGrid}>
        <div style={styles.profileLeft}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Company Name<span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={profile.companyName}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter company name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              First Name<span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={profile.firstName}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter first name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Last Name<span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={profile.lastName}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter last name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Email<span style={styles.required}>*</span>
            </label>
            <div style={styles.emailRow}>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter email"
                readOnly
              />
              <button
                type="button"
                onClick={handleChangeEmail}
                style={styles.changeEmailBtn}
              >
                Change Email
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Address</label>
            <input
              type="text"
              name="address"
              value={profile.address}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter address"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={profile.expiryDate || ""}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.profileRight}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Upload Logo</label>
            <div style={styles.logoContainer}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={styles.logoPreview} />
              ) : (
                <div style={styles.logoPlaceholder}>
                  <div style={styles.logoPlaceholderText}>TJ</div>
                  <div style={styles.logoPlaceholderSubtext}>TechJar</div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: "none" }}
            />
            <Button
              text="Upload"
              icon={<FaUpload />}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: "10px" }}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contact No</label>
            <input
              type="tel"
              name="contactNo"
              value={profile.contactNo}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter contact number"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Available Space (in MB)</label>
            <input
              type="number"
              name="availableSpaceMB"
              value={profile.availableSpaceMB}
              readOnly
              style={{ ...styles.input, backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
            />
          </div>
        </div>
      </div>

      <div style={styles.updateButtonContainer}>
        <Button
          text={loading ? "Updating..." : "Update"}
          onClick={handleUpdate}
          disabled={loading}
          style={{ padding: "10px 24px", fontSize: "16px" }}
        />
      </div>
    </div>
  );
};

// Reset Password Section
const ResetPasswordSection = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUpdate = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      showToast("All password fields are required", "error");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast("New password and confirm password do not match", "error");
      return;
    }

    if (passwords.newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }

    try {
      setLoading(true);
      await apiRequest("/settings/reset-password", {
        method: "POST",
        body: passwords,
      });
      showToast("Password updated successfully", "success");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Password reset failed", err);
      showToast(err.message || "Password reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Reset Password</h3>

      <div style={styles.passwordForm}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Current Password<span style={styles.required}>*</span>
          </label>
          <div style={styles.passwordInputWrapper}>
            <input
              type={showPasswords.current ? "text" : "password"}
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handleInputChange}
              style={styles.passwordInput}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              style={styles.eyeButton}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            New Password<span style={styles.required}>*</span>
          </label>
          <div style={styles.passwordInputWrapper}>
            <input
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleInputChange}
              style={styles.passwordInput}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              style={styles.eyeButton}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Confirm Password<span style={styles.required}>*</span>
          </label>
          <div style={styles.passwordInputWrapper}>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleInputChange}
              style={styles.passwordInput}
              placeholder="Enter confirm password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              style={styles.eyeButton}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.updateButtonContainer}>
        <Button
          text={loading ? "Updating..." : "Update"}
          onClick={handleUpdate}
          disabled={loading}
          style={{ padding: "10px 24px", fontSize: "16px" }}
        />
      </div>
    </div>
  );
};

// Tag Section
const TagSection = ({ showToast }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({ name: "", color: "#10b981" });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/settings/tags");
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tags", err);
      showToast(err.message || "Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!tagForm.name.trim()) {
      showToast("Tag name is required", "error");
      return;
    }

    try {
      setLoading(true);
      if (editingTag) {
        await apiRequest(`/settings/tags/${editingTag.ID}`, {
          method: "PUT",
          body: tagForm,
        });
        showToast("Tag updated successfully", "success");
      } else {
        await apiRequest("/settings/tags", {
          method: "POST",
          body: tagForm,
        });
        showToast("Tag created successfully", "success");
      }
      setShowCreateModal(false);
      setEditingTag(null);
      setTagForm({ name: "", color: "#10b981" });
      fetchTags();
    } catch (err) {
      console.error("Tag operation failed", err);
      showToast(err.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.NAME, color: tag.COLOR || "#10b981" });
    setShowCreateModal(true);
  };

  const handleDeleteTag = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;

    try {
      setLoading(true);
      await apiRequest(`/settings/tags/${id}`, { method: "DELETE" });
      showToast("Tag deleted successfully", "success");
      fetchTags();
    } catch (err) {
      console.error("Delete failed", err);
      showToast(err.message || "Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.tagHeader}>
        <h3 style={styles.sectionTitle}>Tags</h3>
        <Button
          text="Create Tag"
          icon={<FaPlus />}
          onClick={() => {
            setEditingTag(null);
            setTagForm({ name: "", color: "#10b981" });
            setShowCreateModal(true);
          }}
        />
      </div>

      {loading && tags.length === 0 ? (
        <div style={styles.loading}>Loading tags...</div>
      ) : tags.length === 0 ? (
        <div style={styles.emptyState}>No tags created yet. Create your first tag!</div>
      ) : (
        <div style={styles.tagsGrid}>
          {tags.map((tag) => (
            <div key={tag.ID} style={styles.tagCard}>
              <div
                style={{
                  ...styles.tagColorIndicator,
                  backgroundColor: tag.COLOR || "#10b981",
                }}
              />
              <div style={styles.tagContent}>
                <div style={styles.tagName}>{tag.NAME}</div>
                <div style={styles.tagActions}>
                  <button
                    onClick={() => handleEditTag(tag)}
                    style={styles.tagActionBtn}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.ID)}
                    style={{ ...styles.tagActionBtn, color: "#dc2626" }}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <TagModal
          tagForm={tagForm}
          setTagForm={setTagForm}
          editingTag={editingTag}
          onSave={handleCreateTag}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingTag(null);
            setTagForm({ name: "", color: "#10b981" });
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

// Tag Modal Component
const TagModal = ({ tagForm, setTagForm, editingTag, onSave, onCancel, loading }) => {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>{editingTag ? "Edit Tag" : "Create Tag"}</h3>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Tag Name<span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={tagForm.name}
            onChange={(e) => setTagForm((prev) => ({ ...prev, name: e.target.value }))}
            style={styles.input}
            placeholder="Enter tag name"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Color</label>
          <input
            type="color"
            value={tagForm.color}
            onChange={(e) => setTagForm((prev) => ({ ...prev, color: e.target.value }))}
            style={styles.colorInput}
          />
        </div>
        <div style={styles.modalActions}>
          <Button text="Cancel" onClick={onCancel} style={{ background: "#f3f4f6", color: "#374151" }} />
          <Button
            text={loading ? "Saving..." : editingTag ? "Update" : "Create"}
            onClick={onSave}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Inter, Roboto, system-ui, Arial",
    background: "#f3f4f6",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    borderBottom: "2px solid #e5e7eb",
  },
  tab: {
    padding: "12px 24px",
    background: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
    transition: "all 0.2s",
  },
  activeTab: {
    color: "#10b981",
    borderBottomColor: "#10b981",
  },
  content: {
    background: "#fff",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  section: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "20px",
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginBottom: "30px",
  },
  profileLeft: {},
  profileRight: {},
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  required: {
    color: "#dc2626",
    marginLeft: "4px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  emailRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  changeEmailBtn: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  logoContainer: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    overflow: "hidden",
    marginBottom: "10px",
    border: "2px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoPreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  logoPlaceholder: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  logoPlaceholderText: {
    fontSize: "24px",
    fontWeight: "700",
  },
  logoPlaceholderSubtext: {
    fontSize: "12px",
    marginTop: "4px",
  },
  updateButtonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "30px",
  },
  passwordForm: {
    maxWidth: "500px",
  },
  passwordInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "10px 40px 10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  tagsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  },
  tagCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "box-shadow 0.2s",
  },
  tagColorIndicator: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    flexShrink: 0,
  },
  tagContent: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#111827",
  },
  tagActions: {
    display: "flex",
    gap: "8px",
  },
  tagActionBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px dashed #d1d5db",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "20px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  colorInput: {
    width: "60px",
    height: "40px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default SettingPage;
