import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import { colors, radius, shadow } from "../styles/theme";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [cif, setCif] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [verificationFile, setVerificationFile] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const navigate = useNavigate();

  const showNotification = (msg, type = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3500);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported.", "error");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setLocation(data.display_name || "Detected location");
          showNotification("Location detected!");
        } catch (error) {
          showNotification("Error getting exact address.", "error");
        }

        setLoadingLocation(false);
      },
      () => {
        showNotification("Access to location denied.", "error");
        setLoadingLocation(false);
      }
    );
  };

  const geocodeManualAddress = async () => {
    let finalLat = coords.lat;
    let finalLng = coords.lng;

    if (userType === "organization" && (!finalLat || !finalLng) && location.trim()) {
      try {
        const query = encodeURIComponent(`${location}, Iasi, Romania`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
        );
        const data = await res.json();

        if (data && data.length > 0) {
          finalLat = parseFloat(data[0].lat);
          finalLng = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }

    return { finalLat, finalLng };
  };

  const handleExtractFromDocument = async () => {
      if (!verificationFile) {
        showNotification("Please upload a document first.", "error");
        return;
      }

      try {
        setExtracting(true);

        const formData = new FormData();
        formData.append("file", verificationFile);

        const response = await fetch("http://127.0.0.1:8000/verification/extract-document", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          showNotification(data.detail || "Could not extract data.", "error");
          return;
        }

        if (data.document_type_guess === "fiscal_attestation_certificate") {
          showNotification(
            "This looks like a fiscal attestation certificate, not a fiscal registration certificate.",
            "error"
          );
          return;
        }

        if (data.document_type_guess === "trade_registry_certificate") {
          showNotification(
            "This looks like a trade registry document. Please upload the fiscal registration certificate.",
            "error"
          );
          return;
        }

        if (data.organization_name) {
          setOrgName(data.organization_name);
        }

        if (data.cif) {
          setCif(data.cif);
        }

        if (data.location) {
          setLocation(data.location);
        }

        showNotification("Document processed successfully!");
      } catch (error) {
        console.error("OCR error:", error);
        showNotification("OCR extraction failed.", "error");
      } finally {
        setExtracting(false);
      }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showNotification("Please fill in login details.", "error");
      return;
    }

    if (userType === "user" && !fullName.trim()) {
      showNotification("Please enter your full name.", "error");
      return;
    }

    if (userType === "organization") {
      if (!orgName.trim()) {
        showNotification("Please enter the organization name.", "error");
        return;
      }

      if (!location.trim()) {
        showNotification("Please enter the organization address.", "error");
        return;
      }

      if (!cif.trim()) {
        showNotification("Please enter the organization CIF.", "error");
        return;
      }
    }

    setSubmitting(true);

    const { finalLat, finalLng } = await geocodeManualAddress();

    try {
      const registerPayload = {
        email,
        password,
        full_name: userType === "user" ? fullName : null,
        user_type: userType,
        organization_name: userType === "organization" ? orgName : null,
        location: userType === "organization" ? location : null,
        lat: userType === "organization" ? finalLat : null,
        lng: userType === "organization" ? finalLng : null,
        cif: userType === "organization" ? cif : null,
      };

      const { response, data } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(registerPayload),
      });

      if (!response.ok) {
        showNotification(data.detail || "Registration error", "error");
        setSubmitting(false);
        return;
      }

      if (userType === "organization") {
        try {
          const { response: verifyResponse, data: verifyData } = await apiFetch(
            "/verification/organization",
            {
              method: "POST",
              body: JSON.stringify({
                email,
                organization_name: orgName,
                cif,
              }),
            }
          );

          if (verifyResponse.ok) {
            if (verifyData.status === "verified") {
              showNotification("Organization account created and verified!");
            } else if (verifyData.status === "pending") {
              showNotification("Account created. Verification is pending.");
            } else {
              showNotification("Account created. Verification status updated.");
            }
          } else {
            showNotification("Account created, but verification failed.", "error");
          }
        } catch (verificationError) {
          console.error("Verification error:", verificationError);
          showNotification("Account created, but verification could not be completed.", "error");
        }
      } else {
        showNotification("Account created successfully!");
      }

      setTimeout(() => navigate("/login"), 2200);
    } catch (error) {
      showNotification("Server connection error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        backgroundColor: colors.bg,
        position: "relative",
      }}
    >
      {notification.message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            padding: "14px 28px",
            borderRadius: radius.lg,
            background: notification.type === "error" ? colors.danger : colors.blueDark,
            color: colors.white,
            fontWeight: "600",
            boxShadow: shadow.card,
            border: `1px solid ${colors.border}`,
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s",
          }}
        >
          {notification.type === "error" ? "✕" : "✓"} {notification.message}
        </div>
      )}

      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "40px",
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          boxShadow: shadow.card,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              color: colors.text,
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Welcome!
          </h2>
          <p style={{ color: colors.muted, marginTop: "6px", fontSize: 15 }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <div
            style={{
              display: "flex",
              background: colors.blueLight,
              padding: "6px",
              borderRadius: radius.md,
              marginBottom: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => setUserType("user")}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: radius.sm,
                backgroundColor: userType === "user" ? colors.white : "transparent",
                color: userType === "user" ? colors.blueDark : colors.muted,
                fontWeight: "700",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              User
            </button>

            <button
              type="button"
              onClick={() => setUserType("organization")}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: radius.sm,
                backgroundColor: userType === "organization" ? colors.white : "transparent",
                color: userType === "organization" ? colors.blueDark : colors.muted,
                fontWeight: "700",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              Organization
            </button>
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="ana@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {userType === "user" && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Ana Popescu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {userType === "organization" && (
            <>
              <div>
                <label style={labelStyle}>Organization Name</label>
                <input
                  type="text"
                  placeholder="NGO Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>CIF</label>
                <input
                  type="text"
                  placeholder="e.g. 12345678"
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input
                  type="text"
                  placeholder="Enter address or use GPS"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  style={inputStyle}
                />



                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={loadingLocation}
                  style={secondaryButtonStyle}
                >
                  {loadingLocation ? "Detecting..." : "Use current location"}
                </button>
              </div>

              <div>
              <label style={labelStyle}>Fiscal registration certificate</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setVerificationFile(e.target.files[0])}
                style={inputStyle}
              />

              <button
                type="button"
                onClick={handleExtractFromDocument}
                disabled={extracting}
                style={secondaryButtonStyle}
              >
                {extracting ? "Extracting..." : "Auto-fill from document"}
              </button>
            </div>
            </>
          )}

          <button type="submit" style={primaryButtonStyle} disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 14,
            color: colors.muted,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: colors.blueDark,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: colors.text,
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: radius.md,
  border: `2px solid ${colors.border}`,
  backgroundColor: colors.bg,
  color: colors.text,
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  marginTop: "10px",
  padding: "16px",
  backgroundColor: colors.blueDark,
  color: colors.white,
  border: "none",
  borderRadius: radius.md,
  fontWeight: "800",
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: shadow.soft,
};

const secondaryButtonStyle = {
  marginTop: "10px",
  padding: "10px",
  borderRadius: radius.md,
  border: "none",
  backgroundColor: colors.yellowLight,
  color: "#856404",
  fontWeight: "700",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
};