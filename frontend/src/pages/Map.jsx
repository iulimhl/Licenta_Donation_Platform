import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { apiFetch } from "../api/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const blueIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="
      background-color: #2563eb;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 8px rgba(37, 99, 235, 0.6);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function MapPage() {
  const [organizations, setOrganizations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { response, data } = await apiFetch("/organizations/map");
        if (response.ok) setOrganizations(data);
      } catch (error) {
        console.error("Eroare la încărcarea organizațiilor:", error);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserPos([position.coords.latitude, position.coords.longitude]);
      });
    }

    fetchOrgs();
  }, []);

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Se încarcă harta...</div>;

  return (
    <div style={{ height: "calc(100vh - 80px)", width: "100%" }}>
      <div style={{ padding: "20px", textAlign: "center", background: "#f8fafc" }}>
        <h2 style={{ margin: 0, color: "#1e293b", fontWeight: 800 }}>Organizations map</h2>
      </div>

      <MapContainer
        center={userPos || [47.1585, 27.6014]}
        zoom={userPos ? 13 : 7}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos && (
          <Marker position={userPos} icon={userLocationIcon}>
            <Popup>You hare here</Popup>
          </Marker>
        )}

        {organizations.map((org) => (
          org.lat && org.lng && (
            <Marker key={org.id} position={[org.lat, org.lng]} icon={blueIcon}>
              <Popup>
                <div style={{ padding: "5px" }}>
                  <strong style={{ color: "#6366f1", fontSize: "14px" }}>{org.name}</strong>
                  <p style={{ margin: "5px 0", fontSize: "12px", color: "#475569" }}>{org.location}</p>
                  <button
                    onClick={() => window.location.href=`/chat/${org.email}`}
                    style={{
                      marginTop: "5px", width: "100%", padding: "4px",
                      backgroundColor: "#6366f1", color: "white", border: "none",
                      borderRadius: "4px", cursor: "pointer", fontSize: "11px"
                    }}
                  >
                    Contact
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}