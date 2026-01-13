import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import loader from "../../assets/GIF/loader.gif";
import coverPattern from "../../assets/images/cover-pattern.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCheck,
  faCalendarDay,
  faCalendarWeek,
  faCalendarAlt,
  faArrowRight,
  faShieldHalved,
  faUsers,
  faHardDrive,
  faFolderOpen,
  faChartLine,
  faHeadset,
  faLock,
  faCrown
} from "@fortawesome/free-solid-svg-icons";

export default function PlanSelectionPage() {
  const currentYear = new Date().getFullYear();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const pendingOrg = localStorage.getItem("pendingOrg");
    const orgSession = localStorage.getItem("orgSession");
    if (pendingOrg) {
      setOrgData(JSON.parse(pendingOrg));
    } else if (orgSession) {
      setOrgData(JSON.parse(orgSession));
    }
  }, []);

  const toastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      icon: faCalendarDay,
      duration: "1 Month",
      price: 99,
      pricePerMonth: 99,
      color: "#6366f1",
      description: "Perfect for short-term projects",
      savings: null,
    },
    {
      id: "quarterly",
      name: "Quarterly",
      icon: faCalendarWeek,
      duration: "3 Months",
      price: 249,
      pricePerMonth: 83,
      color: "#10b981",
      description: "Most popular choice for teams",
      savings: "Save 16%",
      popular: true,
    },
    {
      id: "yearly",
      name: "Yearly",
      icon: faCalendarAlt,
      duration: "12 Months",
      price: 799,
      pricePerMonth: 67,
      color: "#f59e0b",
      description: "Best value for long-term use",
      savings: "Save 32%",
    },
  ];

  // Features included in ALL plans
  const features = [
    { icon: faHardDrive, text: "100 GB Secure Storage" },
    { icon: faUsers, text: "Unlimited Users" },
    { icon: faFolderOpen, text: "Unlimited Projects" },
    { icon: faShieldHalved, text: "256-bit Encryption" },
    { icon: faLock, text: "Role-Based Access Control" },
    { icon: faChartLine, text: "Advanced Analytics" },
    { icon: faHeadset, text: "24/7 Priority Support" },
  ];

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    if (!selectedPlan) {
      toastMsg("Please select a plan to continue", "error");
      return;
    }

    setLoading(true);
    const plan = plans.find((p) => p.id === selectedPlan);

    localStorage.setItem("selectedPlan", JSON.stringify({
      planId: selectedPlan,
      planName: plan.name,
      duration: plan.duration,
      price: plan.price,
      pricePerMonth: plan.pricePerMonth,
    }));

    setTimeout(() => {
      setLoading(false);
      nav("/org/checkout");
    }, 800);
  };

  return (
    <div style={styles.mainContainer}>
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
          <img src={loader} alt="Loading..." style={styles.loaderImg} />
        </div>
      )}

      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <FontAwesomeIcon icon={faBuilding} style={styles.logoIcon} />
            <span style={styles.logoText}>VDR</span>
          </div>

          {orgData && (
            <div style={styles.orgBadge}>
              <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8, fontSize: 14 }} />
              {orgData.organizationName || orgData.email}
            </div>
          )}
        </div>

        {/* Title Section */}
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Choose Your Plan</h1>
          <p style={styles.subtitle}>
            All plans include the same features. Choose the duration that works best for you.
          </p>
        </div>

        {/* Plans Grid */}
        <div style={styles.plansContainer}>
          <div style={styles.plansGrid}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  ...styles.planCard,
                  ...(selectedPlan === plan.id ? styles.planCardSelected : {}),
                  ...(plan.popular ? styles.planCardPopular : {}),
                }}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <div style={styles.popularBadge}>
                    <FontAwesomeIcon icon={faCrown} style={{ marginRight: 6 }} />
                    Most Popular
                  </div>
                )}

                {plan.savings && (
                  <div style={{
                    ...styles.savingsBadge,
                    background: plan.color,
                  }}>
                    {plan.savings}
                  </div>
                )}

                <div style={styles.planHeader}>
                  <div style={{ ...styles.planIconWrapper, background: `${plan.color}15` }}>
                    <FontAwesomeIcon icon={plan.icon} style={{ ...styles.planIcon, color: plan.color }} />
                  </div>
                  <h3 style={styles.planName}>{plan.name}</h3>
                  <p style={styles.planDuration}>{plan.duration}</p>
                </div>

                <div style={styles.priceSection}>
                  <div style={styles.priceWrapper}>
                    <span style={styles.currency}>₹</span>
                    <span style={styles.price}>{plan.price}</span>
                  </div>
                  <p style={styles.pricePerMonth}>
                    ₹{plan.pricePerMonth}/month
                  </p>
                </div>

                <p style={styles.planDescription}>{plan.description}</p>

                <button
                  style={{
                    ...styles.selectBtn,
                    ...(selectedPlan === plan.id
                      ? { background: plan.color, color: "#fff", borderColor: plan.color }
                      : {}),
                  }}
                >
                  {selectedPlan === plan.id ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />
                      Selected
                    </>
                  ) : (
                    "Select Plan"
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div style={styles.featuresSection}>
            <h3 style={styles.featuresTitle}>All Plans Include:</h3>
            <div style={styles.featuresGrid}>
              {features.map((feature, idx) => (
                <div key={idx} style={styles.featureItem}>
                  <div style={styles.featureIconWrapper}>
                    <FontAwesomeIcon icon={feature.icon} style={styles.featureIcon} />
                  </div>
                  <span style={styles.featureText}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div style={styles.continueSection}>
          <button
            style={{
              ...styles.continueBtn,
              opacity: selectedPlan ? 1 : 0.6,
            }}
            onClick={handleContinue}
            disabled={!selectedPlan}
          >
            Continue to Payment
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
          </button>
          <p style={styles.guaranteeText}>
            <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 8 }} />
            30-day money-back guarantee
          </p>
        </div>
      </div>

      <footer style={styles.copyright}>© {currentYear} TechJar VDR. All rights reserved.</footer>
    </div>
  );
}

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflow: "auto",
    backgroundImage: `linear-gradient(135deg, rgba(30,58,138,0.97), rgba(15,118,110,0.95)), url(${coverPattern})`,
    backgroundRepeat: "repeat",
    backgroundSize: "cover, contain",
    backgroundBlendMode: "overlay",
    backgroundAttachment: "fixed",
    padding: "30px 20px 60px",
  },
  circleOne: {
    position: "fixed",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
    top: "-10%",
    left: "-10%",
    filter: "blur(80px)",
    zIndex: 0,
  },
  circleTwo: {
    position: "fixed",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.08)",
    bottom: "5%",
    right: "-5%",
    filter: "blur(60px)",
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
    background: "rgba(0, 0, 0, 0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },
  loaderImg: {
    width: 100,
    height: 100,
    borderRadius: "50%",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: "1000px",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "24px",
    color: "#10b981",
  },
  logoText: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "2px",
  },
  orgBadge: {
    display: "flex",
    alignItems: "center",
    padding: "10px 18px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "30px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    backdropFilter: "blur(10px)",
  },
  titleSection: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "12px",
  },
  subtitle: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.8)",
    maxWidth: "500px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  plansContainer: {
    background: "#fff",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    marginBottom: "30px",
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    marginBottom: "40px",
  },
  planCard: {
    background: "#fafafa",
    borderRadius: "16px",
    padding: "28px 24px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "2px solid #e5e7eb",
    position: "relative",
    textAlign: "center",
  },
  planCardSelected: {
    border: "2px solid #10b981",
    background: "#f0fdf4",
    transform: "scale(1.02)",
    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)",
  },
  planCardPopular: {
    border: "2px solid #10b981",
  },
  popularBadge: {
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
    whiteSpace: "nowrap",
  },
  savingsBadge: {
    position: "absolute",
    top: "16px",
    right: "16px",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },
  planHeader: {
    marginBottom: "20px",
  },
  planIconWrapper: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  planIcon: {
    fontSize: "26px",
  },
  planName: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "4px",
  },
  planDuration: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
  },
  priceSection: {
    marginBottom: "16px",
  },
  priceWrapper: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "2px",
  },
  currency: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#374151",
  },
  price: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: 1,
  },
  pricePerMonth: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  planDescription: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "20px",
    lineHeight: 1.4,
  },
  selectBtn: {
    width: "100%",
    padding: "12px 20px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "#fff",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  featuresSection: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "30px",
  },
  featuresTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: "24px",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#f9fafb",
    borderRadius: "10px",
  },
  featureIconWrapper: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureIcon: {
    fontSize: "14px",
    color: "#10b981",
  },
  featureText: {
    fontSize: "13px",
    color: "#374151",
    fontWeight: "500",
  },
  continueSection: {
    textAlign: "center",
  },
  continueBtn: {
    padding: "16px 48px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
    display: "inline-flex",
    alignItems: "center",
  },
  guaranteeText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  copyright: {
    position: "absolute",
    bottom: "16px",
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: "13px",
    zIndex: 1,
  },
};
