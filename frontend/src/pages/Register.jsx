import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import "../styles/formPages.css";
import "../styles/pages/Register.css";

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
  const [phone, setPhone] = useState("");
  const [phoneVisible] = useState(false);

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
        const query = encodeURIComponent(`${location}, Romania`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ro&q=${query}&limit=1`
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

      if (data.name) setOrgName(data.name);
      if (data.cif) setCif(data.cif);
      if (data.location) setLocation(data.location);

      showNotification("Document processed successfully!");
    } catch (error) {
      console.error("OCR error:", error);
      showNotification("OCR extraction failed.", "error");
    } finally {
      setExtracting(false);
    }
  };

  const passwordChecks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number;

  const showPasswordBubble = password.length > 0 && !isPasswordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showNotification("Please fill in login details.", "error");
      return;
    }

    if (!isPasswordValid) {
      showNotification("Please choose a stronger password.", "error");
      return;
    }

    if (userType === "user" && !fullName.trim()) {
      showNotification("Please enter your full name.", "error");
      return;
    }

    if (!phone.trim()) {
      showNotification("Please enter your phone number.", "error");
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

      if (!verificationFile) {
        showNotification("Please upload the fiscal registration certificate.", "error");
        return;
      }

      const allowedTypes = ["image/png", "image/jpeg", "application/pdf", "image/webp"];

      if (!allowedTypes.includes(verificationFile.type)) {
        showNotification("Unsupported document type.", "error");
        return;
      }
    }

    setSubmitting(true);

    const { finalLat, finalLng } = await geocodeManualAddress();

    try {
      const registerPayload = {
        email,
        password,
        name: userType === "user" ? fullName : orgName,
        user_type: userType,
        location: userType === "organization" ? location : null,
        lat: userType === "organization" ? finalLat : null,
        lng: userType === "organization" ? finalLng : null,
        cif: userType === "organization" ? cif : null,
        phone,
        phone_visible: phoneVisible,
      };

      const { response, data } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(registerPayload),
      });

      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((e) => e.msg).join(" | ")
          : data.detail || "Registration error";
        showNotification(message, "error");
        setSubmitting(false);
        return;
      }

      if (userType === "organization") {
        try {
          const formData = new FormData();
          formData.append("email", email);
          formData.append("file", verificationFile);

          const uploadResponse = await fetch(
            "http://127.0.0.1:8000/verification/upload-document",
            {
              method: "POST",
              body: formData,
            }
          );

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            showNotification(uploadData.detail || "Document upload failed.", "error");
            setSubmitting(false);
            return;
          }
        } catch (uploadError) {
          console.error("Document upload error:", uploadError);
          showNotification("Account created, but document upload failed.", "error");
          setSubmitting(false);
          return;
        }
      }

      if (userType === "organization") {
        try {
          const { response: verifyResponse } = await apiFetch("/verification/organization", {
            method: "POST",
            body: JSON.stringify({ email, name: orgName, cif }),
          });

          if (verifyResponse.ok) {
            showNotification("Account created. Verification is pending.");
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
      console.error("Register error:", error);
      showNotification("Server connection error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page centered register-page">
      {notification.message && (
        <div className={`register-notification ${notification.type === "error" ? "error" : "success"}`}>
          <span>{notification.type === "error" ? "x" : "✓"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="register-card">
        <div className="register-card-inner">
          <div className="register-heading">
            <h2>Create your account</h2>
            <p>Create an account to donate, connect, and support local communities.</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-type-switch">
              <button
                type="button"
                onClick={() => setUserType("user")}
                className={`register-type-button ${userType === "user" ? "active" : ""}`}
              >
                User
              </button>

              <button
                type="button"
                onClick={() => setUserType("organization")}
                className={`register-type-button ${userType === "organization" ? "active" : ""}`}
              >
                Organization
              </button>
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="ana@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input register-input"
              />
            </div>

            <div>
              <label className="form-label">Phone number</label>
              <input
                type="text"
                placeholder="07xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="form-input register-input"
              />
            </div>

            <div className={showPasswordBubble ? "register-password-field with-bubble" : ""}>
              <label className="form-label">Password</label>

              <div className="register-password-wrap">
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input register-input"
                />

                {showPasswordBubble && (
                  <div className="register-password-bubble">
                    <PasswordRule ok={passwordChecks.minLength} text="At least 8 characters" />
                    <PasswordRule ok={passwordChecks.uppercase} text="One uppercase letter" />
                    <PasswordRule ok={passwordChecks.lowercase} text="One lowercase letter" />
                    <PasswordRule ok={passwordChecks.number} text="One number" />
                  </div>
                )}
              </div>
            </div>

            {userType === "user" && (
              <div>
                <label className="form-label">Full name</label>
                <input
                  type="text"
                  placeholder="Ana Popescu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="form-input register-input"
                />
              </div>
            )}

            {userType === "organization" && (
              <>
                <div>
                  <label className="form-label">Organization name</label>
                  <input
                    type="text"
                    placeholder="Organization name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="form-input register-input"
                  />
                </div>

                <div>
                  <label className="form-label">CIF</label>
                  <input
                    type="text"
                    placeholder="12345678"
                    value={cif}
                    onChange={(e) => setCif(e.target.value)}
                    required
                    className="form-input register-input"
                  />
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    placeholder="Enter address or use GPS"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="form-input register-input"
                  />

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={loadingLocation}
                    className="register-secondary-button"
                  >
                    {loadingLocation ? "Detecting..." : "Use current location"}
                  </button>
                </div>

                <div>
                  <label className="form-label">Fiscal registration certificate</label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.webp"
                    onChange={(e) => setVerificationFile(e.target.files[0])}
                    className="form-file register-file"
                  />

                  <button
                    type="button"
                    onClick={handleExtractFromDocument}
                    disabled={extracting}
                    className="register-secondary-button"
                  >
                    {extracting ? "Extracting..." : "Auto-fill from document"}
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={!isPasswordValid || submitting}
              className="form-button primary register-submit"
            >
              {submitting ? "Creating..." : "Create account"}
            </button>
          </form>

          <div className="register-footer">
            <p>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordRule({ ok, text }) {
  return (
    <div className={`register-password-rule ${ok ? "ok" : "error"}`}>
      <span>{ok ? "✓" : "x"}</span>
      <span>{text}</span>
    </div>
  );
}
