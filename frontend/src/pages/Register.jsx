import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [orgName, setOrgName] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const navigate = useNavigate();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocația nu este suportată de browserul tău.");
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
          setLocation(data.display_name || "Locație necunoscută");
        } catch (error) {
          console.error("Eroare la obținerea adresei:", error);
          alert("Am obținut coordonatele, dar nu am putut găsi adresa exactă.");
        }
        setLoadingLocation(false);
      },
      () => {
        alert("Nu am putut accesa locația ta. Te rugăm să permiți accesul la locație.");
        setLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Te rugăm să completezi toate câmpurile obligatorii.");
      return;
    }

    if (userType === "organization" && !orgName.trim()) {
      alert("Te rugăm să introduci numele organizației.");
      return;
    }

    try {
      const { response, data } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          user_type: userType,
          organization_name: userType === "organization" ? orgName : null,
          location: userType === "organization" ? location : null,
          lat: userType === "organization" ? coords.lat : null,
          lng: userType === "organization" ? coords.lng : null,
        }),
      });

      if (response.ok) {
        alert("Cont creat cu succes! Acum te poți loga.");
        navigate("/login");
      } else {
        alert("Eroare: " + (data.detail || "Nu s-a putut crea contul"));
      }
    } catch (error) {
      alert("Serverul nu răspunde. Verifică dacă backend-ul rulează.");
    }
  };

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div className="glass-container" style={{ maxWidth: 420, margin: "0 auto", padding: "30px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: 28, color: "#1e293b", fontWeight: 700 }}>Iași Donează</h2>
          <p style={{ color: "#64748b", marginTop: "8px" }}>Creează un cont nou</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {/* Tip Utilizator */}
          <div style={{ textAlign: "center" }}>
            <label style={{ display: "block", marginBottom: 10, fontWeight: 700, fontSize: 14 }}>Sunt un:</label>
            <div style={{ display: "flex", gap: 15, justifyContent: "center" }}>
              <label style={{ cursor: "pointer", fontSize: 14 }}>
                <input
                  type="radio"
                  value="user"
                  checked={userType === "user"}
                  onChange={(e) => setUserType(e.target.value)}
                  style={{ marginRight: 6 }}
                />
                Utilizator simplu
              </label>
              <label style={{ cursor: "pointer", fontSize: 14 }}>
                <input
                  type="radio"
                  value="organization"
                  checked={userType === "organization"}
                  onChange={(e) => setUserType(e.target.value)}
                  style={{ marginRight: 6 }}
                />
                Organizație/ONG
              </label>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="modern-label">Email *</label>
            <input
              type="email"
              placeholder="nume@exemplu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="modern-input"
            />
          </div>

          {/* Parolă */}
          <div>
            <label className="modern-label">Parolă *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="modern-input"
            />
          </div>

          {/* Câmpuri specifice Organizație */}
          {userType === "organization" && (
            <>
              <div>
                <label className="modern-label">Nume Organizație *</label>
                <input
                  type="text"
                  placeholder="Ex: Asociația Speranța"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="modern-input"
                  required
                />
              </div>

              <div>
                <label className="modern-label">Adresă Sediu *</label>
                <input
                  type="text"
                  placeholder="Se completează automat sau manual"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="modern-input"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={loadingLocation}
                style={{
                  padding: "10px",
                  borderRadius: 12,
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                {loadingLocation ? "Se detectează..." : "📍 Folosește locația curentă"}
              </button>
            </>
          )}

          <button type="submit" className="modern-button" style={{
            marginTop: "10px",
            padding: "14px",
            background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "bold",
            cursor: "pointer"
          }}>
            Înregistrare
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "#64748b" }}>
          Ai deja cont? <Link to="/login" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Loghează-te</Link>
        </p>
      </div>
    </div>
  );
}