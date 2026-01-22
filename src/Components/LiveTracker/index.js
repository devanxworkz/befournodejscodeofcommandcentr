import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon warnings
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ---------- AUTO ZOOM ----------
function AutoZoom({ targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.flyTo(map.getCenter(), targetZoom, { duration: 1.5 });
  }, [map, targetZoom]);
  return null;
}

// ---------- AUTO PAN ----------
function AutoPanMap({ position }) {
  const map = useMap();
  const lastCenter = useRef(null);

  useEffect(() => {
    if (!position) return;

    if (!lastCenter.current || map.distance(lastCenter.current, position) > 5) {
      map.panTo(position, { animate: true, duration: 0.5 });
      lastCenter.current = position;
    }
  }, [position]);

  return null;
}

// ---------- HEADING CALCULATOR (FIXED) ----------
function getHeading(start, end) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const dLon = toRad(end.lng - start.lng);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = toDeg(Math.atan2(y, x));

  return (brng + 360) % 360; // normalize 0–360
}





// ---------- SCOOTER MARKER (Smooth & Stable) ----------
function SmoothMarker({ position }) {
  const markerRef = useRef();
  const lastPos = useRef(position);
  const lastAngle = useRef(0);

  useEffect(() => {
    if (!position) return;

    const start = lastPos.current;
    const end = position;

    const duration = 800;
    let startTime = null;

    let targetAngle = getHeading(start, end);
    if (targetAngle === null) targetAngle = lastAngle.current;

    const animate = (time) => {
      if (!startTime) startTime = time;

      const t = Math.min((time - startTime) / duration, 1);
const progress = 1 - Math.pow(1 - t, 3);


      // Smooth position
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;

      // Smooth rotation
      const angle =
        lastAngle.current +
        (((targetAngle - lastAngle.current + 540) % 360) - 180) * progress;

      if (markerRef.current) {
        const marker = markerRef.current;
        marker.setLatLng([lat, lng]);

        if (marker._icon) {
          const base = marker._icon.style.transform.replace(/rotate\(.*?\)/, "");
          const IMAGE_ROTATION_OFFSET = 0;  // change to 0, 90, 180, 270

marker._icon.style.transform = `${base} rotate(${angle + IMAGE_ROTATION_OFFSET}deg)`;

          marker._icon.style.transformOrigin = "center";
        }
      }

      if (progress < 1) requestAnimationFrame(animate);
      else {
        lastPos.current = end;
        lastAngle.current = targetAngle;
      }
    };

    requestAnimationFrame(animate);
  }, [position]);

const scooterIcon = new L.Icon({
  iconUrl:
    "https://image2url.com/r2/bucket1/images/1766578509361-ef3335af-97c7-4ad0-8751-85d2c3620c1e.png",
  iconSize: [55,45],     // width = height
  iconAnchor: [32, 32],   // center
});



  return <Marker ref={markerRef} position={position} icon={scooterIcon} />;
}

// ---------- MAIN COMPONENT ----------
export default function LiveTracker({ vin }) {
  const [points, setPoints] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);

  useEffect(() => {
    if (!vin) return;

    const fetchLiveData = async () => {
      try {
        const res = await fetch(
          `https://commandcenter.rivotmotors.com/livemaploction.php?vin=${vin}`
        );
        const json = await res.json();

        if (json.status === "success" && json.data?.lat_long) {
          const [latStr, lngStr] = json.data.lat_long.split(",");
          const newPoint = { lat: parseFloat(latStr), lng: parseFloat(lngStr) };

          setPoints((prev) => {
            if (
              !prev.length ||
              prev[prev.length - 1].lat !== newPoint.lat ||
              prev[prev.length - 1].lng !== newPoint.lng
            ) {
              return [...prev, newPoint];
            }
            return prev;
          });

          setCurrentPos(newPoint);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 1000);
    return () => clearInterval(interval);
  }, [vin]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <style>
        {`
          .leaflet-marker-icon {
            z-index: 9999 !important;
          }
        `}
      </style>

      <MapContainer
        center={currentPos || [20.5937, 78.9629]}
        zoom={17}
        minZoom={3}
        maxZoom={21}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoZoom targetZoom={18} />

        <AutoPanMap position={currentPos} />

        {points.length > 1 && (
          <Polyline positions={points} color="#00BFFF" weight={4} opacity={0.9} />
        )}

        {currentPos && <SmoothMarker position={currentPos} />}
      </MapContainer>
    </div>
  );
}
