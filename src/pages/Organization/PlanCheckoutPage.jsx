import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlobalInputStyle from "../../components/Style/GlobalInputStyle";
import loader from "../../assets/GIF/loader.gif";
import coverPattern from "../../assets/images/cover-pattern.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCreditCard,
  faLock,
  faCheck,
  faShieldHalved,
  faArrowLeft,
  faCheckCircle,
  faCalendarAlt,
  faReceipt,
  faTag,
  faUserPlus
} from "@fortawesome/free-solid-svg-icons";

export default function PlanCheckoutPage() {
  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    couponCode: "",
  });
  const [planData, setPlanData] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const selectedPlan = localStorage.getItem("selectedPlan");
    const pendingOrg = localStorage.getItem("pendingOrg");
    const orgSession = localStorage.getItem("orgSession");

    if (selectedPlan) {
      setPlanData(JSON.parse(selectedPlan));
    } else {
      nav("/org/plans");
    }

    if (pendingOrg) {
      setOrgData(JSON.parse(pendingOrg));
    } else if (orgSession) {
      setOrgData(JSON.parse(orgSession));
    }
  }, [nav]);

  const toastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "cardNumber") {
      value = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
      if (value.length > 19) return;
    }

    if (name === "expiry") {
      value = value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }

    if (name === "cvv" && value.length > 4) return;

    setFormData({ ...formData, [name]: value });
  };

  const applyCoupon = () => {
    if (!formData.couponCode.trim()) {
      toastMsg("Please enter a coupon code", "error");
      return;
    }

    const validCoupons = {
      "WELCOME20": { discount: 20, type: "percent" },
      "SAVE50": { discount: 50, type: "fixed" },
      "VDR2024": { discount: 15, type: "percent" },
    };

    const coupon = validCoupons[formData.couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon({ code: formData.couponCode.toUpperCase(), ...coupon });
      toastMsg(`Coupon applied! ${coupon.type === "percent" ? `${coupon.discount}% off` : `$${coupon.discount} off`}`);
    } else {
      toastMsg("Invalid coupon code", "error");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setFormData({ ...formData, couponCode: "" });
    toastMsg("Coupon removed");
  };

  const calculateTotal = () => {
    if (!planData) return { subtotal: 0, discount: 0, total: 0 };

    let subtotal = planData.price;
    let discount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        discount = (subtotal * appliedCoupon.discount) / 100;
      } else {
        discount = Math.min(appliedCoupon.discount, subtotal);
      }
    }

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: (subtotal - discount).toFixed(2),
    };
  };

  const validateForm = () => {
    if (!formData.cardName.trim()) {
      toastMsg("Cardholder name is required", "error");
      return false;
    }
    if (formData.cardNumber.replace(/\s/g, "").length < 16) {
      toastMsg("Please enter a valid card number", "error");
      return false;
    }
    if (formData.expiry.length < 5) {
      toastMsg("Please enter a valid expiry date", "error");
      return false;
    }
    if (formData.cvv.length < 3) {
      toastMsg("Please enter a valid CVV", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setPaymentSuccess(true);

      // Store organization as active
      localStorage.setItem("activeOrg", JSON.stringify({
        ...orgData,
        plan: planData,
        subscriptionDate: new Date().toISOString(),
        isActive: true,
      }));

      // Clean up temp data
      localStorage.removeItem("pendingOrg");
      localStorage.removeItem("selectedPlan");
      localStorage.removeItem("orgSession");
    }, 2500);
  };

  const handleCreateAdmin = () => {
    // Navigate to registration page for creating admin
    nav("/register");
  };

  const totals = calculateTotal();

  if (paymentSuccess) {
    return (
      <div style={styles.mainContainer}>
        <div style={styles.circleOne} />
        <div style={styles.circleTwo} />

        <div style={styles.successContainer}>
          <div style={styles.successIconWrapper}>
            <FontAwesomeIcon icon={faCheckCircle} style={styles.successIcon} />
          </div>
          <h1 style={styles.successTitle}>Payment Successful!</h1>
          <p style={styles.successMessage}>
            Your organization is now set up. Create an admin account to start managing your virtual data room.
          </p>

          <div style={styles.successDetails}>
            <div style={styles.successDetailItem}>
              <span style={styles.successDetailLabel}>Organization</span>
              <span style={styles.successDetailValue}>
                {orgData?.organizationName || orgData?.email}
              </span>
            </div>
            <div style={styles.successDetailItem}>
              <span style={styles.successDetailLabel}>Plan</span>
              <span style={styles.successDetailValue}>{planData?.planName}</span>
            </div>
            <div style={styles.successDetailItem}>
              <span style={styles.successDetailLabel}>Duration</span>
              <span style={styles.successDetailValue}>{planData?.duration}</span>
            </div>
            <div style={{ ...styles.successDetailItem, borderBottom: "none" }}>
              <span style={styles.successDetailLabel}>Amount Paid</span>
              <span style={styles.successDetailValue}>${totals.total}</span>
            </div>
          </div>

          <div style={styles.nextStepsSection}>
            <h3 style={styles.nextStepsTitle}>Next Steps</h3>
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>1</div>
              <div>
                <p style={styles.stepTitle}>Create Admin Account</p>
                <p style={styles.stepDesc}>Set up your first admin to manage the organization</p>
              </div>
            </div>
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>2</div>
              <div>
                <p style={styles.stepTitle}>Invite Team Members</p>
                <p style={styles.stepDesc}>Add users and admins to collaborate</p>
              </div>
            </div>
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>3</div>
              <div>
                <p style={styles.stepTitle}>Start Using VDR</p>
                <p style={styles.stepDesc}>Create projects and upload documents</p>
              </div>
            </div>
          </div>

          <button style={styles.successBtn} onClick={handleCreateAdmin}>
            <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 10 }} />
            Create Admin Account
          </button>

          <p style={styles.successNote}>
            A confirmation email has been sent to {orgData?.email}
          </p>
        </div>

        <footer style={styles.copyright}>© 2024 VDR. All rights reserved.</footer>
      </div>
    );
  }

  return (
    <div style={styles.mainContainer}>
      <GlobalInputStyle />
      <div style={styles.circleOne} />
      <div style={styles.circleTwo} />

      {toast.message && (
        <div style={{
          ...styles.toast,
          background: toast.type === "error" ? "#ef4444" : "#10b981"
        }}>
          {toast.message}
        </div>
      )}

      {loading && (
        <div style={styles.loaderOverlay}>
          <div style={styles.loaderContent}>
            <img src={loader} alt="Processing..." style={styles.loaderImg} />
            <p style={styles.loaderText}>Processing your payment...</p>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Left Side - Payment Form */}
        <div style={styles.leftSection}>
          <div style={styles.formHeader}>
            <button style={styles.backBtn} onClick={() => nav("/org/plans")}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Plans
            </button>
            <div style={styles.logoWrapper}>
              <FontAwesomeIcon icon={faBuilding} style={styles.logoIcon} />
              <span style={styles.logoText}>VDR</span>
            </div>
          </div>

          <h2 style={styles.formTitle}>Payment Details</h2>
          <p style={styles.formSubtitle}>Complete your purchase to activate your subscription</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.cardIcons}>
              <FontAwesomeIcon icon={faCreditCard} style={styles.cardIcon} />
              <span style={styles.cardText}>We accept all major credit cards</span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Cardholder Name</label>
              <input
                type="text"
                name="cardName"
                placeholder="Name on card"
                value={formData.cardName}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <FontAwesomeIcon icon={faCreditCard} style={styles.labelIcon} />
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroupHalf}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={styles.labelIcon} />
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiry"
                  placeholder="MM/YY"
                  value={formData.expiry}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroupHalf}>
                <label style={styles.label}>
                  <FontAwesomeIcon icon={faLock} style={styles.labelIcon} />
                  CVV
                </label>
                <input
                  type="password"
                  name="cvv"
                  placeholder="***"
                  value={formData.cvv}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.couponSection}>
              <label style={styles.label}>
                <FontAwesomeIcon icon={faTag} style={styles.labelIcon} />
                Coupon Code
              </label>
              {appliedCoupon ? (
                <div style={styles.appliedCoupon}>
                  <span style={styles.couponText}>
                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8, color: "#10b981" }} />
                    {appliedCoupon.code} applied
                  </span>
                  <button type="button" style={styles.removeCouponBtn} onClick={removeCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <div style={styles.couponInputRow}>
                  <input
                    type="text"
                    name="couponCode"
                    placeholder="Enter coupon code"
                    value={formData.couponCode}
                    onChange={handleChange}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button type="button" style={styles.applyCouponBtn} onClick={applyCoupon}>
                    Apply
                  </button>
                </div>
              )}
            </div>

            <button type="submit" style={styles.payBtn}>
              <FontAwesomeIcon icon={faLock} style={{ marginRight: 10 }} />
              Pay ${totals.total}
            </button>

            <div style={styles.securityNote}>
              <FontAwesomeIcon icon={faShieldHalved} style={styles.securityIcon} />
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>
          </form>
        </div>

        {/* Right Side - Order Summary */}
        <div style={styles.rightSection}>
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>
              <FontAwesomeIcon icon={faReceipt} style={{ marginRight: 10 }} />
              Order Summary
            </h3>

            {orgData && (
              <div style={styles.orgInfo}>
                <FontAwesomeIcon icon={faBuilding} style={styles.orgIcon} />
                <span>{orgData.organizationName || orgData.email}</span>
              </div>
            )}

            {planData && (
              <>
                <div style={styles.planInfo}>
                  <div style={styles.planRow}>
                    <span style={styles.planLabel}>{planData.planName} Plan</span>
                    <span style={styles.planPrice}>${planData.price}</span>
                  </div>
                  <div style={styles.billingInfo}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 8 }} />
                    {planData.duration}
                  </div>
                  {planData.pricePerMonth && (
                    <div style={styles.perMonthInfo}>
                      ${planData.pricePerMonth}/month
                    </div>
                  )}
                </div>

                <div style={styles.divider} />

                <div style={styles.totalsSection}>
                  <div style={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>${totals.subtotal}</span>
                  </div>
                  {appliedCoupon && (
                    <div style={{ ...styles.totalRow, color: "#10b981" }}>
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-${totals.discount}</span>
                    </div>
                  )}
                  <div style={styles.totalRowFinal}>
                    <span>Total</span>
                    <span>${totals.total}</span>
                  </div>
                </div>
              </>
            )}

            <div style={styles.featuresList}>
              <h4 style={styles.featuresTitle}>What's included:</h4>
              <div style={styles.featureItem}>
                <FontAwesomeIcon icon={faCheck} style={styles.featureCheck} />
                <span>100 GB Secure Storage</span>
              </div>
              <div style={styles.featureItem}>
                <FontAwesomeIcon icon={faCheck} style={styles.featureCheck} />
                <span>Unlimited Users</span>
              </div>
              <div style={styles.featureItem}>
                <FontAwesomeIcon icon={faCheck} style={styles.featureCheck} />
                <span>24/7 Priority Support</span>
              </div>
              <div style={styles.featureItem}>
                <FontAwesomeIcon icon={faCheck} style={styles.featureCheck} />
                <span>30-day Money Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={styles.copyright}>© 2024 VDR. All rights reserved.</footer>
    </div>
  );
}

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    backgroundImage: `linear-gradient(135deg, rgba(30,58,138,0.97), rgba(15,118,110,0.95)), url(${coverPattern})`,
    backgroundRepeat: "repeat",
    backgroundSize: "cover, contain",
    backgroundBlendMode: "overlay",
    backgroundAttachment: "fixed",
    padding: "30px 20px",
  },
  circleOne: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    top: "-5%",
    left: "-5%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  circleTwo: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.08)",
    bottom: "10%",
    right: "5%",
    filter: "blur(50px)",
    zIndex: 0,
  },
  toast: {
    position: "fixed",
    top: 24,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 10,
    zIndex: 3000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    fontSize: 14,
    fontWeight: 500,
  },
  loaderOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(6px)",
  },
  loaderContent: {
    textAlign: "center",
  },
  loaderImg: {
    width: 100,
    height: 100,
    borderRadius: "50%",
  },
  loaderText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
    fontWeight: 500,
  },
  container: {
    display: "flex",
    width: "90%",
    maxWidth: "1000px",
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    zIndex: 1,
  },
  leftSection: {
    width: "58%",
    padding: "40px",
    background: "#fff",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "14px",
    cursor: "pointer",
    padding: "8px 0",
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoIcon: {
    fontSize: "20px",
    color: "#10b981",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e3a8a",
    letterSpacing: "1px",
  },
  formTitle: {
    fontSize: "26px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  cardIcons: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  cardIcon: {
    fontSize: "28px",
    color: "#10b981",
  },
  cardText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  inputGroupHalf: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  inputRow: {
    display: "flex",
    gap: "16px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  labelIcon: {
    fontSize: "12px",
    color: "#6b7280",
  },
  input: {
    padding: "14px 16px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.2s ease",
    outline: "none",
    background: "#fafafa",
  },
  couponSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  couponInputRow: {
    display: "flex",
    gap: "10px",
  },
  applyCouponBtn: {
    padding: "14px 20px",
    background: "#1e3a8a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  appliedCoupon: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#ecfdf5",
    borderRadius: "10px",
    border: "1px solid #10b981",
  },
  couponText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#065f46",
  },
  removeCouponBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
  },
  payBtn: {
    padding: "16px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
    marginTop: "8px",
  },
  securityNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#6b7280",
  },
  securityIcon: {
    color: "#10b981",
  },
  rightSection: {
    width: "42%",
    background: "linear-gradient(180deg, #1e3a8a 0%, #0f766e 100%)",
    padding: "40px 30px",
  },
  summaryCard: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "28px",
    backdropFilter: "blur(10px)",
  },
  summaryTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
  },
  orgInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    marginBottom: "20px",
    color: "#fff",
    fontSize: "14px",
  },
  orgIcon: {
    color: "#10b981",
  },
  planInfo: {
    marginBottom: "20px",
  },
  planRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  planLabel: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  planPrice: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
  },
  billingInfo: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
  },
  perMonthInfo: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    marginTop: "4px",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.2)",
    margin: "20px 0",
  },
  totalsSection: {
    marginBottom: "20px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "10px",
  },
  totalRowFinal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.2)",
  },
  featuresList: {
    marginTop: "24px",
  },
  featuresTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "12px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "10px",
  },
  featureCheck: {
    color: "#10b981",
    fontSize: "12px",
  },
  copyright: {
    position: "absolute",
    bottom: "16px",
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: "13px",
    zIndex: 1,
  },
  // Success State Styles
  successContainer: {
    background: "#fff",
    borderRadius: "24px",
    padding: "50px 45px",
    textAlign: "center",
    maxWidth: "520px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    zIndex: 1,
  },
  successIconWrapper: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)",
  },
  successIcon: {
    fontSize: "45px",
    color: "#10b981",
  },
  successTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "12px",
  },
  successMessage: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  successDetails: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "24px",
    textAlign: "left",
  },
  successDetailItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  successDetailLabel: {
    fontSize: "13px",
    color: "#6b7280",
  },
  successDetailValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
  },
  nextStepsSection: {
    background: "#f0fdf4",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    textAlign: "left",
  },
  nextStepsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#065f46",
    marginBottom: "16px",
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  stepNumber: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#10b981",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#065f46",
    marginBottom: "2px",
  },
  stepDesc: {
    fontSize: "12px",
    color: "#6b7280",
  },
  successBtn: {
    padding: "14px 36px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
  },
  successNote: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#9ca3af",
  },
};
