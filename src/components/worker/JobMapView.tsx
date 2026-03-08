import { useState, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Send, BookmarkCheck, Bookmark } from "lucide-react";

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
}

const containerStyle = { width: "100%", height: "500px", borderRadius: "0.75rem" };

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India center

export default function JobMapView({ jobs, savedJobIds, appliedJobIds, onApply, onToggleSave, formatPay }: JobMapViewProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const geoJobs = useMemo(() => jobs.filter((j) => j.location_lat && j.location_lng), [jobs]);

  const center = useMemo(() => {
    if (geoJobs.length === 0) return DEFAULT_CENTER;
    const avgLat = geoJobs.reduce((s, j) => s + j.location_lat!, 0) / geoJobs.length;
    const avgLng = geoJobs.reduce((s, j) => s + j.location_lng!, 0) / geoJobs.length;
    return { lat: avgLat, lng: avgLng };
  }, [geoJobs]);

  const onMapClick = useCallback(() => setSelectedJob(null), []);

  if (loadError) {
    return (
      <div className="h-[500px] flex items-center justify-center rounded-xl border border-border bg-muted/30">
        <p className="text-destructive text-sm">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[500px] flex items-center justify-center rounded-xl border border-border bg-muted/30 animate-pulse">
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {geoJobs.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-xl">
          <div className="text-center">
            <MapPin className="mx-auto text-muted-foreground mb-2" size={32} />
            <p className="text-muted-foreground text-sm">No jobs with location data to display on map.</p>
            <p className="text-muted-foreground text-xs mt-1">{jobs.length} jobs available in list view.</p>
          </div>
        </div>
      )}
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={geoJobs.length === 1 ? 14 : 5} onClick={onMapClick}>
        {geoJobs.map((job) => (
          <MarkerF
            key={job.id}
            position={{ lat: job.location_lat!, lng: job.location_lng! }}
            onClick={() => setSelectedJob(job)}
          />
        ))}

        {selectedJob && selectedJob.location_lat && selectedJob.location_lng && (
          <InfoWindowF
            position={{ lat: selectedJob.location_lat, lng: selectedJob.location_lng }}
            onCloseClick={() => setSelectedJob(null)}
          >
            <div className="max-w-[260px] p-1">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">{selectedJob.title}</h4>
              <div className="flex gap-1 mb-2">
                <Badge variant="secondary" className="text-[10px]">{selectedJob.category}</Badge>
              </div>
              {selectedJob.location_address && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <MapPin size={10} /> {selectedJob.location_address}
                </p>
              )}
              <p className="text-xs font-medium text-green-700 flex items-center gap-1 mb-2">
                <DollarSign size={10} /> {formatPay(selectedJob)}
              </p>
              {selectedJob.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{selectedJob.description}</p>
              )}
              <div className="flex gap-1.5">
                {appliedJobIds.has(selectedJob.id) ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Send size={10} /> Applied
                  </span>
                ) : (
                  <button
                    onClick={() => onApply(selectedJob.id)}
                    className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 transition"
                  >
                    Quick Apply
                  </button>
                )}
                <button
                  onClick={() => onToggleSave(selectedJob.id)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  {savedJobIds.has(selectedJob.id) ? <BookmarkCheck size={12} className="text-blue-600" /> : <Bookmark size={12} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Showing {geoJobs.length} of {jobs.length} jobs with location data
      </p>
    </div>
  );
}
