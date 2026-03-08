import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, DollarSign, List, Map, Clock, Briefcase, Send, Bookmark, BookmarkCheck, Flag, ChevronDown, Sparkles, TrendingUp, Navigation, Loader2, Home } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import JobMapView from "./JobMapView";
import PlacesAutocomplete from "@/components/shared/PlacesAutocomplete";

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

const CATEGORIES = ["All", "Construction", "Cleaning", "Delivery", "Gardening", "Painting", "Plumbing", "Electrical", "Moving", "Carpentry", "Other"];
const JOB_TYPES = [{ value: "all", label: "All Types" }, { value: "gig", label: "Gig" }, { value: "part_time", label: "Part-Time" }, { value: "full_time", label: "Full-Time" }, { value: "contract", label: "Contract" }];
const ROLES = ["All Roles", "Driver", "Electrician", "Plumber", "Carpenter", "Painter", "Cleaner", "Gardener", "Mason", "Welder", "Mechanic", "Delivery", "Cook", "Security Guard"];

export default function JobSearch() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [jobType, setJobType] = useState("all");
  const [role, setRole] = useState("All Roles");
  const [salaryRange, setSalaryRange] = useState([0, 50000]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [reportJobId, setReportJobId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [highPayingIds, setHighPayingIds] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "recommended" | "highpaying">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number; address: string | null } | null>(null);
  const [locationSource, setLocationSource] = useState<"gps" | "home" | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);

  const getDistanceKm = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const handleUseHomeLocation = useCallback(() => {
    if (!homeLocation) return;
    setUserLocation({ lat: homeLocation.lat, lng: homeLocation.lng });
    setLocationSource("home");
    toast({ title: "Using home location", description: homeLocation.address || "Showing jobs near your saved home." });
  }, [homeLocation]);

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationSource("gps");
        setLocatingUser(false);
        toast({ title: "GPS location found", description: "Showing jobs near your current location." });
      },
      (err) => {
        setLocatingUser(false);
        if (homeLocation) {
          setUserLocation({ lat: homeLocation.lat, lng: homeLocation.lng });
          setLocationSource("home");
          toast({ title: "Using home location", description: "GPS failed, so we switched to your saved home location." });
          return;
        }
        toast({ title: "Location error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [homeLocation]);

  const getJobDistance = useCallback((job: Job) => {
    if (!userLocation || !job.location_lat || !job.location_lng) return null;
    return getDistanceKm(userLocation.lat, userLocation.lng, job.location_lat, job.location_lng);
  }, [userLocation, getDistanceKm]);

  useEffect(() => {
    fetchJobs();
    if (user) { fetchSavedJobs(); fetchAppliedJobs(); fetchHomeLocation(); }
  }, [user]);

  useEffect(() => {
    if (user && jobs.length > 0) fetchRecommendations();
  }, [user, jobs.length]);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  const fetchSavedJobs = async () => {
    const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
    if (data) setSavedJobIds(new Set(data.map((d) => d.job_id)));
  };

  const fetchAppliedJobs = async () => {
    const { data } = await supabase.from("job_applications").select("job_id").eq("worker_id", user!.id);
    if (data) setAppliedJobIds(new Set(data.map((d) => d.job_id)));
  };

  const fetchHomeLocation = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("location_address, location_lat, location_lng")
      .eq("id", user!.id)
      .single();

    if (data?.location_lat && data?.location_lng) {
      const nextHome = {
        lat: data.location_lat,
        lng: data.location_lng,
        address: data.location_address,
      };
      setHomeLocation(nextHome);
      setUserLocation((prev) => prev ?? { lat: nextHome.lat, lng: nextHome.lng });
      setLocationSource((prev) => prev ?? "home");
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const { data, error } = await supabase.functions.invoke("job-recommendations", {
        body: { userId: user!.id },
      });
      if (data && !error) {
        setRecommendedIds(data.recommended || []);
        setHighPayingIds(data.highPaying || []);
      }
    } catch (e) {
      console.error("Failed to fetch recommendations:", e);
    }
    setLoadingRecs(false);
  };

  const handleApply = async (jobId: string) => {
    const { error } = await supabase.from("job_applications").insert({ job_id: jobId, worker_id: user!.id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAppliedJobIds(new Set([...appliedJobIds, jobId]));
      toast({ title: "Applied!", description: "Your application has been sent." });
    }
  };

  const handleToggleSave = async (jobId: string) => {
    if (savedJobIds.has(jobId)) {
      await supabase.from("saved_jobs").delete().eq("user_id", user!.id).eq("job_id", jobId);
      const next = new Set(savedJobIds);
      next.delete(jobId);
      setSavedJobIds(next);
      toast({ title: "Removed", description: "Job removed from saved." });
    } else {
      await supabase.from("saved_jobs").insert({ user_id: user!.id, job_id: jobId });
      setSavedJobIds(new Set([...savedJobIds, jobId]));
      toast({ title: "Saved!", description: "Job saved for later." });
    }
  };

  const handleReport = async () => {
    if (!reportJobId || !reportReason) return;
    await supabase.from("job_reports").insert({
      job_id: reportJobId, reporter_id: user!.id, reason: reportReason, description: reportDesc,
    });
    toast({ title: "Reported", description: "Thank you. We'll review this job posting." });
    setReportJobId(null);
    setReportReason("");
    setReportDesc("");
  };

  const baseFiltered = jobs.filter((job) => {
    const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.description?.toLowerCase().includes(search.toLowerCase()) || job.location_address?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || job.category === category;
    const matchType = jobType === "all" || job.job_type === jobType;
    const matchRole = role === "All Roles" || (job.roles_required || []).includes(role);
    const matchSalary = !job.pay_max || job.pay_max >= salaryRange[0];
    const matchDistance = !userLocation || !job.location_lat || !job.location_lng || getDistanceKm(userLocation.lat, userLocation.lng, job.location_lat, job.location_lng) <= radiusKm;
    return matchSearch && matchCategory && matchType && matchRole && matchSalary && matchDistance;
  });

  const tabFiltered = activeTab === "recommended"
    ? baseFiltered.filter((j) => recommendedIds.includes(j.id))
    : activeTab === "highpaying"
    ? baseFiltered.filter((j) => highPayingIds.includes(j.id))
    : baseFiltered;

  // Sort by distance when user location is active
  const filteredJobs = userLocation
    ? [...tabFiltered].sort((a, b) => {
        const distA = getJobDistance(a) ?? Infinity;
        const distB = getJobDistance(b) ?? Infinity;
        return distA - distB;
      })
    : tabFiltered;

  const formatPay = (job: Job) => {
    if (!job.pay_min && !job.pay_max) return "Negotiable";
    const min = job.pay_min ? `₹${job.pay_min}` : "";
    const max = job.pay_max ? `₹${job.pay_max}` : "";
    const type = job.pay_type === "hourly" ? "/hr" : job.pay_type === "daily" ? "/day" : "";
    return min && max ? `${min} - ${max}${type}` : `${min || max}${type}`;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const jobTypeLabel = (t: string | null) => {
    const map: Record<string, string> = { gig: "Gig", part_time: "Part-Time", full_time: "Full-Time", contract: "Contract" };
    return map[t || ""] || "Gig";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Find Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse and search available jobs near you</p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Search jobs, skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-1">
              Filters <ChevronDown size={14} className={`transition ${showFilters ? "rotate-180" : ""}`} />
            </Button>
            <div className="flex gap-1 border border-border rounded-lg p-1">
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}><List size={16} /></Button>
              <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("map")}><Map size={16} /></Button>
            </div>
          </div>
        </div>

        {/* Location Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 w-full">
            <PlacesAutocomplete
              value={userLocation ? (locationSource === "home" ? (homeLocation?.address || "") : "Current GPS location") : ""}
              onChange={(address, lat, lng) => {
                if (lat && lng) {
                  setUserLocation({ lat, lng });
                  setLocationSource(null);
                }
              }}
              placeholder="Search location to find nearby jobs..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={locationSource === "gps" ? "default" : "outline"}
              size="sm"
              onClick={handleRequestLocation}
              disabled={locatingUser}
              className="gap-1.5"
            >
              {locatingUser ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {locatingUser ? "Locating..." : "Use GPS"}
            </Button>
            {homeLocation && (
              <Button
                variant={locationSource === "home" ? "default" : "outline"}
                size="sm"
                onClick={handleUseHomeLocation}
                className="gap-1.5"
              >
                <Home size={14} /> Home
              </Button>
            )}
            {userLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setUserLocation(null); setLocationSource(null); }}
                className="gap-1.5 text-muted-foreground"
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Type</label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Salary: ₹{salaryRange[1].toLocaleString()}</label>
                <Slider value={salaryRange} onValueChange={setSalaryRange} min={0} max={50000} step={500} className="mt-2" />
              </div>
              {userLocation && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Radius: {radiusKm} km</label>
                  <Slider value={[radiusKm]} onValueChange={(v) => setRadiusKm(v[0])} min={1} max={100} step={1} className="mt-2" />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* AI Recommendation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button variant={activeTab === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("all")}>
          <Briefcase size={14} className="mr-1.5" /> All Jobs
        </Button>
        <Button variant={activeTab === "recommended" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("recommended")} disabled={loadingRecs}>
          <Sparkles size={14} className="mr-1.5" /> {loadingRecs ? "Loading..." : "Recommended for You"}
        </Button>
        <Button variant={activeTab === "highpaying" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("highpaying")} disabled={loadingRecs}>
          <TrendingUp size={14} className="mr-1.5" /> High Paying
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Card key={i} className="p-5 animate-pulse"><div className="h-5 bg-muted rounded w-3/4 mb-3" /><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-4 bg-muted rounded w-1/3" /></Card>)}
        </div>
      ) : viewMode === "list" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.length === 0 ? (
            <div className="col-span-2 text-center py-16">
              <Briefcase className="mx-auto text-muted-foreground mb-3" size={48} />
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">No jobs found</h3>
              <p className="text-muted-foreground text-sm">{jobs.length === 0 ? "No jobs posted yet." : "Try adjusting your filters."}</p>
            </div>
          ) : filteredJobs.map((job) => (
            <Card key={job.id} className="p-5 hover:shadow-md transition-shadow border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{job.title}</h3>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                    <Badge variant="outline" className="text-xs">{jobTypeLabel(job.job_type)}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggleSave(job.id)} className="p-1.5 hover:bg-muted rounded-md transition">
                    {savedJobIds.has(job.id) ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => setReportJobId(job.id)} className="p-1.5 hover:bg-muted rounded-md transition">
                    <Flag size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {job.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>}

              <div className="flex flex-wrap gap-3 text-sm mb-3">
                {job.location_address && <span className="flex items-center gap-1 text-muted-foreground"><MapPin size={14} />{job.location_address}</span>}
                {getJobDistance(job) !== null && (
                  <span className="flex items-center gap-1 text-accent-foreground font-medium">
                    <Navigation size={12} />{getJobDistance(job)!.toFixed(1)} km away
                  </span>
                )}
                <span className="flex items-center gap-1 text-primary font-medium"><DollarSign size={14} />{formatPay(job)}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Clock size={12} />{timeAgo(job.created_at)}</span>
              </div>

              {job.skills_required && job.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.skills_required.map((skill) => <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>)}
                </div>
              )}

              {/* Quick Apply */}
              {appliedJobIds.has(job.id) ? (
                <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <Send size={14} /> Applied
                </div>
              ) : (
                <Button size="sm" onClick={() => handleApply(job.id)} className="gap-1.5">
                  <Send size={14} /> Quick Apply
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <JobMapView
          jobs={filteredJobs}
          savedJobIds={savedJobIds}
          appliedJobIds={appliedJobIds}
          onApply={handleApply}
          onToggleSave={handleToggleSave}
          formatPay={formatPay}
          userLocation={userLocation}
          homeLocation={homeLocation ? { lat: homeLocation.lat, lng: homeLocation.lng } : null}
          onUseHomeLocation={handleUseHomeLocation}
          locationSource={locationSource}
          onRequestLocation={handleRequestLocation}
          locatingUser={locatingUser}
          radiusKm={radiusKm}
        />
      )}

      {/* Report Dialog */}
      <Dialog open={!!reportJobId} onOpenChange={(open) => !open && setReportJobId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Job Posting</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fraudulent">Fraudulent / Scam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="misleading">Misleading Information</SelectItem>
                  <SelectItem value="duplicate">Duplicate Posting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <Textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Tell us more..." rows={3} />
            </div>
            <Button onClick={handleReport} disabled={!reportReason}>Submit Report</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
