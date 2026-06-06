import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api/api";
import SectionBanner from "../components/common/SectionBanner";
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
  const [organizations, setOrganizations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapNotice, setMapNotice] = useState("");

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { response, data } = await apiFetch("/organizations/map");
        if (response.ok) {
          const located = (data || [])
            .filter((org) => org.lat != null && org.lng != null)
            .map((org) => ({
              ...org,
              lat: Number(org.lat),
              lng: Number(org.lng),
            }));

          setOrganizations(located);
          setMapNotice(
            located.length
              ? ""
              : "No verified organizations with a saved map location were found yet. Organizations can add one from Edit profile."
          );
        }
      } catch (error) {
        console.error("Eroare la incarcarea organizatiilor:", error);
        setMapNotice("Could not load organizations for the map.");
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

  const locatedOrganizations = useMemo(() => organizations, [organizations]);

  const center = (userPos || locatedOrganizations[0])
    ? userPos || [locatedOrganizations[0].lat, locatedOrganizations[0].lng]
    : defaultCenter;

  if (loading) return <div className="map-loading">Se incarca harta...</div>;

  return (
    <div className="map-page">
      <SectionBanner
        title="Organizations Map"
        subtitle="Discover verified organizations and collection points in your area."
      />

      <div className="map-shell">
        <MapContainer center={center} zoom={userPos ? 13 : 7} className="map-canvas">
          <MapController organizations={locatedOrganizations} userPos={userPos} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {userPos && (
            <Marker position={userPos} icon={userLocationIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {locatedOrganizations.map((org) => (
            <Marker key={org.id} position={[org.lat, org.lng]} icon={organizationIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>{org.name}</strong>
                  <p>{org.location}</p>
                  <button onClick={() => window.location.href = `/chat/${org.email}`}>
                    Contact
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
