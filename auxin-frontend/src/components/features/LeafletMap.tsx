"use client";
/**
 * src/components/features/LeafletMap.tsx — Auxin v3.0
 * Pure Leaflet dynamic rendering map for route navigation.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  pickupLat?: number | null;
  pickupLon?: number | null;
  dropLat?: number | null;
  dropLon?: number | null;
  partnerLat?: number | null;
  partnerLon?: number | null;
}

export default function LeafletMap({
  pickupLat,
  pickupLon,
  dropLat,
  dropLon,
  partnerLat,
  partnerLon,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Center on pickup, drop or Bangalore default
    const lat = pickupLat || dropLat || 12.9716;
    const lon = pickupLon || dropLon || 77.5946;

    const map = L.map(mapRef.current, { zoomControl: false }).setView([lat, lon], 13);
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Color markers config (Leaflet defaults are hard to customize, we load beautiful custom ones)
    const FarmIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const CustomerIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const PartnerIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const markers: L.LatLngExpression[] = [];

    // Add Pickup Farm Marker
    if (pickupLat && pickupLon) {
      L.marker([pickupLat, pickupLon], { icon: FarmIcon })
        .addTo(map)
        .bindPopup("<b>Pickup:</b> Farmer Farm");
      markers.push([pickupLat, pickupLon]);
    }

    // Add Customer Drop-off Marker
    if (dropLat && dropLon) {
      L.marker([dropLat, dropLon], { icon: CustomerIcon })
        .addTo(map)
        .bindPopup("<b>Drop-off:</b> Customer Address");
      markers.push([dropLat, dropLon]);
    }

    // Add Partner Location Marker
    if (partnerLat && partnerLon) {
      L.marker([partnerLat, partnerLon], { icon: PartnerIcon })
        .addTo(map)
        .bindPopup("<b>You:</b> Active Duty Position");
      markers.push([partnerLat, partnerLon]);
    }

    // Simple Route Polyline
    if (pickupLat && pickupLon && dropLat && dropLon) {
      L.polyline([[pickupLat, pickupLon], [dropLat, dropLon]], {
        color: "#22c55e",
        weight: 3,
        dashArray: "5, 8",
        opacity: 0.8,
      }).addTo(map);
    }

    // Scale map to fit bounds
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [pickupLat, pickupLon, dropLat, dropLon, partnerLat, partnerLon]);

  return (
    <div
      ref={mapRef}
      className="w-full h-48 rounded-2xl overflow-hidden border shadow-inner mt-3 relative z-10"
      style={{ borderColor: "var(--border)" }}
    />
  );
}
