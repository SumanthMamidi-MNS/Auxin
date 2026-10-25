"use client";
/**
 * src/components/features/LeafletMap.tsx — Auxin v3.0
 * Leaflet route map for the delivery mission.
 *
 * The map instance is created ONCE and only its markers are updated when the
 * coordinates change. (Previously the whole map was destroyed and rebuilt on every
 * GPS tick, and a pending Leaflet animation then read `_leaflet_pos` of a removed
 * map, crashing the page.) All animations are disabled for the same reason.
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

const DEFAULT_CENTER: L.LatLngExpression = [28.3200, 77.0665]; // Gurugram-Sohna Corridor
const SHADOW = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
const MARKER = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-";

function coloredIcon(color: "orange" | "green" | "blue") {
  return L.icon({
    iconUrl: `${MARKER}${color}.png`,
    shadowUrl: SHADOW,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

export default function LeafletMap({
  pickupLat,
  pickupLon,
  dropLat,
  dropLon,
  partnerLat,
  partnerLon,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // 1. Create the map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView(DEFAULT_CENTER, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // The container can be laid out after mount (tabs, drawers); re-measure once.
    const resize = window.setTimeout(() => {
      if (mapRef.current === map) map.invalidateSize({ animate: false });
    }, 150);

    return () => {
      window.clearTimeout(resize);
      map.stop();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // 2. Update markers / route whenever the coordinates change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points: L.LatLngTuple[] = [];

    if (isNum(pickupLat) && isNum(pickupLon)) {
      L.marker([pickupLat, pickupLon], { icon: coloredIcon("orange") })
        .bindPopup("<b>Pickup:</b> Farmer Farm")
        .addTo(layer);
      points.push([pickupLat, pickupLon]);
    }
    if (isNum(dropLat) && isNum(dropLon)) {
      L.marker([dropLat, dropLon], { icon: coloredIcon("green") })
        .bindPopup("<b>Drop-off:</b> Customer Address")
        .addTo(layer);
      points.push([dropLat, dropLon]);
    }
    if (isNum(partnerLat) && isNum(partnerLon)) {
      L.marker([partnerLat, partnerLon], { icon: coloredIcon("blue") })
        .bindPopup("<b>You:</b> Active Duty Position")
        .addTo(layer);
      points.push([partnerLat, partnerLon]);
    }

    // Draw polyline strictly terminating at customer doorstep
    const routeCoordinates: L.LatLngTuple[] = [];
    if (isNum(pickupLat) && isNum(pickupLon)) {
      routeCoordinates.push([pickupLat, pickupLon]);
    }
    if (isNum(partnerLat) && isNum(partnerLon)) {
      routeCoordinates.push([partnerLat, partnerLon]);
    }
    if (isNum(dropLat) && isNum(dropLon)) {
      routeCoordinates.push([dropLat, dropLon]);
    }

    if (routeCoordinates.length >= 2) {
      L.polyline(routeCoordinates, {
        color: "#16a34a",
        weight: 4,
        dashArray: "6, 6",
        opacity: 0.9,
      }).addTo(layer);
    }

    try {
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [30, 30], animate: false });
      } else if (points.length === 1) {
        map.setView(points[0], 13, { animate: false });
      }
    } catch {
      // The map was torn down between the effect firing and the call; nothing to do.
    }
  }, [pickupLat, pickupLon, dropLat, dropLon, partnerLat, partnerLon]);

  return (
    <div
      ref={containerRef}
      className="w-full h-48 rounded-2xl overflow-hidden border shadow-inner mt-3 relative z-10"
      style={{ borderColor: "var(--border)" }}
    />
  );
}
