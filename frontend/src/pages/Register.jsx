import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import { geocodeAddress } from "../api/geo";
import { useTimedNotification } from "../hooks/useTimedNotification";
import { useLanguage } from "../language/useLanguage";
import { saveAuthSession } from "../utils/auth";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi2";
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
  const { notification, showNotification } = useTimedNotification(3500);
  const { t } = useLanguage();
  const [verificationFile, setVerificationFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneVisible] = useState(false);

  const navigate = useNavigate();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showNotification(t("register.geoUnsupported"), "error");
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
          setLocation(data.display_name || t("register.detectedLocation"));
          showNotification(t("register.locationDetected"));
        } catch {
          showNotification(t("register.exactAddressError"), "error");
        }

        setLoadingLocation(false);
      },
      () => {
        showNotification(t("register.locationDenied"), "error");
        setLoadingLocation(false);
      }
    );
  };

  const geocodeManualAddress = async () => {
    let finalLat = coords.lat;
    let finalLng = coords.lng;

    if (userType === "organization" && (!finalLat || !finalLng) && location.trim()) {
      const geocoded = await geocodeAddress({ location });
      if (geocoded.lat != null && geocoded.lng != null) {
        finalLat = geocoded.lat;
        finalLng = geocoded.lng;
      }
    }

    return { finalLat, finalLng };
  };

  const handleExtractFromDocument = async () => {
    if (!verificationFile) {
      showNotification(t("register.uploadDocumentFirst"), "error");
      return;
    }

    try {
      setExtracting(true);

      const formData = new FormData();
      formData.append("file", verificationFile);

      const { response, data } = await apiFetch("/verification/extract-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        showNotification(data.detail || t("register.extractError"), "error");
        return;
      }

      if (data.document_type_guess === "fiscal_attestation_certificate") {
        showNotification(t("register.fiscalAttestationWarning"), "error");
        return;
      }

      if (data.document_type_guess === "trade_registry_certificate") {
        showNotification(t("register.tradeRegistryWarning"), "error");
        return;
      }

      if (data.name) setOrgName(data.name);
      if (data.cif) setCif(data.cif);
      if (data.location) {
        setLocation(data.location);
        setCoords({ lat: null, lng: null });
      }

      showNotification(t("register.documentProcessed"));
    } catch (error) {
      console.error("OCR error:", error);
      showNotification(t("register.ocrFailed"), "error");
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
      showNotification(t("register.loginDetailsRequired"), "error");
      return;
    }

    if (!isPasswordValid) {
      showNotification(t("register.strongerPassword"), "error");
      return;
    }

    if (userType === "user" && !fullName.trim()) {
      showNotification(t("register.fullNameRequired"), "error");
      return;
    }

    if (!phone.trim()) {
      showNotification(t("register.phoneRequired"), "error");
      return;
    }

    if (userType === "organization") {
      if (!orgName.trim()) {
        showNotification(t("register.organizationNameRequired"), "error");
        return;
      }

      if (!location.trim()) {
        showNotification(t("register.addressRequired"), "error");
        return;
      }

      if (!cif.trim()) {
        showNotification(t("register.cifRequired"), "error");
        return;
      }

      if (!verificationFile) {
        showNotification(t("register.certificateRequired"), "error");
        return;
      }

      const allowedTypes = ["image/png", "image/jpeg", "application/pdf", "image/webp"];

      if (!allowedTypes.includes(verificationFile.type)) {
        showNotification(t("register.unsupportedDocument"), "error");
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
          : data.detail || t("register.registrationError");
        showNotification(message, "error");
        setSubmitting(false);
        return;
      }

      saveAuthSession(data);

      if (userType === "organization") {
        try {
          const formData = new FormData();
          formData.append("email", email);
          formData.append("file", verificationFile);

          const { response: uploadResponse, data: uploadData } = await apiFetch(
            "/verification/upload-document",
            {
              method: "POST",
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            showNotification(uploadData.detail || t("register.documentUploadFailed"), "error");
            setSubmitting(false);
            return;
          }
        } catch (uploadError) {
          console.error("Document upload error:", uploadError);
          showNotification(t("register.accountCreatedDocumentFailed"), "error");
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
            showNotification(t("register.verificationPending"));
          } else {
            showNotification(t("register.verificationFailed"), "error");
          }
        } catch (verificationError) {
          console.error("Verification error:", verificationError);
          showNotification(t("register.verificationNotCompleted"), "error");
        }
      } else {
        showNotification(t("register.accountCreated"));
      }

      setTimeout(() => navigate("/login"), 2200);
    } catch (error) {
      console.error("Register error:", error);
      showNotification(t("register.serverConnectionError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page centered register-page">
      {notification.message && (
        <div className={`register-notification ${notification.type === "error" ? "error" : "success"}`}>
          <span>{notification.type === "error" ? <HiOutlineXCircle size={16} /> : <HiOutlineCheckCircle size={16} />}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="register-card">
        <div className="register-card-inner">
          <div className="register-heading">
            <h2>{t("register.title")}</h2>
            <p>{t("register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-type-switch">
              <button
                type="button"
                onClick={() => setUserType("user")}
                className={`register-type-button ${userType === "user" ? "active" : ""}`}
              >
                {t("register.user")}
              </button>

              <button
                type="button"
                onClick={() => setUserType("organization")}
                className={`register-type-button ${userType === "organization" ? "active" : ""}`}
              >
                {t("register.organization")}
              </button>
            </div>

            <div>
              <label className="form-label">{t("register.email")}</label>
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
              <label className="form-label">{t("register.phone")}</label>
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
              <label className="form-label">{t("register.password")}</label>

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
                    <PasswordRule ok={passwordChecks.minLength} text={t("register.passwordMin")} />
                    <PasswordRule ok={passwordChecks.uppercase} text={t("register.passwordUppercase")} />
                    <PasswordRule ok={passwordChecks.lowercase} text={t("register.passwordLowercase")} />
                    <PasswordRule ok={passwordChecks.number} text={t("register.passwordNumber")} />
                  </div>
                )}
              </div>
            </div>

            {userType === "user" && (
              <div>
                <label className="form-label">{t("register.fullName")}</label>
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
                  <label className="form-label">{t("register.organizationName")}</label>
                  <input
                    type="text"
                    placeholder={t("register.organizationName")}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="form-input register-input"
                  />
                </div>

                <div>
                  <label className="form-label">{t("register.cif")}</label>
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
                  <label className="form-label">{t("register.address")}</label>
                  <input
                    type="text"
                    placeholder={t("register.addressPlaceholder")}
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setCoords({ lat: null, lng: null });
                    }}
                    required
                    className="form-input register-input"
                  />

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={loadingLocation}
                    className="register-secondary-button"
                  >
                    {loadingLocation ? t("register.detecting") : t("register.useCurrentLocation")}
                  </button>
                </div>

                <div>
                  <label className="form-label">{t("register.certificate")}</label>
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
                    {extracting ? t("register.extracting") : t("register.autoFillDocument")}
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={!isPasswordValid || submitting}
              className="form-button primary register-submit"
            >
              {submitting ? t("register.creating") : t("register.createAccount")}
            </button>
          </form>

          <div className="register-footer">
            <p>
              {t("register.alreadyHaveAccount")} <Link to="/login">{t("register.logIn")}</Link>
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
      <span>{ok ? <HiOutlineCheckCircle size={14} /> : <HiOutlineXCircle size={14} />}</span>
      <span>{text}</span>
    </div>
  );
}
