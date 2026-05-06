import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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
        <h2 style={{ margin: 0, color: "#1e293b" }}>Harta Organizațiilor Partnere</h2>
        <p style={{ color: "#64748b" }}>Punctele albastre sunt ONG-uri, punctul roșu ești tu.</p>
      </div>

      <MapContainer
        center={[45.9432, 24.9668]}
        zoom={6.5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos && (
          <Marker position={userPos} icon={redIcon}>
            <Popup>Ești aici (Locația ta curentă)</Popup>
          </Marker>
        )}

        {organizations.map((org) => (
          <Marker key={org.id} position={[org.lat, org.lng]} icon={blueIcon}>
            <Popup>
              <div style={{ padding: "5px" }}>
                <strong style={{ color: "#6366f1" }}>{org.name}</strong>
                <p style={{ margin: "5px 0", fontSize: "12px" }}>{org.location}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}