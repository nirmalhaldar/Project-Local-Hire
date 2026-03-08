import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, MapPin, IndianRupee, Clock, Briefcase, Bookmark, BookmarkCheck, Send } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_address: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  job_type: string | null;
  skills_required: string[];
  roles_required: string[];
  created_at: string;
  employer_id: string;
}

const CATEGORIES = [
  "Construction & Infrastructure", "Transportation & Driving", "Manufacturing & Factory",
  "Maintenance & Repair", "Home & Personal Services", "Hospitality & Retail",
  "Agriculture & Farming", "Logistics & Warehouse", "Gig & On-Demand",
  "Healthcare Support", "Construction Equipment",
];

const JOB_TYPES = [
  { value: "gig", label: "Gig" },
  { value: "part-time", label: "Part-Time" },
  { value: "full-time", label: "Full-Time" },
  { value: "contract", label: "Contract" },
];

export default function BrowseJobs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (user && userRole === "worker") {
      fetchSavedJobs();
      fetchAppliedJobs();
    }
  }, [user, userRole]);

  // Sync search params to state
  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    if (q !== null) setSearch(q);
    if (cat !== null) setCategoryFilter(cat);
  }, [searchParams]);

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
    setJobs((data || []) as Job[]);
    setLoading(false);
  };

  const fetchSavedJobs = async () => {
    const { data } = await supabase.from("saved_jobs").select("job_id").eq("user_id", user!.id);
    setSavedJobIds(new Set((data || []).map((s) => s.job_id)));
  };

  const fetchAppliedJobs = async () => {
    const { data } = await supabase.from("job_applications").select("job_id").eq("worker_id", user!.id);
    setAppliedJobIds(new Set((data || []).map((a) => a.job_id)));
  };

  const handleApply = async (jobId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in as a worker to apply for jobs.", variant: "destructive" });
      navigate("/auth?mode=login");
      return;
    }
    if (userRole !== "worker") {
      toast({ title: "Worker Account Required", description: "Only workers can apply for jobs. Please log in with a worker account.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("job_applications").insert({ job_id: jobId, worker_id: user.id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setAppliedJobIds(new Set([...appliedJobIds, jobId]));
    toast({ title: "Applied!", description: "Your application has been submitted." });
  };

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to save jobs.", variant: "destructive" });
      navigate("/auth?mode=login");
      return;
    }
    if (savedJobIds.has(jobId)) {
      await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
      const next = new Set(savedJobIds);
      next.delete(jobId);
      setSavedJobIds(next);
    } else {
      await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId });
      setSavedJobIds(new Set([...savedJobIds, jobId]));
    }
  };

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (search) {
        const q = search.toLowerCase();
        if (!(j.title.toLowerCase().includes(q) || j.category.toLowerCase().includes(q) || (j.skills_required || []).some(s => s.toLowerCase().includes(q)) || (j.roles_required || []).some(r => r.toLowerCase().includes(q)))) return false;
      }
      if (categoryFilter !== "all" && j.category !== categoryFilter) return false;
      if (typeFilter !== "all" && j.job_type !== typeFilter) return false;
      return true;
    });
  }, [jobs, search, categoryFilter, typeFilter]);

  const formatPay = (job: Job) => {
    if (!job.pay_min && !job.pay_max) return "Negotiable";
    const min = job.pay_min ? `${job.pay_min}` : "";
    const max = job.pay_max ? `${job.pay_max}` : "";
    const type = job.pay_type === "hourly" ? "/hr" : job.pay_type === "daily" ? "/day" : "";
    return min && max ? `${min} - ${max}${type}` : `${min || max}${type}`;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">Browse Jobs</h1>
          <p className="text-muted-foreground">Find open positions near you</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, skills, roles..."
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Job Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} job{filtered.length !== 1 ? "s" : ""} found</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 animate-pulse"><div className="h-20 bg-muted rounded" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground text-lg">No jobs found</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <Card key={job.id} className="p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 max-w-2xl">{job.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleSave(job.id)}
                    className="p-2 hover:bg-muted rounded-lg transition shrink-0"
                  >
                    {savedJobIds.has(job.id)
                      ? <BookmarkCheck size={18} className="text-primary" />
                      : <Bookmark size={18} className="text-muted-foreground" />
                    }
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                  <Badge variant="secondary">{job.category}</Badge>
                  {job.job_type && <Badge variant="outline" className="capitalize">{job.job_type}</Badge>}
                  {job.location_address && (
                    <span className="flex items-center gap-1"><MapPin size={13} />{job.location_address}</span>
                  )}
                  <span className="flex items-center gap-1 text-primary font-medium"><IndianRupee size={13} />{formatPay(job)}</span>
                  <span className="flex items-center gap-1"><Clock size={13} />{timeAgo(job.created_at)}</span>
                </div>

                {(job.skills_required?.length > 0 || job.roles_required?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(job.roles_required || []).map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                    {(job.skills_required || []).map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                )}

                <div>
                  {appliedJobIds.has(job.id) ? (
                    <span className="text-sm font-medium text-primary flex items-center gap-1.5">
                      <Send size={14} /> Applied
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => handleApply(job.id)}>
                      Quick Apply
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
