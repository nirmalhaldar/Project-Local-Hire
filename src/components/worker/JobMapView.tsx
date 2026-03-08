import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Send, BookmarkCheck, Bookmark, Navigation, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-[200deg] saturate-200",
});

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  job_type: string | null;
  skills_required: string[];
  roles_required: string[];
  created_at: string;
  employer_id: string;
}

interface JobMapViewProps {
  jobs: Job[];
  savedJobIds: Set<string>;
  appliedJobIds: Set<string>;
  onApply: (jobId: string) => void;
  onToggleSave: (jobId: string) => void;
  formatPay: (job: Job) => string;
  userLocation: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
  locatingUser: boolean;
  radiusKm: number;
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center[0], center[1], zoom]);
  
  // Also set on mount to ensure correct initial position
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  
  return null;
}

export default function JobMapView({
  jobs, savedJobIds, appliedJobIds, onApply, onToggleSave, formatPay,
  userLocation, onRequestLocation, locatingUser, radiusKm,
}: JobMapViewProps) {
  const geoJobs = useMemo(() => jobs.filter((j) => j.location_lat && j.location_lng), [jobs]);

  const center: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (geoJobs.length === 0) return [20.5937, 78.9629];
    const avgLat = geoJobs.reduce((s, j) => s + j.location_lat!, 0) / geoJobs.length;
    const avgLng = geoJobs.reduce((s, j) => s + j.location_lng!, 0) / geoJobs.length;
    return [avgLat, avgLng];
  }, [geoJobs, userLocation]);

  const zoom = useMemo(() => {
    if (userLocation) {
      if (radiusKm <= 5) return 13;
      if (radiusKm <= 15) return 12;
      if (radiusKm <= 30) return 11;
      return 10;
    }
    return geoJobs.length === 1 ? 14 : 5;
  }, [userLocation, radiusKm, geoJobs.length]);

  return (
    <div className="relative">
      {/* My Location button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <Button
          size="sm"
          variant={userLocation ? "default" : "secondary"}
          onClick={onRequestLocation}
          disabled={locatingUser}
          className="shadow-lg gap-1.5"
        >
          {locatingUser ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          {locatingUser ? "Locating..." : userLocation ? "My Location" : "Use My Location"}
        </Button>
      </div>

      {geoJobs.length === 0 && !userLocation && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 rounded-xl">
          <div className="text-center">
            <MapPin className="mx-auto text-muted-foreground mb-2" size={32} />
            <p className="text-muted-foreground text-sm">No jobs with location data to display on map.</p>
            <p className="text-muted-foreground text-xs mt-1">{jobs.length} jobs available in list view.</p>
            <Button size="sm" variant="outline" onClick={onRequestLocation} className="mt-3 gap-1.5">
              <Navigation size={14} /> Find jobs near me
            </Button>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "500px", width: "100%", borderRadius: "0.75rem" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} zoom={zoom} />

        {/* User location */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>📍 Your location</Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "hsl(var(--primary))", fillOpacity: 0.08, weight: 1 }}
            />
          </>
        )}

        {/* Job markers */}
        {geoJobs.map((job) => (
          <Marker key={job.id} position={[job.location_lat!, job.location_lng!]}>
            <Popup>
              <div className="max-w-[240px]">
                <h4 className="font-semibold text-sm mb-1">{job.title}</h4>
                <div className="flex gap-1 mb-1.5">
                  <Badge variant="secondary" className="text-[10px]">{job.category}</Badge>
                </div>
                {job.location_address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin size={10} /> {job.location_address}
                  </p>
                )}
                <p className="text-xs font-medium text-primary flex items-center gap-1 mb-1.5">
                  <DollarSign size={10} /> {formatPay(job)}
                </p>
                {job.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{job.description}</p>}
                <div className="flex gap-1.5 items-center">
                  {appliedJobIds.has(job.id) ? (
                    <span className="text-xs font-medium flex items-center gap-1 text-primary">
                      <Send size={10} /> Applied
                    </span>
                  ) : (
                    <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => onApply(job.id)}>
                      Quick Apply
                    </Button>
                  )}
                  <button onClick={() => onToggleSave(job.id)} className="p-1 hover:bg-muted rounded transition">
                    {savedJobIds.has(job.id) ? <BookmarkCheck size={12} className="text-primary" /> : <Bookmark size={12} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Showing {geoJobs.length} of {jobs.length} jobs with location data
        {userLocation && ` · Within ${radiusKm} km of your location`}
      </p>
    </div>
  );
}
