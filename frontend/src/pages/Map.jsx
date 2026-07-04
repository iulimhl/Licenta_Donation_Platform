import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
import { useLanguage } from "../language/useLanguage";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../styles/pages/Map.css";

const defaultCenter = [47.1585, 27.6014];

const organizationIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div class="user-location-marker-dot"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

async function resolveOrganizationPosition(org) {
  const storedLat = org.lat != null ? Number(org.lat) : null;
  const storedLng = org.lng != null ? Number(org.lng) : null;

  if (Number.isFinite(storedLat) && Number.isFinite(storedLng)) {
    return { ...org, lat: storedLat, lng: storedLng };
  }

  return null;
}

function MapController({ organizations, userPos }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
  }, [map]);

  useEffect(() => {
    const points = organizations.map((org) => [org.lat, org.lng]);
    if (userPos) points.push(userPos);

    if (points.length > 1) {
      map.fitBounds(points, { padding: [42, 42], maxZoom: 13 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [map, organizations, userPos]);

  return null;
}

export default function OngMap() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [organizations, setOrganizations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapNotice, setMapNotice] = useState("");

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { response, data } = await apiFetch("/organizations/map");
        if (response.ok) {
          const resolved = await Promise.all((data || []).map(resolveOrganizationPosition));
          const located = resolved.filter(Boolean);

          setOrganizations(located);
          setMapNotice(
            located.length
              ? ""
              : t("map.noLocations")
          );
        }
      } catch (error) {
        console.error("Error loading organizations:", error);
        setMapNotice(t("map.loadError"));
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
  }, [t]);

  const locatedOrganizations = useMemo(() => organizations, [organizations]);

  const center = (userPos || locatedOrganizations[0])
    ? userPos || [locatedOrganizations[0].lat, locatedOrganizations[0].lng]
    : defaultCenter;

  if (loading) return <div className="page-message">{t("map.loading")}</div>;

  return (
    <div className="map-page">
      <SectionBanner
        title={t("map.title")}
        subtitle={t("map.subtitle")}
      />

      <div className="map-shell surface-card">
        <MapContainer center={center} zoom={userPos ? 13 : 7} className="map-canvas">
          <MapController organizations={locatedOrganizations} userPos={userPos} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {userPos && (
            <Marker position={userPos} icon={userLocationIcon}>
              <Popup>{t("map.userHere")}</Popup>
            </Marker>
          )}

          {locatedOrganizations.map((org) => (
            <Marker key={org.id} position={[org.lat, org.lng]} icon={organizationIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>{org.name}</strong>
                  <p>{org.location}</p>
                  <button onClick={() => navigate(`/chat/${encodeURIComponent(org.email)}`)}>
                    {t("map.contact")}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {mapNotice && <p className="map-notice">{mapNotice}</p>}
    </div>
  );
}
