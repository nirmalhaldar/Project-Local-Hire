import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, DollarSign, List, Map, Clock, Briefcase, Heart, Send, Bookmark, BookmarkCheck, Flag, ChevronDown, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

  useEffect(() => {
    fetchJobs();
    if (user) { fetchSavedJobs(); fetchAppliedJobs(); }
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

  const filteredJobs = jobs.filter((job) => {
    const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.description?.toLowerCase().includes(search.toLowerCase()) || job.location_address?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || job.category === category;
    const matchType = jobType === "all" || job.job_type === jobType;
    const matchRole = role === "All Roles" || (job.roles_required || []).includes(role);
    const matchSalary = !job.pay_max || job.pay_max >= salaryRange[0];
    return matchSearch && matchCategory && matchType && matchRole && matchSalary;
  });

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
            <Input placeholder="Search jobs, skills, locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-1">
              Filters <ChevronDown size={14} className={`transition ${showFilters ? "rotate-180" : ""}`} />
            </Button>
            <div className="flex gap-1 border border-border rounded-lg p-1">
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}><List size={16} /></Button>
              <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("map")}><Map size={16} /></Button>
            </div>
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
            </div>
          </Card>
        )}
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
        <Card className="h-[500px] flex items-center justify-center">
          <div className="text-center">
            <Map className="mx-auto text-muted-foreground mb-3" size={48} />
            <h3 className="font-display font-semibold text-lg text-foreground mb-1">Map View</h3>
            <p className="text-muted-foreground text-sm">{filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} available</p>
            <p className="text-muted-foreground text-xs mt-2">Google Maps integration coming soon.</p>
          </div>
        </Card>
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
